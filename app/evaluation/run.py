"""평가 실행.

    python -m app.evaluation.run                        # 검색만 (빠름, 모델 불필요)
    python -m app.evaluation.run --answers              # 답변 생성까지 채점
    python -m app.evaluation.run --answers --baseline   # 무검색 대비군과 비교

검색만 돌리는 모드가 기본이다. Recall 이 생성 품질의 천장이므로
여기부터 보는 것이 맞고, 자동 채점이라 초 단위로 끝난다.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

from app.config import settings
from app.db.session import connect
from app.evaluation.dataset import DatasetError, Question, load_questions
from app.evaluation.metrics import (
    DEFAULT_KS, QuestionScore, Report, format_report, matched_rank,
)
from app.providers.base import get_embedding_provider, get_llm_provider
from app.retrieval.answer import NOT_FOUND, answer_question
from app.retrieval.search import detect_products, search

DEFAULT_SET = Path("data/eval/questions.yaml")
RESULTS_DIR = Path("data/eval/results")


def _said_not_found(text: str) -> bool:
    return NOT_FOUND.rstrip(".") in text


def evaluate(
    questions: list[Question],
    with_answers: bool,
    baseline: bool,
    top_k: int,
) -> tuple[Report, Report | None]:
    embedder = get_embedding_provider()
    llm = get_llm_provider() if (with_answers or baseline) else None

    scores: list[QuestionScore] = []
    base_scores: list[QuestionScore] = []

    with connect() as conn:
        for q in questions:
            hits = search(
                conn, q.question, embedder.embed([q.question])[0],
                top_k=top_k, products=detect_products(q.question),
            )
            score = QuestionScore(
                id=q.id,
                rank=None if q.unanswerable else matched_rank(hits, q.answers),
                tags=q.tags,
                unanswerable=q.unanswerable,
            )

            if with_answers:
                res = answer_question(conn, q.question, embedder, llm, top_k=top_k)
                if q.unanswerable:
                    score.answered_not_found = _said_not_found(res.answer)
                elif q.expect:
                    score.expect_hit = q.expect.lower() in res.answer.lower()

                if baseline:
                    b = answer_question(
                        conn, q.question, embedder, llm, top_k=top_k, use_rag=False
                    )
                    bs = QuestionScore(
                        id=q.id, rank=None, tags=q.tags, unanswerable=q.unanswerable
                    )
                    if q.unanswerable:
                        bs.answered_not_found = _said_not_found(b.answer)
                    elif q.expect:
                        bs.expect_hit = q.expect.lower() in b.answer.lower()
                    base_scores.append(bs)

            scores.append(score)
            print(f"  {q.id} rank={score.rank}", file=sys.stderr)

    return (
        Report(scores),
        Report(base_scores, retrieval=False) if baseline else None,
    )


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="검색·답변 품질 평가")
    ap.add_argument("--questions", type=Path, default=DEFAULT_SET)
    ap.add_argument("--top-k", type=int, default=max(DEFAULT_KS))
    ap.add_argument("--answers", action="store_true", help="답변 생성까지 채점")
    ap.add_argument("--baseline", action="store_true",
                    help="무검색(use_rag=false) 대비군과 비교. --answers 필요")
    ap.add_argument("--label", default="", help="결과 파일에 붙일 이름")
    args = ap.parse_args(argv)

    if args.baseline and not args.answers:
        ap.error("--baseline 은 --answers 와 함께 써야 한다.")

    try:
        questions = load_questions(args.questions)
    except DatasetError as exc:
        print(exc, file=sys.stderr)
        return 2

    report, base = evaluate(questions, args.answers, args.baseline, args.top_k)

    print()
    print(format_report(report, "=== RAG ==="))
    if base:
        print()
        print(format_report(base, "=== 무검색 대비군 (동일 모델) ==="))
        a, b = report.answer_accuracy(), base.answer_accuracy()
        if a is not None and b is not None:
            print(f"\n답변 정확도: 무검색 {b:.3f} -> RAG {a:.3f}  (차이 {a - b:+.3f})")

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    name = f"{stamp}{'-' + args.label if args.label else ''}.json"
    out = RESULTS_DIR / name
    out.write_text(
        json.dumps(
            {
                "label": args.label,
                "questions_file": str(args.questions),
                "top_k": args.top_k,
                "embedding_model": settings.embedding_model,
                "llm_model": settings.llm_model if args.answers else None,
                "rag": report.to_dict(),
                "baseline": base.to_dict() if base else None,
            },
            ensure_ascii=False, indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\n결과 저장: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

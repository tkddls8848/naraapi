"""정답표 로딩과 검증.

정답표는 사람이 만든다. 질문 하나마다 정답이 실린 문서와 페이지를 직접
확인해 적어야 한다. 지겹지만 이 작업이 평가의 전부다 — 이게 없으면
무엇을 바꿔도 나아졌는지 알 수 없다.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml


@dataclass
class GoldAnswer:
    document: str            # documents.title 과 일치해야 한다
    pages: list[int]


@dataclass
class Question:
    id: str
    question: str
    answers: list[GoldAnswer] = field(default_factory=list)
    expect: str | None = None       # 답변에 반드시 포함돼야 하는 문자열(스펙 값)
    unanswerable: bool = False      # 문서에 답이 없는 함정 질문
    tags: list[str] = field(default_factory=list)


class DatasetError(ValueError):
    pass


def load_questions(path: str | Path) -> list[Question]:
    path = Path(path)
    if not path.exists():
        raise DatasetError(
            f"정답표가 없다: {path}\n"
            f"data/eval/questions.example.yaml 을 복사해 채워라."
        )

    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    items = raw.get("questions")
    if not items:
        raise DatasetError(f"{path} 에 questions 항목이 비어 있다.")

    out: list[Question] = []
    seen: set[str] = set()
    for i, item in enumerate(items, start=1):
        qid = str(item.get("id") or f"q{i:03d}")
        if qid in seen:
            raise DatasetError(f"중복 id: {qid}")
        seen.add(qid)

        text = (item.get("question") or "").strip()
        if not text:
            raise DatasetError(f"{qid}: question 이 비어 있다.")

        unanswerable = bool(item.get("unanswerable", False))
        answers = [
            GoldAnswer(document=a["document"], pages=[int(p) for p in a["pages"]])
            for a in (item.get("answers") or [])
        ]
        # 답이 있어야 할 질문에 정답 위치가 없으면 Recall 을 계산할 수 없다.
        if not unanswerable and not answers:
            raise DatasetError(
                f"{qid}: answers 가 비어 있다. "
                f"문서에 답이 없는 질문이면 unanswerable: true 를 달아라."
            )

        out.append(
            Question(
                id=qid, question=text, answers=answers,
                expect=item.get("expect"), unanswerable=unanswerable,
                tags=list(item.get("tags") or []),
            )
        )
    return out

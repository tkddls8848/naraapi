"""채점.

검색이 실패하면 생성은 무조건 실패한다. 그래서 Recall 을 먼저 본다.
답변이 나쁠 때 프롬프트부터 손대면 대개 시간을 낭비한다.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Protocol, Sequence

DEFAULT_KS = (1, 3, 5, 10)


class HitLike(Protocol):
    doc_title: str
    page_from: int
    page_to: int


class AnswerLike(Protocol):
    document: str
    pages: list[int]


def hit_matches(hit: HitLike, answers: Sequence[AnswerLike]) -> bool:
    """청크가 정답 위치를 덮는가.

    청크는 페이지를 걸칠 수 있으므로 범위 겹침으로 판정한다.
    """
    for a in answers:
        if hit.doc_title != a.document:
            continue
        if any(hit.page_from <= p <= hit.page_to for p in a.pages):
            return True
    return False


def matched_rank(hits: Sequence[HitLike], answers: Sequence[AnswerLike]) -> int | None:
    """정답을 처음 맞힌 순위(1-based). 못 찾으면 None."""
    for i, hit in enumerate(hits, start=1):
        if hit_matches(hit, answers):
            return i
    return None


@dataclass
class QuestionScore:
    id: str
    rank: int | None                  # 정답 문단의 순위
    tags: list[str] = field(default_factory=list)
    unanswerable: bool = False
    answered_not_found: bool | None = None   # 정직도: "찾지 못했다"고 답했는가
    expect_hit: bool | None = None           # 기대 문자열이 답변에 있는가

    def recall_at(self, k: int) -> bool:
        return self.rank is not None and self.rank <= k


@dataclass
class Report:
    scores: list[QuestionScore]
    ks: tuple[int, ...] = DEFAULT_KS
    # 무검색 대비군은 검색 단계가 없다. Recall 을 0 으로 표시하면
    # "검색에 실패했다"로 오독되므로 아예 해당 없음으로 다룬다.
    retrieval: bool = True

    @property
    def answerable(self) -> list[QuestionScore]:
        return [s for s in self.scores if not s.unanswerable]

    @property
    def traps(self) -> list[QuestionScore]:
        return [s for s in self.scores if s.unanswerable]

    def recall(self, k: int) -> float | None:
        rows = self.answerable
        if not self.retrieval or not rows:
            return None
        return sum(s.recall_at(k) for s in rows) / len(rows)

    def mrr(self) -> float | None:
        rows = self.answerable
        if not self.retrieval or not rows:
            return None
        return sum(1.0 / s.rank if s.rank else 0.0 for s in rows) / len(rows)

    def answer_accuracy(self) -> float | None:
        rows = [s for s in self.answerable if s.expect_hit is not None]
        return sum(s.expect_hit for s in rows) / len(rows) if rows else None

    def honesty(self) -> float | None:
        """답이 없는 질문에 '찾지 못했다'고 답한 비율."""
        rows = [s for s in self.traps if s.answered_not_found is not None]
        return sum(s.answered_not_found for s in rows) / len(rows) if rows else None

    def by_tag(self, k: int) -> dict[str, float]:
        if not self.retrieval:
            return {}
        buckets: dict[str, list[QuestionScore]] = {}
        for s in self.answerable:
            for t in s.tags:
                buckets.setdefault(t, []).append(s)
        return {
            t: sum(x.recall_at(k) for x in rows) / len(rows)
            for t, rows in sorted(buckets.items())
        }

    def to_dict(self) -> dict:
        return {
            "questions": len(self.scores),
            "answerable": len(self.answerable),
            "unanswerable": len(self.traps),
            "recall": {f"@{k}": self.recall(k) for k in self.ks},
            "mrr": self.mrr(),
            "answer_accuracy": self.answer_accuracy(),
            "honesty": self.honesty(),
            "by_tag": {f"@{max(self.ks)}": self.by_tag(max(self.ks))},
            "per_question": [
                {"id": s.id, "rank": s.rank, "tags": s.tags,
                 "unanswerable": s.unanswerable,
                 "expect_hit": s.expect_hit,
                 "answered_not_found": s.answered_not_found}
                for s in self.scores
            ],
        }


def _pct(v: float | None) -> str:
    return "  -  " if v is None else f"{v:6.3f}"


def format_report(report: Report, title: str = "") -> str:
    lines = []
    if title:
        lines.append(title)
    lines.append(
        f"  질문 {len(report.scores)}개 "
        f"(정답 있음 {len(report.answerable)} / 함정 {len(report.traps)})"
    )
    if report.retrieval:
        for k in report.ks:
            lines.append(f"  Recall@{k:<3}       {_pct(report.recall(k))}")
        lines.append(f"  MRR             {_pct(report.mrr())}")
    else:
        lines.append("  Recall/MRR       해당 없음 (검색 단계가 없음)")
    if report.answer_accuracy() is not None:
        lines.append(f"  답변 정확도      {_pct(report.answer_accuracy())}")
    if report.honesty() is not None:
        lines.append(f"  정직도           {_pct(report.honesty())}")

    tags = report.by_tag(max(report.ks))
    if tags:
        lines.append(f"  태그별 Recall@{max(report.ks)}:")
        for t, v in tags.items():
            lines.append(f"    {t:<22} {_pct(v)}")
    return "\n".join(lines)

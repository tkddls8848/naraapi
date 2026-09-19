"""정답표 초안 생성기.

색인 대상 문서의 표에서 "키: 값" 형태의 스펙 행을 골라 질문 후보를 만든다.
정답 위치(문서·페이지)는 파싱 과정에서 이미 알고 있으므로 자동으로 채워진다.

주의 — 이 초안을 그대로 쓰면 안 된다.
  1. 같은 파이프라인이 만든 문제를 같은 파이프라인이 푸는 셈이라,
     검색이 맞히기 쉬운 쪽으로 편향된다. 점수가 실제보다 높게 나온다.
  2. 그래서 실무에서 실제로 나오는 질문을 직접 섞어야 의미가 있다.
  3. 생성된 expect 값과 페이지는 사람이 원문과 대조해 확인해야 한다.

    python tools/draft_questions.py data/pdfs/*.pdf -n 5 > data/eval/draft.yaml
"""
from __future__ import annotations

import argparse
import contextlib
import re
import sys
from collections import defaultdict
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.ingest.parser import TableRowBlock, parse_pdf  # noqa: E402

# 단위가 붙은 값은 질문으로 만들기 좋다. 정답이 하나로 떨어진다.
UNIT = re.compile(
    r"\b\d+(\.\d+)?\s*(GB|TB|MB|PB|MHz|GHz|W|V|A|mm|kg|lb|U|nm|Gb/s|MT/s)\b", re.I
)
HAS_DIGIT = re.compile(r"\d")

# 값이 아니라 설명문인 키들. 질문으로 만들면 정답이 모호해진다.
KEY_BLOCKLIST = {"description", "notes", "note", "comments", "part number description"}

# 키가 부품번호·feature code 인 표는 스펙표가 아니라 조회표다.
# 이런 행으로 질문을 만들면 "SR630 V4 의 4X97B17362 는?" 같은,
# 아무도 묻지 않는 질문이 나온다.
CODE_KEY = re.compile(r"^[A-Z0-9][A-Z0-9/\-]{2,}$")
# 사람이 읽는 항목 이름에는 소문자가 있다. (Form factor, Memory maximum ...)
HUMAN_KEY = re.compile(r"[a-z]")
# 숫자로 시작하는 첫 열은 항목명이 아니라 구성 설명이다.
# ("8 drive bays", "2x 2.5-inch Rear SAS/SATA") 질문으로 만들면 뜻이 통하지 않는다.
CONFIG_KEY = re.compile(r"^\d")


def _score(key: str, value: str, section: str) -> int:
    """질문 후보로서의 적합도. 높을수록 좋다."""
    score = 0
    low = section.lower()
    if "specification" in low:
        score += 6          # 표준 사양표가 가장 질문답다
    elif any(w in low for w in ("memory", "processor", "power", "cooling", "drive")):
        score += 3
    if UNIT.search(value):
        score += 5          # 단위 있는 수치가 최상
    if HAS_DIGIT.search(value):
        score += 1
    if len(value) <= 40:
        score += 2
    elif len(value) <= 80:
        score += 1
    return score


def _candidates(path: Path) -> list[dict]:
    # PyMuPDF 가 stdout 으로 안내 문구를 출력한다. YAML 을 stdout 으로
    # 내보내므로 파싱 중 출력은 stderr 로 돌린다.
    with contextlib.redirect_stdout(sys.stderr):
        doc = parse_pdf(path)

    out: list[dict] = []
    for block in doc.blocks:
        if not isinstance(block, TableRowBlock) or len(block.pairs) != 1:
            continue                    # 키-값 표만 사용
        key, value = block.pairs[0][0].strip(), block.pairs[0][1].strip()

        if not key or not value or key.lower() in KEY_BLOCKLIST:
            continue
        if CODE_KEY.match(key) or CONFIG_KEY.match(key) or not HUMAN_KEY.search(key):
            continue
        if not (2 <= len(key) <= 40 and 3 <= len(value) <= 120):
            continue
        if not HAS_DIGIT.search(value):
            continue

        products = [p for p in doc.products if p.split()[1] in block.render()]
        out.append({
            "product": (products or doc.products)[0],
            "document": doc.title,
            "page": block.page,
            "section": block.section_path,
            "key": key,
            "value": value,
            "score": _score(key, value, block.section_path),
        })
    return out


def _pick(rows: list[dict], per_doc: int, key_cap: int) -> list[dict]:
    """전 문서를 한꺼번에 놓고 고른다.

    문서별로 따로 고르면 모든 문서에서 같은 항목(Form factor 등)이 뽑혀
    질문이 단조로워진다. 같은 항목은 key_cap 회까지만 허용하되, 서로 다른
    제품에 대해 반복되는 것은 모델 혼동 검증에 쓸모가 있으므로 완전히
    막지는 않는다.
    """
    rows.sort(key=lambda r: (-r["score"], r["document"], r["page"]))
    per_doc_count: dict[str, int] = defaultdict(int)
    key_count: dict[str, int] = defaultdict(int)
    seen_section: dict[str, set[str]] = defaultdict(set)
    picked: list[dict] = []

    for r in rows:
        doc, key = r["document"], r["key"].lower()
        if per_doc_count[doc] >= per_doc or key_count[key] >= key_cap:
            continue
        if r["section"] in seen_section[doc]:
            continue
        picked.append(r)
        per_doc_count[doc] += 1
        key_count[key] += 1
        seen_section[doc].add(r["section"])

    picked.sort(key=lambda r: (r["document"], r["page"]))
    return picked


HEADER = """\
# 정답표 초안 — 자동 생성. 그대로 쓰지 말 것.
#
# 반드시 할 일
#   1. 각 항목의 페이지와 expect 값을 원문과 대조해 확인
#   2. 질문 문구를 실제 사람이 물어볼 법하게 다듬기
#   3. 실무에서 실제로 나오는 질문을 직접 추가 (최소 10개)
#   4. 답이 없는 함정 질문 추가 (unanswerable: true)
#
# 이 초안만으로 측정하면 점수가 실제보다 높게 나온다.
# 색인 파이프라인이 만든 문제를 같은 파이프라인이 푸는 구조이기 때문이다.
"""

FOOTER = """\
  # --- 아래는 직접 작성 ---
  # - id: m001
  #   question: (실무에서 실제로 받는 질문)
  #   answers:
  #     - document: ...
  #       pages: [...]
  #
  # - id: x001
  #   question: (문서에 답이 없는 질문)
  #   unanswerable: true
  #   tags: [honesty]
"""


def _emit(rows: list[dict]) -> str:
    """YAML 로 직렬화한다.

    문자열을 직접 조립하면 값에 따옴표가 들어갈 때 파일이 깨진다.
    (실제로 겪음: '... for 4/8x 2.5" NVMe')
    """
    questions = []
    for i, r in enumerate(rows, start=1):
        item = {
            "id": f"d{i:03d}",
            "question": "{} 의 {} 는?".format(r["product"], r["key"]),
            "answers": [{"document": r["document"], "pages": [r["page"]]}],
        }
        # 값이 길면 expect 를 채우지 않는다. 잘라서 넣으면 단어 중간에서
        # 끊겨 영영 매칭되지 않는 죽은 기준이 된다.
        if len(r["value"]) <= 60:
            item["expect"] = r["value"]
        item["tags"] = ["spec", "auto-draft"]
        item["_section"] = r["section"]   # 참고용. 로더는 무시한다
        questions.append(item)

    body = yaml.safe_dump(
        {"questions": questions},
        allow_unicode=True, sort_keys=False, default_flow_style=False, width=100,
    )
    out = f"{HEADER}\n{body}\n{FOOTER}"

    # 깨진 YAML 을 내보내지 않는다. 여기서 실패하면 도구 버그다.
    if len((yaml.safe_load(out) or {}).get("questions") or []) != len(questions):
        raise RuntimeError("생성한 YAML 이 온전하지 않다.")
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="정답표 초안 생성")
    ap.add_argument("paths", nargs="+", type=Path)
    ap.add_argument("-n", "--per-doc", type=int, default=5,
                    help="문서당 질문 수 (기본 5)")
    ap.add_argument("--key-cap", type=int, default=2,
                    help="같은 항목명을 최대 몇 번까지 쓸지 (기본 2)")
    args = ap.parse_args()

    rows: list[dict] = []
    for p in args.paths:
        found = _candidates(p)
        rows.extend(found)
        print(f"{p.name}: 후보 {len(found)}", file=sys.stderr)

    picked = _pick(rows, args.per_doc, args.key_cap)
    print(f"선택 {len(picked)}개", file=sys.stderr)
    print(_emit(picked))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

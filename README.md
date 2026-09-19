# 사내 지식 RAG PoC

사내에 흩어져 있는 문서(규정집, 제안서, 장비 스펙, 보고서)를 모아 색인하고,
자연어 질문에 **출처와 함께** 답변하는 사내 특화 질의응답 시스템의 개념검증(PoC).

## 현재 상태

**색인 파이프라인 구현 완료.** 검색·질의응답 API는 아직 없습니다.

| 단계 | 상태 |
|---|---|
| PDF 파싱 · 청킹 | 완료. 실제 Lenovo Press 문서로 검증 |
| 임베딩 · DB 적재 | 코드 완료. 실행 검증은 로컬 환경 필요 |
| 검색 · 질의응답 API | 완료. 실제 PostgreSQL 로 검증 |
| 평가 스크립트 | 완료. 정답표는 직접 작성해야 함 |

| 문서 | 내용 |
|---|---|
| [docs/architecture.md](docs/architecture.md) | 전체 구조, 구성 요소, 데이터 모델, 평가 방법 |
| [docs/decisions.md](docs/decisions.md) | 기술 선택의 근거와 트레이드오프 (ADR) |

## 한 줄 요약

```
PDF/Office 문서 → 파싱 → 청킹 → 임베딩 → PostgreSQL(pgvector)
                                              ↓
                    질문 → 하이브리드 검색 → LLM → 답변 + 출처
```

## 결정된 스택

| 영역 | 선택 | 한 줄 이유 |
|---|---|---|
| 언어/프레임워크 | Python 3.12 + FastAPI | 문서 파싱 생태계가 Python에 집중 |
| 저장소 | PostgreSQL 16 + pgvector | 메타데이터·본문·벡터를 한 DB에서 관리 |
| 모델 런타임 | Ollama | 임베딩·생성을 한 런타임으로 처리 |
| 임베딩 | `bge-m3` (1024차원) | 한국어 지원, 로컬 고정 |
| 생성 | 로컬 모델 우선, 교체 가능 | 문서가 외부로 나가지 않는 상태로 먼저 검증 |
| 실행 환경 | Docker Compose (로컬) | PoC 단계는 노트북에서 완결 |

## 범위

**이번 PoC에서 검증할 것**

1. 사내 PDF/Office 문서를 자동으로 색인할 수 있는가
2. 한국어 질문에 대해 관련 문단을 제대로 찾아오는가
3. 답변의 출처(문서명·페이지)를 정확히 제시하는가
4. 로컬 모델만으로 실무에 쓸 만한 품질이 나오는가

**이번 PoC에서 다루지 않는 것**

- 사용자 인증, 문서별 접근 권한 분리
- Confluence·그룹웨어 등 외부 시스템 연동
- 다중 사용자 동시 접속, 운영 수준의 가용성
- 사내 서버 배포를 위한 IaC (구조만 준비, 구현은 이후)

## 실행

### 파싱만 확인 (DB·모델 불필요)

```bash
python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt
./.venv/bin/python -m app.ingest.cli --dry-run data/pdfs/*.pdf
```

### 전체 색인

```bash
cp .env.example .env          # 비밀번호 수정
docker compose up -d
docker compose exec ollama ollama pull bge-m3
./.venv/bin/python -m app.ingest.cli -v data/pdfs/*.pdf
```

`--force` 로 재색인, `-v` 로 진행 상황 출력.

### 질의응답

```bash
docker compose exec ollama ollama pull qwen3:8b
./.venv/bin/uvicorn app.api.main:app --reload      # 또는 docker compose up app
```

```bash
curl -X POST localhost:8000/ask -H 'content-type: application/json' \
  -d '{"question":"SR650 V4 최대 메모리 용량은?"}'
```

| 엔드포인트 | 용도 |
|---|---|
| `POST /ask` | 질문 → 답변 + 출처. `use_rag:false` 로 무검색 대비군 |
| `GET /documents` | 색인된 문서와 상태 |
| `GET /health` | 상태 확인 |

### 모델 없이 경로만 확인

```bash
EMBEDDING_PROVIDER=fake LLM_PROVIDER=fake ./.venv/bin/python -m app.ingest.cli data/pdfs/*.pdf
```

`fake` 제공자는 결정적 해시 임베딩과 더미 생성기입니다. 모델 다운로드 없이
색인·검색·API 경로를 통째로 돌려볼 수 있습니다. 운영에는 쓰지 않습니다.

## 검증된 동작

제품 가이드 6건(787페이지, 청크 5,415개) 전부 파싱 확인:

| 문서 | 페이지 | 청크 (표 / 산문) |
|---|---|---|
| SR630 V4 | 156 | 1,086 (1,012 / 74) |
| SR650 V4 | 200 | 1,574 (1,493 / 81) |
| SR650a V4 + SR650i V4 | 132 | 999 (841 / 158) |
| SR680a V4 | 65 | 326 (275 / 51) |
| SR850 V4 | 112 | 656 (588 / 68) |
| SR860 V4 | 122 | 774 (707 / 67) |

처리한 문서 특성:

- TOC 에서 섹션 경로 확정 → **섹션 미할당 청크 0개**
- 표 캡션 행과 그룹 구분 행을 데이터에서 분리
- 2단 그룹 헤더 병합 (`Accelerators` + `QAT` → `Accelerators QAT`)
- **한 문서가 제품 2종을 다루는 경우 분리 태깅**

청크는 단독으로 읽히도록 제품명과 섹션을 포함합니다.

```
ThinkSystem SR680a V4 > Standard specifications
Memory maximum: Up to 4TB by using 32x 128GB RDIMMs
```

SR650a/SR650i 합본 문서는 본문이 한쪽만 가리킬 때 그 모델로 좁힙니다.
이것이 모델 혼동을 막는 1차 방어선이고, 2차는 검색 단계의 `products` 필터입니다.

```
ThinkSystem SR650i V4 > Inference Model
Description: ThinkSystem SR650i V4 Inference Configuration
```

## 검색 동작

밀집(pgvector 코사인) + 희소(전문검색) 두 경로를 RRF 로 결합합니다.
질문에서 모델명을 감지해 해당 모델 청크로 범위를 좁힙니다.

실제 PostgreSQL 에 SR650 V4(1,574청크) 와 SR650a/SR650i V4(999청크) 를
색인하고 확인한 결과:

```
질문: "SR650i V4 Inference Configuration"
  자동 필터: ['ThinkSystem SR650i V4']
  1위: ... p15  ['ThinkSystem SR650i V4']      ← SR650i 전용 청크
  → SR650 V4 청크 1,574개 중 단 한 건도 섞이지 않음

질문: "존재하지 않는 모델 SR999 V9 스펙"
  → "제공된 문서에서 찾지 못했습니다."  (출처 0건)
```

## 평가

바꾼 것이 나아졌는지 숫자로 판단하기 위한 도구입니다.

### 정답표 작성

```bash
cp data/eval/questions.example.yaml data/eval/questions.yaml
```

질문마다 정답이 실린 문서와 페이지를 직접 확인해 적습니다.
이 작업이 평가의 전부입니다 — 없으면 무엇을 바꿔도 나아졌는지 알 수 없습니다.

```yaml
- id: q001
  question: SR680a V4 최대 메모리 용량은?
  answers:
    - document: Lenovo ThinkSystem SR680a V4 Server
      pages: [10]
  expect: "4TB"          # 답변에 이 문자열이 있는지 자동 채점
  tags: [spec, memory]
```

문서에 답이 없는 함정 질문은 `unanswerable: true` 로 표시합니다.
지어내지 않고 "찾지 못했습니다"라고 답하는지 보는 용도입니다.

### 실행

```bash
python -m app.evaluation.run                        # 검색만. 모델 불필요, 초 단위
python -m app.evaluation.run --answers              # 답변 생성까지 채점
python -m app.evaluation.run --answers --baseline   # 무검색 대비군과 비교
```

### 지표

| 지표 | 의미 |
|---|---|
| Recall@k | 정답 문단이 상위 k개에 들어온 비율. **생성 품질의 천장** |
| MRR | 정답을 몇 번째로 맞혔는지 |
| 답변 정확도 | `expect` 문자열이 답변에 있는가 |
| 정직도 | 답 없는 질문에 "찾지 못했다"고 답한 비율 |
| 태그별 Recall | 어떤 질문 유형에서 깨지는지 |

검색이 실패하면 생성은 무조건 실패합니다. **Recall 을 먼저 봅니다.**
답변이 나쁠 때 프롬프트부터 손대면 대개 시간을 낭비합니다.

무검색 대비군에는 검색 단계가 없으므로 Recall 을 표시하지 않습니다.
비교 대상은 답변 정확도와 정직도입니다.

결과는 `data/eval/results/` 에 타임스탬프 JSON 으로 저장되어 변경 전후를
비교할 수 있습니다.

## 다음 단계

1. 정답표 작성 (질문 30~50개)
2. 나머지 문서 색인 후 전체 측정
3. 측정 결과를 보고 개선 지점 결정

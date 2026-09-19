-- 스펙 문서 RAG 스키마
-- 설계 근거는 docs/architecture.md, docs/decisions.md 참고

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS documents (
    id          bigserial PRIMARY KEY,
    source_path text        NOT NULL,
    title       text        NOT NULL,
    product     text,                      -- 예: "ThinkSystem SR680a V4"  (모델 필터링용)
    sha256      text        NOT NULL UNIQUE,
    page_count  int,
    status      text        NOT NULL DEFAULT 'pending',   -- pending|indexed|failed
    error       text,
    meta        jsonb       NOT NULL DEFAULT '{}',
    ingested_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chunks (
    id           bigserial PRIMARY KEY,
    document_id  bigint NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    ordinal      int    NOT NULL,
    kind         text   NOT NULL,          -- table_row | prose
    content      text   NOT NULL,
    section_path text,                     -- TOC 에서 확정. 예: "Memory"
    page_from    int,
    page_to      int,
    product      text,                     -- documents.product 사본(검색 필터 단순화)
    embedding    vector(1024),
    UNIQUE (document_id, ordinal)
);

-- 밀집 검색
CREATE INDEX IF NOT EXISTS chunks_embedding_idx
    ON chunks USING hnsw (embedding vector_cosine_ops);

-- 희소 검색: 모델명·파트번호 정확 매칭용
-- (한국어 형태소 분석기 부재는 decisions.md D5 의 미해결 항목)
CREATE INDEX IF NOT EXISTS chunks_fts_idx
    ON chunks USING gin (to_tsvector('simple', content));
CREATE INDEX IF NOT EXISTS chunks_trgm_idx
    ON chunks USING gin (content gin_trgm_ops);

-- 모델 혼동 차단용 필터
CREATE INDEX IF NOT EXISTS chunks_product_idx ON chunks (product);

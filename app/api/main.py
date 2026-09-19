"""질의응답 API."""
from __future__ import annotations

from dataclasses import asdict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.db.session import connect
from app.providers.base import get_embedding_provider, get_llm_provider
from app.retrieval.answer import answer_question

app = FastAPI(title="Server Spec RAG", version="0.1.0")

_embedder = None
_llm = None


def _providers():
    global _embedder, _llm
    if _embedder is None:
        _embedder = get_embedding_provider()
    if _llm is None:
        _llm = get_llm_provider()
    return _embedder, _llm


class AskRequest(BaseModel):
    question: str = Field(min_length=1)
    top_k: int | None = None
    products: list[str] | None = Field(
        default=None,
        description="모델 필터를 직접 지정. 생략하면 질문에서 자동 추출한다.",
    )
    use_rag: bool = Field(
        default=True,
        description="False 면 검색 없이 같은 모델로 답한다. 대비군 시연·평가용.",
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "embedding_model": settings.embedding_model,
            "llm_model": settings.llm_model}


@app.get("/documents")
def documents() -> dict:
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """SELECT d.id, d.title, d.products, d.page_count, d.status, d.error,
                      count(c.id) AS chunks
               FROM documents d LEFT JOIN chunks c ON c.document_id = d.id
               GROUP BY d.id ORDER BY d.title"""
        )
        rows = cur.fetchall()
    return {
        "documents": [
            {"id": r[0], "title": r[1], "products": list(r[2] or []),
             "pages": r[3], "status": r[4], "error": r[5], "chunks": r[6]}
            for r in rows
        ]
    }


@app.post("/ask")
def ask(req: AskRequest) -> dict:
    embedder, llm = _providers()
    try:
        with connect() as conn:
            result = answer_question(
                conn, req.question, embedder, llm,
                top_k=req.top_k, products=req.products, use_rag=req.use_rag,
            )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return asdict(result)

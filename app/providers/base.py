"""제공자 추상화.

인터페이스를 의도적으로 좁게 유지한다. 특정 제공자에만 있는 기능을 여기 넣는
순간 추상화가 무너진다(decisions.md D3).
"""
from __future__ import annotations

from typing import Protocol, Sequence


class EmbeddingProvider(Protocol):
    """임베딩 생성기.

    주의: 이 구현을 바꾸면 벡터 공간이 달라져 전체 재색인이 필요하다.
    """

    @property
    def dimension(self) -> int: ...

    def embed(self, texts: Sequence[str]) -> list[list[float]]: ...


def get_embedding_provider(name: str | None = None) -> EmbeddingProvider:
    from app.config import settings

    name = (name or settings.embedding_provider).lower()
    if name == "ollama":
        from app.providers.ollama import OllamaEmbeddingProvider

        return OllamaEmbeddingProvider()
    raise ValueError(f"알 수 없는 임베딩 제공자: {name!r}")

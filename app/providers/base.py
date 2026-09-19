"""제공자 추상화.

인터페이스를 의도적으로 좁게 유지한다. 특정 제공자에만 있는 기능을 여기 넣는
순간 추상화가 무너진다(decisions.md D3).
"""
from __future__ import annotations

from typing import Protocol, Sequence


class LLMProvider(Protocol):
    """답변 생성기. 임베딩과 달리 교체해도 재색인이 필요 없다."""

    @property
    def name(self) -> str: ...

    def generate(self, system: str, user: str) -> str: ...


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
    if name == "fake":
        from app.providers.fake import FakeEmbeddingProvider

        return FakeEmbeddingProvider()
    raise ValueError(f"알 수 없는 임베딩 제공자: {name!r}")


def get_llm_provider(name: str | None = None) -> LLMProvider:
    from app.config import settings

    name = (name or settings.llm_provider).lower()
    if name == "ollama":
        from app.providers.ollama import OllamaLLMProvider

        return OllamaLLMProvider()
    if name == "fake":
        from app.providers.fake import EchoLLMProvider

        return EchoLLMProvider()
    raise ValueError(f"알 수 없는 LLM 제공자: {name!r}")

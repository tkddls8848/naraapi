"""DB 연결."""
from __future__ import annotations

from contextlib import contextmanager

import psycopg

from app.config import settings


@contextmanager
def connect():
    with psycopg.connect(settings.dsn) as conn:
        yield conn

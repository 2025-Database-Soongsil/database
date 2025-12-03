import os
import random
import time
from contextlib import contextmanager
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DEFAULT_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://ssu_data:ssu_data_pass@ssu-database-2025.cte8uwka62k7.ap-northeast-2.rds.amazonaws.com:5432/ssu_database",
)


@contextmanager
def get_conn():
    """
    Yields a connection with RealDictCursor so rows come back as dicts.
    Commits on success, rolls back on failure.
    """
    conn = psycopg2.connect(DEFAULT_DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _generate_id() -> int:
    # Use millisecond timestamp with a small random offset to avoid collisions
    return int(time.time() * 1000) * 1000 + random.randint(0, 999)


def fetch_user_by_email(email: str) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select * from "User" where email = %s limit 1', (email,))
        return cur.fetchone()


def fetch_user_by_social(provider: str, social_id: str) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "User" where provider = %s and social_id = %s limit 1',
            (provider, social_id),
        )
        return cur.fetchone()


def upsert_social_user(provider: str, social_id: str, email: str, nickname: str) -> dict:
    """
    Returns existing user if found by provider/social_id or email, otherwise inserts.
    """
    existing = fetch_user_by_social(provider, social_id)
    if existing:
        return existing

    user_by_email = fetch_user_by_email(email)
    with get_conn() as conn:
        cur = conn.cursor()
        if user_by_email:
            cur.execute(
                'update "User" set provider = %s, social_id = %s, nickname = %s, updated_at = now() where id = %s returning *',
                (provider, social_id, nickname, user_by_email["id"]),
            )
        else:
            cur.execute(
                'insert into "User" (id, email, provider, social_id, nickname, is_pregnant, created_at, updated_at) '
                'values (%s, %s, %s, %s, %s, %s, now(), now()) returning *',
                (_generate_id(), email, provider, social_id, nickname, False),
            )
        return cur.fetchone()


def delete_user_by_id(user_id: str | int) -> bool:
    """
    Delete user by id. Returns True if a row was deleted.
    """
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('delete from "User" where id = %s', (user_id,))
        return cur.rowcount > 0

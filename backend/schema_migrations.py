import time
from pathlib import Path

import psycopg2

from config import AppConfig


MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"


def run_pending_migrations(dsn: str | None = None) -> None:
    migrations = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not migrations:
        return

    connection = _connect_with_retry(dsn or AppConfig.DATABASE_DSN)
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                create table if not exists schema_migrations (
                    version text primary key,
                    applied_at timestamptz not null default now()
                )
                """
            )
            connection.commit()

        applied_versions = _load_applied_versions(connection)

        for migration_path in migrations:
            version = migration_path.name
            if version in applied_versions:
                continue

            sql = migration_path.read_text(encoding="utf-8")
            with connection.cursor() as cursor:
                cursor.execute(sql)
                cursor.execute(
                    "insert into schema_migrations (version) values (%s)",
                    (version,)
                )
            connection.commit()
    finally:
        connection.close()


def _load_applied_versions(connection) -> set[str]:
    with connection.cursor() as cursor:
        cursor.execute("select version from schema_migrations")
        return {row[0] for row in cursor.fetchall()}


def _connect_with_retry(dsn: str):
    last_error = None

    for _ in range(30):
        try:
            return psycopg2.connect(dsn)
        except psycopg2.OperationalError as error:
            last_error = error
            time.sleep(1)

    raise last_error

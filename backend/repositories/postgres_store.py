import json
import time
from pathlib import Path

import psycopg2
from psycopg2.extras import Json, RealDictCursor

LIST_RECORDS_QUERY = """
select data
from app_records
where table_name = %s
order by sort_id asc, entity_id asc
"""

GET_RECORD_QUERY = """
select data
from app_records
where table_name = %s and entity_id = %s
"""

UPSERT_RECORD_QUERY = """
insert into app_records (table_name, entity_id, sort_id, data)
values (%s, %s, %s, %s)
on conflict (table_name, entity_id)
do update set
    sort_id = excluded.sort_id,
    data = excluded.data,
    updated_at = now()
"""


class PostgresStore:
    def __init__(self, dsn):
        self.dsn = dsn
        self.seed_path = Path(__file__).resolve().parent.parent / "seed" / "mock_seed.json"
        self.seed_data = self._load_seed_data()
        self._bootstrap()

    def list_tables(self):
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute("select distinct table_name from app_records order by table_name")
            db_tables = [row[0] for row in cursor.fetchall()]

        return sorted(set(db_tables) | set(self.seed_data.keys()))

    def table_exists(self, table_name):
        return table_name in self.seed_data or table_name in self.list_tables()

    def list(self, table_name):
        self._require_table(table_name)
        return self._list_records(table_name)

    def get(self, table_name, entity_id):
        self._require_table(table_name)
        return self._get_record(table_name, entity_id)

    def create(self, table_name, payload):
        self._require_table(table_name)
        entity_id = payload.get("id") or self._next_id(table_name)
        item = {
            **payload,
            "id": entity_id
        }

        with self._connect() as connection, connection.cursor() as cursor:
            self._save_record(cursor, table_name, entity_id, item)
            connection.commit()

        return item

    def update(self, table_name, entity_id, payload):
        self._require_table(table_name)
        current = self._get_record(table_name, entity_id)
        if not current:
            return None

        updated = {
            **current,
            **payload,
            "id": current.get("id")
        }

        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                update app_records
                set data = %s,
                    updated_at = now()
                where table_name = %s and entity_id = %s
                """,
                (Json(updated), table_name, str(entity_id))
            )
            connection.commit()

        return updated

    def delete(self, table_name, entity_id):
        self._require_table(table_name)
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                "delete from app_records where table_name = %s and entity_id = %s",
                (table_name, str(entity_id))
            )
            deleted = cursor.rowcount > 0
            connection.commit()
            return deleted

    def get_meta(self, table_name):
        self._require_table(table_name)
        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                select count(*) as count, max(updated_at) as updated_at
                from app_records
                where table_name = %s
                """,
                (table_name,)
            )
            row = cursor.fetchone() or {}

        return {
            "name": table_name,
            "count": row.get("count", 0),
            "updatedAt": row.get("updated_at").isoformat() if row.get("updated_at") else None,
            "provider": "postgres"
        }

    def reset(self):
        self.seed_data = self._load_seed_data()

        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute("truncate table app_records")
            self._insert_seed_records(cursor)

            connection.commit()

    def _bootstrap(self):
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                create table if not exists app_records (
                    table_name text not null,
                    entity_id text not null,
                    sort_id bigint not null default 0,
                    data jsonb not null,
                    created_at timestamptz not null default now(),
                    updated_at timestamptz not null default now(),
                    primary key (table_name, entity_id)
                )
                """
            )

            cursor.execute(
                "select exists(select 1 from app_records)"
            )
            has_data = cursor.fetchone()[0]

            if not has_data:
                self._insert_seed_records(cursor)

            connection.commit()

    def _load_seed_data(self):
        if not self.seed_path.exists():
            return {}

        return json.loads(self.seed_path.read_text(encoding="utf-8"))

    def _next_id(self, table_name):
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                select coalesce(max(sort_id), 0) + 1
                from app_records
                where table_name = %s
                """,
                (table_name,)
            )
            return cursor.fetchone()[0]

    def _insert_seed_records(self, cursor):
        for table_name, items in self.seed_data.items():
            for item in items:
                self._insert_record(cursor, table_name, item.get("id"), item)

    def _list_records(self, table_name):
        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(LIST_RECORDS_QUERY, (table_name,))
            return [row["data"] for row in cursor.fetchall()]

    def _get_record(self, table_name, entity_id):
        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(GET_RECORD_QUERY, (table_name, str(entity_id)))
            row = cursor.fetchone()
            return row["data"] if row else None

    def _insert_record(self, cursor, table_name, entity_id, item):
        cursor.execute(
            """
            insert into app_records (table_name, entity_id, sort_id, data)
            values (%s, %s, %s, %s)
            """,
            (table_name, str(entity_id), self._sort_id(entity_id), Json(item))
        )

    def _save_record(self, cursor, table_name, entity_id, item):
        cursor.execute(
            UPSERT_RECORD_QUERY,
            (table_name, str(entity_id), self._sort_id(entity_id), Json(item))
        )

    def _sort_id(self, entity_id):
        return int(entity_id) if str(entity_id).isdigit() else 0

    def _connect(self):
        last_error = None

        for _ in range(10):
            try:
                return psycopg2.connect(self.dsn)
            except psycopg2.OperationalError as error:
                last_error = error
                time.sleep(1)

        raise last_error

    def _require_table(self, table_name):
        if not self.table_exists(table_name):
            raise KeyError(table_name)

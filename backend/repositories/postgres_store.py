import json
import re
import time
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor


SCHEMA_BY_TABLE = {
    "kunden": "kunden",
    "lieferanten": "lieferanten",
    "artikel": "waren",
    "artikelIndividualisierung": "waren",
    "artikelStueckliste": "waren",
    "kategorien": "waren",
    "lager": "waren",
    "services": "waren",
    "lieferantenArtikelStaffeln": "einkauf",
    "bestellungen": "einkauf",
    "bestellpositionen": "einkauf",
    "einkaufsdokumente": "einkauf",
    "kundenanfragen": "verkauf",
    "angebote": "verkauf",
    "angebotspositionen": "verkauf",
    "auftraege": "verkauf",
    "auftragspositionen": "verkauf",
    "vertriebsdokumente": "verkauf",
    "versandauftraege": "verkauf",
    "nachrichten": "verkauf",
    "reklamationen": "verkauf",
    "retouren": "verkauf",
    "rechnungen": "buchhaltung",
    "zahlungen": "buchhaltung",
    "mahnungen": "buchhaltung",
    "belege": "buchhaltung",
    "firmenkonto": "buchhaltung",
    "benutzer": "verwaltung",
    "rollen": "verwaltung",
    "rechte": "verwaltung",
    "rollenRechte": "verwaltung",
    "nummernkreise": "verwaltung",
    "feldMetadaten": "verwaltung",
    "benutzerSpalten": "verwaltung",
    "lehrkraftOptionen": "verwaltung",
    "fristenOptionen": "verwaltung",
    "unternehmen": "verwaltung",
    "tagesversandprotokolle": "verwaltung",
    "mitarbeiter": "personal",
    "arbeitszeiten": "personal",
    "urlaubsantraege": "personal",
    "krankmeldungen": "personal",
    "schulungen": "personal",
    "personalakten": "personal",
    "bewerber": "personal",
    "abteilungen": "organisation",
    "marketingaktionen": "organisation",
    "freigaben": "organisation",
    "berichte": "organisation",
}

RELATIONAL_SCHEMAS = sorted(set(SCHEMA_BY_TABLE.values()))
META_COLUMNS = {"entity_id", "sort_id", "created_at", "updated_at"}
MAPPING_SCHEMA = "verwaltung"
MAPPING_TABLE = "store_field_mappings"
SQL_RESERVED = {
    "user", "select", "from", "where", "order", "group", "table", "schema",
    "insert", "update", "delete", "by", "on", "references"
}


def to_snake_case(value):
    normalized = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", str(value))
    normalized = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", normalized)
    normalized = re.sub(r"[^a-zA-Z0-9_]+", "_", normalized).strip("_").lower()
    if not normalized:
        normalized = "value"
    if normalized[0].isdigit():
        normalized = f"f_{normalized}"
    if normalized in SQL_RESERVED:
        normalized = f"{normalized}_value"
    return normalized


def relation_table_name(table_name, field_name):
    return to_snake_case(f"{table_name}_{field_name}")


def relation_column_name(field_name):
    return "item_id" if field_name == "id" else to_snake_case(field_name)


def is_scalar(value):
    return value is None or isinstance(value, (str, int, float, bool))


class TableMapping:
    def __init__(self, api_name):
        self.api_name = api_name
        self.schema = SCHEMA_BY_TABLE.get(api_name, "verwaltung")
        self.sql_table = to_snake_case(api_name)
        self.scalar_fields = {}
        self.relations = {}

    @property
    def qualified_name(self):
        return sql.Identifier(self.schema, self.sql_table)


class RelationMapping:
    def __init__(self, parent_table, field_name, values):
        self.parent_table = parent_table
        self.field_name = field_name
        self.sql_table = relation_table_name(parent_table, field_name)
        self.kind = self._infer_kind(values)
        self.scalar_fields = self._infer_scalar_fields(values)

    @property
    def qualified_name(self):
        schema = SCHEMA_BY_TABLE.get(self.parent_table, "verwaltung")
        return sql.Identifier(schema, self.sql_table)

    def _infer_kind(self, values):
        non_empty = [value for value in values if value not in (None, "", [])]
        if any(isinstance(value, dict) for value in non_empty):
            return "object"
        if any(isinstance(value, list) and any(isinstance(item, dict) for item in value) for value in non_empty):
            return "object_list"
        return "scalar_list"

    def _infer_scalar_fields(self, values):
        fields = {}
        for value in values:
            candidates = []
            if isinstance(value, dict):
                candidates = [value]
            elif isinstance(value, list):
                candidates = [item for item in value if isinstance(item, dict)]

            for candidate in candidates:
                for key, item_value in candidate.items():
                    if is_scalar(item_value):
                        fields[key] = merge_sql_type(fields.get(key), infer_sql_type(item_value))
        return fields


def infer_sql_type(value):
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int) and not isinstance(value, bool):
        return "bigint"
    if isinstance(value, float):
        return "numeric"
    return "text"


def merge_sql_type(current, next_type):
    if not current:
        return next_type
    if current == next_type:
        return current
    if "text" in (current, next_type):
        return "text"
    if "numeric" in (current, next_type):
        return "numeric"
    if {current, next_type} == {"bigint", "boolean"}:
        return "text"
    return "text"


class PostgresStore:
    def __init__(self, dsn):
        self.dsn = dsn
        self.seed_dir = Path(__file__).resolve().parent.parent / "seed" / "sources" / "json"
        self.seed_data = self._load_seed_data()
        self.mappings = self._build_mappings(self.seed_data)
        self._bootstrap()

    def list_tables(self):
        return sorted(self.mappings.keys())

    def table_exists(self, table_name):
        return table_name in self.mappings

    def list(self, table_name):
        self._require_table(table_name)
        return self._list_records(table_name)

    def get(self, table_name, entity_id):
        self._require_table(table_name)
        return self._get_record(table_name, entity_id)

    def create(self, table_name, payload):
        self._require_table(table_name)
        entity_id = payload.get("id") or self._next_id(table_name)
        item = {**payload, "id": entity_id}

        with self._connect() as connection, connection.cursor() as cursor:
            self._ensure_mapping_for_item(cursor, table_name, item)
            self._save_record(cursor, table_name, entity_id, item)
            connection.commit()

        return item

    def update(self, table_name, entity_id, payload):
        self._require_table(table_name)
        current = self._get_record(table_name, entity_id)
        if not current:
            return None

        updated = {**current, **payload, "id": current.get("id")}
        with self._connect() as connection, connection.cursor() as cursor:
            self._ensure_mapping_for_item(cursor, table_name, updated)
            self._save_record(cursor, table_name, entity_id, updated)
            connection.commit()

        return updated

    def delete(self, table_name, entity_id):
        self._require_table(table_name)
        mapping = self.mappings[table_name]
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                sql.SQL("delete from {} where entity_id = %s").format(mapping.qualified_name),
                (str(entity_id),)
            )
            deleted = cursor.rowcount > 0
            connection.commit()
            return deleted

    def transaction(self, callback):
        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            result = callback(cursor)
            connection.commit()
            return result

    def list_in_transaction(self, cursor, table_name):
        self._require_table(table_name)
        return self._list_records(table_name, cursor)

    def save_in_transaction(self, cursor, table_name, entity_id, item):
        self._require_table(table_name)
        self._ensure_mapping_for_item(cursor, table_name, item)
        self._save_record(cursor, table_name, entity_id, item)

    def get_meta(self, table_name):
        self._require_table(table_name)
        records = self._list_records(table_name)
        mapping = self.mappings[table_name]

        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                sql.SQL("select count(*) as count, max(updated_at) as updated_at from {}").format(mapping.qualified_name)
            )
            row = cursor.fetchone() or {}

        return {
            "name": table_name,
            "count": row.get("count", 0),
            "updatedAt": row.get("updated_at").isoformat() if row.get("updated_at") else None,
            "provider": "postgres",
            "fields": self._describe_fields(records),
        }

    def reset(self):
        self.seed_data = self._load_seed_data()
        self.mappings = self._build_mappings(self.seed_data)

        with self._connect() as connection, connection.cursor() as cursor:
            self._ensure_schema(cursor, force_recreate=True)
            self._insert_seed_records(cursor)
            connection.commit()

    def _bootstrap(self):
        with self._connect() as connection, connection.cursor() as cursor:
            self._ensure_schema(cursor)
            if not self._has_relational_data(cursor):
                self._insert_seed_records(cursor)
            connection.commit()

    def _ensure_schema(self, cursor, force_recreate=False):
        for schema_name in RELATIONAL_SCHEMAS:
            cursor.execute(sql.SQL("create schema if not exists {}").format(sql.Identifier(schema_name)))

        self._ensure_mapping_registry(cursor)
        if not force_recreate:
            self._load_stored_mappings(cursor)

        cursor.execute("drop table if exists public.app_records cascade")

        if force_recreate:
            self._drop_managed_tables(cursor)
            cursor.execute(sql.SQL("delete from {}").format(sql.Identifier(MAPPING_SCHEMA, MAPPING_TABLE)))

        for table_name in self.list_tables():
            self._ensure_table(cursor, table_name)
            self._persist_mapping(cursor, table_name)

    def _ensure_mapping_registry(self, cursor):
        cursor.execute(
            sql.SQL(
                """
                create table if not exists {} (
                    api_table text not null,
                    field_name text not null,
                    relation_field text not null default '',
                    relation_kind text not null,
                    column_type text not null default 'text',
                    created_at timestamptz not null default now(),
                    updated_at timestamptz not null default now(),
                    primary key (api_table, field_name, relation_field)
                )
                """
            ).format(sql.Identifier(MAPPING_SCHEMA, MAPPING_TABLE))
        )

    def _load_stored_mappings(self, cursor):
        cursor.execute(
            sql.SQL("select * from {} order by api_table, field_name, relation_field").format(
                sql.Identifier(MAPPING_SCHEMA, MAPPING_TABLE)
            )
        )
        rows = cursor.fetchall()
        for row in rows:
            table_name = row[0]
            field_name = row[1]
            relation_field = row[2]
            relation_kind = row[3]
            column_type = row[4]
            if table_name not in self.mappings:
                self.mappings[table_name] = TableMapping(table_name)

            mapping = self.mappings[table_name]
            if relation_kind == "scalar":
                mapping.scalar_fields.setdefault(field_name, column_type)
                continue

            relation = mapping.relations.get(field_name)
            if relation is None:
                relation = RelationMapping(table_name, field_name, [])
                relation.kind = relation_kind
                relation.scalar_fields = {}
                mapping.relations[field_name] = relation

            if relation_field:
                relation.scalar_fields.setdefault(relation_field, column_type)

    def _persist_mapping(self, cursor, table_name):
        mapping = self.mappings[table_name]
        for api_field, column_type in mapping.scalar_fields.items():
            self._upsert_mapping_row(cursor, table_name, api_field, "", "scalar", column_type)

        for api_field, relation in mapping.relations.items():
            self._upsert_mapping_row(cursor, table_name, api_field, "", relation.kind, "text")
            for child_field, column_type in relation.scalar_fields.items():
                self._upsert_mapping_row(cursor, table_name, api_field, child_field, relation.kind, column_type)

    def _upsert_mapping_row(self, cursor, table_name, field_name, relation_field, relation_kind, column_type):
        cursor.execute(
            sql.SQL(
                """
                insert into {} (api_table, field_name, relation_field, relation_kind, column_type)
                values (%s, %s, %s, %s, %s)
                on conflict (api_table, field_name, relation_field)
                do update set
                    relation_kind = excluded.relation_kind,
                    column_type = excluded.column_type,
                    updated_at = now()
                """
            ).format(sql.Identifier(MAPPING_SCHEMA, MAPPING_TABLE)),
            (table_name, field_name, relation_field, relation_kind, column_type)
        )

    def _drop_managed_tables(self, cursor):
        relation_names = []
        for mapping in self.mappings.values():
            relation_names.extend(relation.qualified_name for relation in mapping.relations.values())
            relation_names.append(mapping.qualified_name)

        for qualified_name in relation_names:
            cursor.execute(sql.SQL("drop table if exists {} cascade").format(qualified_name))

    def _ensure_table(self, cursor, table_name):
        mapping = self.mappings[table_name]
        incompatible = self._table_exists(cursor, mapping.schema, mapping.sql_table) and not self._column_exists(
            cursor, mapping.schema, mapping.sql_table, "entity_id"
        )
        if incompatible:
            cursor.execute(sql.SQL("drop table {} cascade").format(mapping.qualified_name))

        cursor.execute(
            sql.SQL(
                """
                create table if not exists {} (
                    entity_id text primary key,
                    sort_id bigint not null default 0,
                    created_at timestamptz not null default now(),
                    updated_at timestamptz not null default now()
                )
                """
            ).format(mapping.qualified_name)
        )

        for api_field, column_type in mapping.scalar_fields.items():
            column_name = to_snake_case(api_field)
            self._ensure_column(cursor, mapping.schema, mapping.sql_table, column_name, column_type)

        for relation in mapping.relations.values():
            self._ensure_relation_table(cursor, mapping, relation)

    def _ensure_relation_table(self, cursor, mapping, relation):
        if relation.kind == "object":
            cursor.execute(
                sql.SQL(
                    """
                    create table if not exists {} (
                        parent_id text primary key references {}(entity_id) on delete cascade
                    )
                    """
                ).format(relation.qualified_name, mapping.qualified_name)
            )
        else:
            cursor.execute(
                sql.SQL(
                    """
                    create table if not exists {} (
                        id bigserial primary key,
                        parent_id text not null references {}(entity_id) on delete cascade,
                        item_index integer not null default 0,
                        value_text text,
                        value_number numeric,
                        value_boolean boolean
                    )
                    """
                ).format(relation.qualified_name, mapping.qualified_name)
            )
            index_name = to_snake_case(f"idx_{mapping.sql_table}_{relation.sql_table}_parent")
            cursor.execute(
                sql.SQL("create index if not exists {} on {} (parent_id, item_index)").format(
                    sql.Identifier(index_name),
                    relation.qualified_name
                )
            )

        for api_field, column_type in relation.scalar_fields.items():
            self._ensure_column(cursor, mapping.schema, relation.sql_table, relation_column_name(api_field), column_type)

    def _ensure_column(self, cursor, schema_name, table_name, column_name, column_type):
        if self._column_exists(cursor, schema_name, table_name, column_name):
            return
        cursor.execute(
            sql.SQL("alter table {} add column {} {}").format(
                sql.Identifier(schema_name, table_name),
                sql.Identifier(column_name),
                sql.SQL(column_type)
            )
        )

    def _table_exists(self, cursor, schema_name, table_name):
        cursor.execute(
            """
            select exists(
                select 1 from information_schema.tables
                where table_schema = %s and table_name = %s
            )
            """,
            (schema_name, table_name)
        )
        return cursor.fetchone()[0]

    def _column_exists(self, cursor, schema_name, table_name, column_name):
        cursor.execute(
            """
            select exists(
                select 1 from information_schema.columns
                where table_schema = %s and table_name = %s and column_name = %s
            )
            """,
            (schema_name, table_name, column_name)
        )
        return cursor.fetchone()[0]

    def _has_relational_data(self, cursor):
        for table_name in self.list_tables():
            mapping = self.mappings[table_name]
            cursor.execute(sql.SQL("select exists(select 1 from {})").format(mapping.qualified_name))
            if cursor.fetchone()[0]:
                return True
        return False

    def _load_seed_data(self):
        if not self.seed_dir.exists():
            return {}

        payload = {}
        for seed_file in sorted(self.seed_dir.glob("*.json")):
            content = json.loads(seed_file.read_text(encoding="utf-8"))
            payload.update(content)

        return {
            table_name: self._normalize_seed_items(items)
            for table_name, items in payload.items()
        }

    def _normalize_seed_items(self, items):
        normalized_items = []

        for index, item in enumerate(items or [], start=1):
            if isinstance(item, dict) and item.get("id") in (None, ""):
                normalized_items.append({**item, "id": index})
                continue
            normalized_items.append(item)

        return normalized_items

    def _build_mappings(self, seed_data):
        mappings = {table_name: TableMapping(table_name) for table_name in seed_data.keys()}

        for table_name, items in seed_data.items():
            scalar_types = {}
            relation_values = defaultdict(list)

            for item in items:
                if not isinstance(item, dict):
                    continue

                for field_name, value in item.items():
                    if field_name == "id":
                        continue
                    if is_scalar(value):
                        scalar_types[field_name] = merge_sql_type(
                            scalar_types.get(field_name),
                            infer_sql_type(value)
                        )
                    else:
                        relation_values[field_name].append(value)

            mappings[table_name].scalar_fields = scalar_types
            mappings[table_name].relations = {
                field_name: RelationMapping(table_name, field_name, values)
                for field_name, values in relation_values.items()
            }

        return mappings

    def _next_id(self, table_name):
        mapping = self.mappings[table_name]
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                sql.SQL("select coalesce(max(sort_id), 0) + 1 from {}").format(mapping.qualified_name)
            )
            return cursor.fetchone()[0]

    def _insert_seed_records(self, cursor):
        for table_name in self.list_tables():
            for item in self.seed_data.get(table_name, []):
                if isinstance(item, dict):
                    self._insert_record(cursor, table_name, item.get("id"), item)

    def _list_records(self, table_name, cursor=None):
        owns_cursor = cursor is None
        connection = None
        if owns_cursor:
            connection = self._connect()
            cursor = connection.cursor(cursor_factory=RealDictCursor)

        try:
            mapping = self.mappings[table_name]
            cursor.execute(
                sql.SQL("select * from {} order by sort_id asc, entity_id asc").format(mapping.qualified_name)
            )
            rows = cursor.fetchall()
            return [self._row_to_item(cursor, table_name, row) for row in rows]
        finally:
            if owns_cursor:
                cursor.close()
                connection.close()

    def _get_record(self, table_name, entity_id):
        mapping = self.mappings[table_name]
        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                sql.SQL("select * from {} where entity_id = %s").format(mapping.qualified_name),
                (str(entity_id),)
            )
            row = cursor.fetchone()
            return self._row_to_item(cursor, table_name, row) if row else None

    def _row_to_item(self, cursor, table_name, row):
        mapping = self.mappings[table_name]
        item = {"id": self._restore_id(row["entity_id"])}

        for api_field in mapping.scalar_fields.keys():
            item[api_field] = self._normalize_db_value(row.get(to_snake_case(api_field)))

        for api_field, relation in mapping.relations.items():
            item[api_field] = self._load_relation(cursor, mapping, relation, row["entity_id"])

        return item

    def _load_relation(self, cursor, mapping, relation, entity_id):
        cursor.execute(
            sql.SQL("select * from {} where parent_id = %s {}").format(
                relation.qualified_name,
                sql.SQL("" if relation.kind == "object" else "order by item_index asc, id asc")
            ),
            (str(entity_id),)
        )
        rows = cursor.fetchall()

        if relation.kind == "object":
            if not rows:
                return {}
            return {
                api_field: self._normalize_db_value(rows[0].get(relation_column_name(api_field)))
                for api_field in relation.scalar_fields.keys()
            }

        if relation.kind == "object_list":
            return [
                {
                    api_field: self._normalize_db_value(row.get(relation_column_name(api_field)))
                    for api_field in relation.scalar_fields.keys()
                }
                for row in rows
            ]

        return [self._scalar_from_relation_row(row) for row in rows]

    def _insert_record(self, cursor, table_name, entity_id, item):
        self._save_record(cursor, table_name, entity_id, item)

    def _save_record(self, cursor, table_name, entity_id, item):
        mapping = self.mappings[table_name]
        entity_id = str(entity_id)
        scalar_fields = list(mapping.scalar_fields.keys())
        columns = ["entity_id", "sort_id"] + [to_snake_case(field) for field in scalar_fields]
        values = [entity_id, self._sort_id(entity_id)] + [
            self._coerce_for_sql(item.get(field), mapping.scalar_fields[field])
            for field in scalar_fields
        ]

        insert_columns = sql.SQL(", ").join(sql.Identifier(column) for column in columns)
        placeholders = sql.SQL(", ").join(sql.Placeholder() for _ in columns)
        update_assignments = sql.SQL(", ").join(
            sql.SQL("{} = excluded.{}").format(sql.Identifier(column), sql.Identifier(column))
            for column in columns[1:]
        )

        cursor.execute(
            sql.SQL(
                """
                insert into {} ({})
                values ({})
                on conflict (entity_id)
                do update set {}, updated_at = now()
                """
            ).format(mapping.qualified_name, insert_columns, placeholders, update_assignments),
            values
        )

        self._delete_relations(cursor, mapping, entity_id)
        self._save_relations(cursor, mapping, entity_id, item)

    def _delete_relations(self, cursor, mapping, entity_id):
        for relation in mapping.relations.values():
            cursor.execute(
                sql.SQL("delete from {} where parent_id = %s").format(relation.qualified_name),
                (str(entity_id),)
            )

    def _save_relations(self, cursor, mapping, entity_id, item):
        for api_field, relation in mapping.relations.items():
            value = item.get(api_field)
            if value in (None, ""):
                continue

            if relation.kind == "object":
                self._insert_object_relation(cursor, relation, entity_id, value if isinstance(value, dict) else {})
            elif relation.kind == "object_list":
                values = value if isinstance(value, list) else []
                for index, child in enumerate(values):
                    if isinstance(child, dict):
                        self._insert_object_list_relation(cursor, relation, entity_id, index, child)
            else:
                values = value if isinstance(value, list) else []
                for index, child in enumerate(values):
                    self._insert_scalar_relation(cursor, relation, entity_id, index, child)

    def _insert_object_relation(self, cursor, relation, entity_id, value):
        fields = list(relation.scalar_fields.keys())
        columns = ["parent_id"] + [relation_column_name(field) for field in fields]
        values = [str(entity_id)] + [
            self._coerce_for_sql(value.get(field), relation.scalar_fields[field])
            for field in fields
        ]
        cursor.execute(
            sql.SQL("insert into {} ({}) values ({})").format(
                relation.qualified_name,
                sql.SQL(", ").join(sql.Identifier(column) for column in columns),
                sql.SQL(", ").join(sql.Placeholder() for _ in columns)
            ),
            values
        )

    def _insert_object_list_relation(self, cursor, relation, entity_id, index, value):
        fields = list(relation.scalar_fields.keys())
        columns = ["parent_id", "item_index"] + [relation_column_name(field) for field in fields]
        values = [str(entity_id), index] + [
            self._coerce_for_sql(value.get(field), relation.scalar_fields[field])
            for field in fields
        ]
        cursor.execute(
            sql.SQL("insert into {} ({}) values ({})").format(
                relation.qualified_name,
                sql.SQL(", ").join(sql.Identifier(column) for column in columns),
                sql.SQL(", ").join(sql.Placeholder() for _ in columns)
            ),
            values
        )

    def _insert_scalar_relation(self, cursor, relation, entity_id, index, value):
        cursor.execute(
            sql.SQL(
                "insert into {} (parent_id, item_index, value_text, value_number, value_boolean) values (%s, %s, %s, %s, %s)"
            ).format(relation.qualified_name),
            (
                str(entity_id),
                index,
                str(value) if value is not None and not isinstance(value, bool) else None,
                value if isinstance(value, (int, float)) and not isinstance(value, bool) else None,
                value if isinstance(value, bool) else None,
            )
        )

    def _ensure_mapping_for_item(self, cursor, table_name, item):
        mapping = self.mappings[table_name]
        changed = False
        for field_name, value in item.items():
            if field_name == "id":
                continue
            if is_scalar(value):
                column_type = infer_sql_type(value)
                if field_name not in mapping.scalar_fields:
                    mapping.scalar_fields[field_name] = column_type
                    self._ensure_column(cursor, mapping.schema, mapping.sql_table, to_snake_case(field_name), column_type)
                    self._upsert_mapping_row(cursor, table_name, field_name, "", "scalar", column_type)
                    changed = True
            elif field_name not in mapping.relations:
                mapping.relations[field_name] = RelationMapping(table_name, field_name, [value])
                self._ensure_relation_table(cursor, mapping, mapping.relations[field_name])
                self._persist_mapping(cursor, table_name)
                changed = True
            else:
                relation = mapping.relations[field_name]
                for child_field, child_value in self._iter_relation_scalar_fields(value):
                    if child_field not in relation.scalar_fields:
                        column_type = infer_sql_type(child_value)
                        relation.scalar_fields[child_field] = column_type
                        self._ensure_column(
                            cursor,
                            mapping.schema,
                            relation.sql_table,
                            relation_column_name(child_field),
                            column_type
                        )
                        self._upsert_mapping_row(cursor, table_name, field_name, child_field, relation.kind, column_type)
                        changed = True

        if changed:
            self._ensure_table(cursor, table_name)

    def _iter_relation_scalar_fields(self, value):
        if isinstance(value, dict):
            candidates = [value]
        elif isinstance(value, list):
            candidates = [item for item in value if isinstance(item, dict)]
        else:
            candidates = []

        for candidate in candidates:
            for field_name, item_value in candidate.items():
                if is_scalar(item_value):
                    yield field_name, item_value

    def _scalar_from_relation_row(self, row):
        if row.get("value_boolean") is not None:
            return row.get("value_boolean")
        if row.get("value_number") is not None:
            return self._normalize_db_value(row.get("value_number"))
        return row.get("value_text")

    def _coerce_for_sql(self, value, column_type):
        if value == "":
            return None
        if value is None:
            return None
        if column_type == "boolean":
            if isinstance(value, str):
                return value.strip().lower() in ("1", "true", "ja", "yes", "on")
            return bool(value)
        if column_type == "bigint":
            try:
                return int(value)
            except (TypeError, ValueError):
                return None
        if column_type == "numeric":
            try:
                return float(value)
            except (TypeError, ValueError):
                return None
        return str(value) if not isinstance(value, str) else value

    def _normalize_db_value(self, value):
        if isinstance(value, Decimal):
            return int(value) if value == value.to_integral_value() else float(value)
        return value

    def _sort_id(self, entity_id):
        return int(entity_id) if str(entity_id).isdigit() else 0

    def _restore_id(self, entity_id):
        return int(entity_id) if str(entity_id).isdigit() else entity_id

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

    def _describe_fields(self, records):
        field_types = {}
        required_fields = {}

        for record in records:
            if not isinstance(record, dict):
                continue

            for field_name, value in record.items():
                field_types.setdefault(field_name, set()).add(self._infer_value_type(value))
                required_fields[field_name] = required_fields.get(field_name, 0) + 1

        total_records = len(records)
        return [
            {
                "name": field_name,
                "types": sorted(field_types[field_name]),
                "required": required_fields.get(field_name, 0) == total_records if total_records else False,
            }
            for field_name in sorted(field_types.keys())
        ]

    def _infer_value_type(self, value):
        if value is None:
            return "null"
        if isinstance(value, bool):
            return "boolean"
        if isinstance(value, int) and not isinstance(value, bool):
            return "integer"
        if isinstance(value, float):
            return "number"
        if isinstance(value, str):
            return "string"
        if isinstance(value, list):
            return "array"
        if isinstance(value, dict):
            return "object"
        return type(value).__name__

import copy
import re
from datetime import datetime, timezone

import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT, make_dsn, parse_dsn

from repositories.postgres_store import PostgresStore, SCHEMA_BY_TABLE
from schema_migrations import run_pending_migrations


COMMON_DATABASE = "erp_common"
DEFAULT_CLASS_DATABASE = "erp_0"
DEFAULT_CLASS_NAME = "KlasseDemo"
COMMON_TABLES = {"benutzer", "rollen", "rechte", "rollenRechte", "benutzerSpalten", "klassen"}
CLASS_TABLES = sorted(set(SCHEMA_BY_TABLE.keys()) - COMMON_TABLES)


def _dbname_from_dsn(dsn):
    return parse_dsn(dsn).get("dbname") or parse_dsn(dsn).get("database") or COMMON_DATABASE


def _dsn_for_database(base_dsn, database_name):
    params = parse_dsn(base_dsn)
    params["dbname"] = database_name
    params.pop("database", None)
    return make_dsn(**params)


def _maintenance_dsn(base_dsn):
    return _dsn_for_database(base_dsn, "postgres")


def _validate_database_name(database_name):
    if not re.fullmatch(r"erp_[0-9]+|erp_common", str(database_name or "")):
        raise ValueError("Ungueltiger Datenbankname.")


def _connect_maintenance(base_dsn):
    connection = psycopg2.connect(_maintenance_dsn(base_dsn))
    connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    return connection


def ensure_database_exists(base_dsn, database_name):
    _validate_database_name(database_name)
    connection = _connect_maintenance(base_dsn)
    try:
        with connection.cursor() as cursor:
            cursor.execute("select 1 from pg_database where datname = %s", (database_name,))
            if cursor.fetchone():
                return
            cursor.execute(sql.SQL("create database {}").format(sql.Identifier(database_name)))
    finally:
        connection.close()


def drop_database(base_dsn, database_name):
    _validate_database_name(database_name)
    if database_name in (COMMON_DATABASE, DEFAULT_CLASS_DATABASE):
        raise ValueError("Diese Datenbank darf nicht geloescht werden.")
    connection = _connect_maintenance(base_dsn)
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select pg_terminate_backend(pid)
                from pg_stat_activity
                where datname = %s and pid <> pg_backend_pid()
                """,
                (database_name,)
            )
            cursor.execute(sql.SQL("drop database if exists {}").format(sql.Identifier(database_name)))
    finally:
        connection.close()


def _class_id_values_without(values, class_id):
    return [value for value in (values or []) if str(value) != str(class_id)]


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _default_common_seed():
    return {
        "klassen": [
            {
                "id": 0,
                "name": DEFAULT_CLASS_NAME,
                "datenbankName": DEFAULT_CLASS_DATABASE,
                "status": "aktiv",
                "beschreibung": "Automatisch angelegte Demo-Klasse mit Seed-Daten.",
                "createdAt": _now_iso(),
                "updatedAt": _now_iso(),
            }
        ]
    }


def _is_admin(user):
    permissions = user.get("permissions") or []
    return "*" in permissions or str(user.get("rolle") or "").lower() == "admin"


class StoreManager:
    def __init__(self, base_dsn):
        self.base_dsn = _dsn_for_database(base_dsn, COMMON_DATABASE)
        self.stores = {}
        ensure_database_exists(self.base_dsn, COMMON_DATABASE)
        ensure_database_exists(self.base_dsn, DEFAULT_CLASS_DATABASE)
        self.common_store = self._create_store(COMMON_DATABASE, COMMON_TABLES, _default_common_seed())
        self._ensure_common_seed()
        self._ensure_default_class()
        self._ensure_default_user_classes()
        self._create_store(DEFAULT_CLASS_DATABASE, CLASS_TABLES)

    def _create_store(self, database_name, table_names, extra_seed_data=None, insert_seed_on_empty=True):
        if database_name not in self.stores:
            dsn = _dsn_for_database(self.base_dsn, database_name)
            run_pending_migrations(dsn)
            self.stores[database_name] = PostgresStore(
                dsn,
                table_names=table_names,
                extra_seed_data=extra_seed_data,
                insert_seed_on_empty=insert_seed_on_empty
            )
        return self.stores[database_name]

    def _ensure_default_class(self):
        classes = self.common_store.list("klassen") if self.common_store.table_exists("klassen") else []
        demo = next((item for item in classes if str(item.get("datenbankName")) == DEFAULT_CLASS_DATABASE), None)
        if not demo:
            self.common_store.create("klassen", _default_common_seed()["klassen"][0])

    def _ensure_common_seed(self):
        for table_name in ("benutzer", "rollen", "rechte", "rollenRechte"):
            if not self.common_store.table_exists(table_name):
                continue
            if len(self.common_store.list(table_name)) == 0:
                self.common_store.reset()
                return

    def _ensure_default_user_classes(self):
        if not self.common_store.table_exists("benutzer"):
            return
        for user in self.common_store.list("benutzer"):
            if user.get("klasseIds") or user.get("klasseId") not in (None, ""):
                continue
            self.common_store.update("benutzer", user.get("id"), {**user, "klasseIds": [0], "klasseId": 0})

    def get_common_store(self):
        return self.common_store

    def is_common_table(self, table_name):
        return table_name in COMMON_TABLES

    def get_class_store(self, database_name):
        ensure_database_exists(self.base_dsn, database_name)
        return self._create_store(database_name, CLASS_TABLES)

    def get_store(self, table_name=None, active_database=None):
        if table_name and self.is_common_table(table_name):
            return self.common_store
        return self.get_class_store(active_database or DEFAULT_CLASS_DATABASE)

    def list_classes(self, include_inactive=False):
        classes = self.common_store.list("klassen")
        if not include_inactive:
            classes = [item for item in classes if str(item.get("status") or "aktiv").lower() == "aktiv"]
        return sorted(classes, key=lambda item: (int(item.get("id") or 0), str(item.get("name") or "")))

    def next_class_database(self):
        used = []
        for item in self.common_store.list("klassen"):
            match = re.fullmatch(r"erp_(\d+)", str(item.get("datenbankName") or ""))
            if match:
                used.append(int(match.group(1)))
        next_number = max(used or [-1]) + 1
        return next_number, f"erp_{next_number}"

    def create_class(self, payload):
        copy_from_class_id = payload.get("copyFromClassId")
        copy_participants = bool(payload.get("copyParticipants"))
        source_class = None
        if copy_from_class_id not in (None, ""):
            source_class = self.common_store.get("klassen", copy_from_class_id)
            if not source_class:
                raise ValueError("Die Quellklasse zum Kopieren wurde nicht gefunden.")

        next_id, database_name = self.next_class_database()
        ensure_database_exists(self.base_dsn, database_name)
        target_store = self._create_store(database_name, CLASS_TABLES, insert_seed_on_empty=False)
        class_item = {
            "id": next_id,
            "name": str(payload.get("name") or f"Klasse {next_id}").strip(),
            "datenbankName": database_name,
            "status": str(payload.get("status") or "aktiv").strip() or "aktiv",
            "beschreibung": str(payload.get("beschreibung") or "").strip(),
            "createdAt": _now_iso(),
            "updatedAt": _now_iso(),
        }
        created_class = self.common_store.create("klassen", class_item)

        if source_class:
            source_store = self.get_class_store(source_class.get("datenbankName"))
            copied_records = {
                table_name: copy.deepcopy(source_store.list(table_name))
                for table_name in CLASS_TABLES
                if source_store.table_exists(table_name) and target_store.table_exists(table_name)
            }
            target_store.replace_records(copied_records)

        if source_class and copy_participants:
            self._copy_class_participants(copy_from_class_id, created_class.get("id"))

        return created_class

    def _copy_class_participants(self, source_class_id, target_class_id):
        for user in self.common_store.list("benutzer"):
            class_ids = [str(value) for value in (user.get("klasseIds") or [])]
            if user.get("klasseId") not in (None, ""):
                class_ids.append(str(user.get("klasseId")))
            if str(source_class_id) not in set(class_ids):
                continue
            next_ids = list(dict.fromkeys([*class_ids, str(target_class_id)]))
            self.common_store.update("benutzer", user.get("id"), {
                **user,
                "klasseIds": next_ids,
                "klasseId": user.get("klasseId") if user.get("klasseId") not in (None, "") else next_ids[0]
            })

    def update_class(self, class_id, payload):
        current = self.common_store.get("klassen", class_id)
        if not current:
            return None
        updated = {
            **current,
            "name": str(payload.get("name", current.get("name")) or "").strip(),
            "status": str(payload.get("status", current.get("status") or "aktiv") or "aktiv").strip(),
            "beschreibung": str(payload.get("beschreibung", current.get("beschreibung") or "") or "").strip(),
            "updatedAt": _now_iso(),
        }
        return self.common_store.update("klassen", class_id, updated)

    def delete_class(self, class_id):
        current = self.common_store.get("klassen", class_id)
        if not current:
            return None
        database_name = current.get("datenbankName")
        drop_database(self.base_dsn, database_name)
        self.stores.pop(database_name, None)
        self.common_store.delete("klassen", class_id)
        for user in self.common_store.list("benutzer"):
            next_ids = _class_id_values_without(user.get("klasseIds") or [], class_id)
            next_primary = user.get("klasseId")
            if str(next_primary) == str(class_id):
                next_primary = next_ids[0] if next_ids else ""
            self.common_store.update("benutzer", user.get("id"), {
                **user,
                "klasseIds": next_ids,
                "klasseId": next_primary,
                "lastClassId": "" if str(user.get("lastClassId")) == str(class_id) else user.get("lastClassId", "")
            })
        return current

    def reset_classes(self, class_ids):
        reset_tables = set()
        for class_id in class_ids:
            class_item = self.common_store.get("klassen", class_id)
            if not class_item:
                continue
            database_name = class_item.get("datenbankName")
            store = self.get_class_store(database_name)
            store.reset()
            reset_tables.update(store.list_tables())
        return sorted(reset_tables)

    def clear_classes(self, class_ids):
        cleared_tables = set()
        for class_id in class_ids:
            class_item = self.common_store.get("klassen", class_id)
            if not class_item:
                continue
            store = self.get_class_store(class_item.get("datenbankName"))
            store.replace_records({table_name: [] for table_name in CLASS_TABLES})
            cleared_tables.update(store.list_tables())
        return sorted(cleared_tables)

    def get_accessible_classes(self, user, include_inactive=False):
        classes = self.list_classes(include_inactive=include_inactive)
        if _is_admin(user):
            return classes
        allowed_ids = {str(value) for value in (user.get("klasseIds") or [])}
        if user.get("klasseId") not in (None, ""):
            allowed_ids.add(str(user.get("klasseId")))
        return [item for item in classes if str(item.get("id")) in allowed_ids]

    def resolve_active_class(self, user, requested_class_id=None):
        classes = self.get_accessible_classes(user)
        if not classes:
            return None
        if requested_class_id not in (None, ""):
            match = next((item for item in classes if str(item.get("id")) == str(requested_class_id)), None)
            if match:
                return match
        last_class_id = user.get("lastClassId")
        if last_class_id not in (None, ""):
            match = next((item for item in classes if str(item.get("id")) == str(last_class_id)), None)
            if match:
                return match
        return classes[0]

from copy import deepcopy
from datetime import datetime, timezone

from seed.preview_data import PREVIEW_DATA


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


class MemoryStore:
    def __init__(self):
        self.reset()

    def list_tables(self):
        return sorted(self._tables.keys())

    def table_exists(self, table_name):
        return table_name in self._tables

    def list(self, table_name):
        self._require_table(table_name)
        return deepcopy(self._tables[table_name])

    def get(self, table_name, entity_id):
        self._require_table(table_name)
        for item in self._tables[table_name]:
            if str(item.get("id")) == str(entity_id):
                return deepcopy(item)
        return None

    def create(self, table_name, payload):
        self._require_table(table_name)
        next_id = self._next_id(table_name)
        item = {
            **payload,
            "id": next_id
        }
        self._tables[table_name].append(item)
        self._touch(table_name)
        return deepcopy(item)

    def update(self, table_name, entity_id, payload):
        self._require_table(table_name)
        for index, item in enumerate(self._tables[table_name]):
            if str(item.get("id")) == str(entity_id):
                updated = {
                    **item,
                    **payload,
                    "id": item.get("id")
                }
                self._tables[table_name][index] = updated
                self._touch(table_name)
                return deepcopy(updated)
        return None

    def delete(self, table_name, entity_id):
        self._require_table(table_name)
        before = len(self._tables[table_name])
        self._tables[table_name] = [
            item for item in self._tables[table_name]
            if str(item.get("id")) != str(entity_id)
        ]
        deleted = len(self._tables[table_name]) != before
        if deleted:
            self._touch(table_name)
        return deleted

    def get_meta(self, table_name):
        self._require_table(table_name)
        return {
            "name": table_name,
            "count": len(self._tables[table_name]),
            **self._meta[table_name]
        }

    def reset(self):
        self._tables = deepcopy(PREVIEW_DATA)
        self._meta = {
            table_name: {
                "updatedAt": utc_now_iso(),
                "provider": "memory"
            }
            for table_name in self._tables
        }

    def _touch(self, table_name):
        self._meta[table_name]["updatedAt"] = utc_now_iso()

    def _next_id(self, table_name):
        ids = [
            int(item["id"])
            for item in self._tables[table_name]
            if str(item.get("id", "")).isdigit()
        ]
        return (max(ids) if ids else 0) + 1

    def _require_table(self, table_name):
        if table_name not in self._tables:
            raise KeyError(table_name)

import json

from flask import Blueprint, current_app, request

from api_utils import build_error_response, get_store, json_response
from security import require_explicit_permission


admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _coerce_json_payload():
    payload = request.get_json(silent=True)
    if payload is not None:
        return payload

    raw_payload = request.get_data(cache=False, as_text=True) or ""
    raw_payload = raw_payload.lstrip("\ufeff").strip()
    if not raw_payload:
        return {}

    try:
        return json.loads(raw_payload)
    except json.JSONDecodeError:
        return {}


@admin_bp.get("/backup")
def create_backup():
    permission_error = require_explicit_permission("gf.bearbeiten")
    if permission_error:
        return permission_error

    store = get_store()
    if not hasattr(store, "export_backup"):
        return build_error_response(501, "Backup wird im aktuellen Datenmodus nicht unterstuetzt.")

    return json_response({
        "ok": True,
        "backup": store.export_backup(),
        "mode": current_app.config["DATA_MODE"],
    })


@admin_bp.post("/restore")
def restore_backup():
    permission_error = require_explicit_permission("gf.bearbeiten")
    if permission_error:
        return permission_error

    store = get_store()
    if not hasattr(store, "restore_backup"):
        return build_error_response(501, "Wiederherstellung wird im aktuellen Datenmodus nicht unterstuetzt.")

    payload = _coerce_json_payload()
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            payload = {}
    elif payload is None:
        payload = {}

    backup = payload.get("backup") if isinstance(payload, dict) and "backup" in payload else payload
    if isinstance(backup, str):
        try:
            backup = json.loads(backup)
        except json.JSONDecodeError:
            backup = {}

    if not isinstance(backup, dict) or not isinstance(backup.get("tables"), dict):
        return build_error_response(400, "Ungueltiges Backup-Format.")

    store.restore_backup(backup)
    return json_response({
        "ok": True,
        "mode": current_app.config["DATA_MODE"],
        "tables": [store.get_meta(table_name) for table_name in store.list_tables()],
    })

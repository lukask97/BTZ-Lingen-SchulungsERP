from flask import Blueprint, current_app

from api_utils import get_store, json_response
from events import publish_event
from security import require_explicit_permission

meta_bp = Blueprint("meta", __name__, url_prefix="/api")

def build_tables_payload(store):
    return [store.get_meta(table_name) for table_name in store.list_tables()]


@meta_bp.get("/health")
def health():
    return json_response({
        "status": "ok",
        "mode": current_app.config["DATA_MODE"]
    })


@meta_bp.get("/meta")
def meta():
    store = get_store()
    return json_response({
        "app": "BTZ-SchulungsERP API",
        "mode": current_app.config["DATA_MODE"],
        "databaseConnected": current_app.config["DATA_MODE"] == "postgres",
        "tables": build_tables_payload(store)
    })


@meta_bp.post("/reset")
def reset():
    permission_error = require_explicit_permission("gf.bearbeiten")
    if permission_error:
        return permission_error

    store = get_store()
    store.reset()
    publish_event("data-reset", {
        "mode": current_app.config["DATA_MODE"],
        "tables": [table_name for table_name in store.list_tables()]
    })
    return json_response({
        "ok": True,
        "mode": current_app.config["DATA_MODE"],
        "tables": build_tables_payload(store)
    })

from flask import Blueprint, current_app, jsonify

from security import require_explicit_permission

meta_bp = Blueprint("meta", __name__, url_prefix="/api")


@meta_bp.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "mode": current_app.config["DATA_MODE"]
    })


@meta_bp.get("/meta")
def meta():
    store = current_app.extensions["store"]
    return jsonify({
        "app": "BTZ-SchulungsERP API",
        "mode": current_app.config["DATA_MODE"],
        "databaseConnected": current_app.config["DATA_MODE"] == "postgres",
        "tables": [store.get_meta(table_name) for table_name in store.list_tables()]
    })


@meta_bp.post("/reset")
def reset():
    permission_error = require_explicit_permission("gf.bearbeiten")
    if permission_error:
        return permission_error

    store = current_app.extensions["store"]
    store.reset()
    return jsonify({
        "ok": True,
        "mode": current_app.config["DATA_MODE"],
        "tables": [store.get_meta(table_name) for table_name in store.list_tables()]
    })

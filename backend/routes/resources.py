from flask import Blueprint, current_app, jsonify, request

from security import require_table_permission

resources_bp = Blueprint("resources", __name__, url_prefix="/api/datenbanken")


def get_store():
    return current_app.extensions["store"]


def build_missing_table_response(table_name):
    return jsonify({
        "ok": False,
        "message": f"Die Tabelle '{table_name}' ist im aktuellen Backend-Modus nicht vorbereitet."
    }), 404


@resources_bp.get("/<table_name>")
def list_entities(table_name):
    store = get_store()
    if not store.table_exists(table_name):
        return build_missing_table_response(table_name)

    permission_error = require_table_permission(table_name, "read")
    if permission_error:
        return permission_error

    return jsonify({
        "ok": True,
        "provider": current_app.config["DATA_MODE"],
        "meta": store.get_meta(table_name),
        "items": store.list(table_name)
    })


@resources_bp.get("/<table_name>/<entity_id>")
def get_entity(table_name, entity_id):
    store = get_store()
    if not store.table_exists(table_name):
        return build_missing_table_response(table_name)

    permission_error = require_table_permission(table_name, "read")
    if permission_error:
        return permission_error

    entity = store.get(table_name, entity_id)
    if not entity:
        return jsonify({
            "ok": False,
            "message": f"Eintrag {entity_id} wurde in '{table_name}' nicht gefunden."
        }), 404

    return jsonify({
        "ok": True,
        "item": entity
    })


@resources_bp.post("/<table_name>")
def create_entity(table_name):
    store = get_store()
    if not store.table_exists(table_name):
        return build_missing_table_response(table_name)

    permission_error = require_table_permission(table_name, "create")
    if permission_error:
        return permission_error

    payload = request.get_json(silent=True) or {}
    entity = store.create(table_name, payload)
    return jsonify({
        "ok": True,
        "item": entity,
        "meta": store.get_meta(table_name)
    }), 201


@resources_bp.patch("/<table_name>/<entity_id>")
def update_entity(table_name, entity_id):
    store = get_store()
    if not store.table_exists(table_name):
        return build_missing_table_response(table_name)

    permission_error = require_table_permission(table_name, "update")
    if permission_error:
        return permission_error

    payload = request.get_json(silent=True) or {}
    entity = store.update(table_name, entity_id, payload)
    if not entity:
        return jsonify({
            "ok": False,
            "message": f"Eintrag {entity_id} wurde in '{table_name}' nicht gefunden."
        }), 404

    return jsonify({
        "ok": True,
        "item": entity,
        "meta": store.get_meta(table_name)
    })


@resources_bp.delete("/<table_name>/<entity_id>")
def delete_entity(table_name, entity_id):
    store = get_store()
    if not store.table_exists(table_name):
        return build_missing_table_response(table_name)

    permission_error = require_table_permission(table_name, "delete")
    if permission_error:
        return permission_error

    deleted = store.delete(table_name, entity_id)
    if not deleted:
        return jsonify({
            "ok": False,
            "message": f"Eintrag {entity_id} wurde in '{table_name}' nicht gefunden."
        }), 404

    return jsonify({
        "ok": True,
        "meta": store.get_meta(table_name)
    })

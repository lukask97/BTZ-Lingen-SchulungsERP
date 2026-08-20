from flask import Blueprint, current_app, request

from api_utils import get_store, json_response
from events import publish_event
from security import require_table_permission

resources_bp = Blueprint("resources", __name__, url_prefix="/api/datenbanken")

TABLE_NAME_ALIASES = {
    "angebot": "angebote"
}


def resolve_table_name(table_name):
    return TABLE_NAME_ALIASES.get(table_name, table_name)

def build_not_found_response(table_name, entity_id):
    return json_response({
        "ok": False,
        "message": f"Eintrag {entity_id} wurde in '{table_name}' nicht gefunden."
    }, 404)


def build_missing_table_response(table_name):
    return json_response({
        "ok": False,
        "message": f"Die Tabelle '{table_name}' ist im aktuellen Backend-Modus nicht vorbereitet."
    }, 404)


def get_validated_store(table_name, permission_action):
    resolved_table_name = resolve_table_name(table_name)
    store = get_store()
    if not store.table_exists(resolved_table_name):
        return None, build_missing_table_response(table_name)

    permission_error = require_table_permission(resolved_table_name, permission_action)
    if permission_error:
        return None, permission_error

    return store, resolved_table_name, None


@resources_bp.get("/<table_name>")
def list_entities(table_name):
    store, resolved_table_name, error_response = get_validated_store(table_name, "read")
    if error_response:
        return error_response

    return json_response({
        "ok": True,
        "provider": current_app.config["DATA_MODE"],
        "meta": store.get_meta(resolved_table_name),
        "items": store.list(resolved_table_name)
    })


@resources_bp.get("/<table_name>/<entity_id>")
def get_entity(table_name, entity_id):
    store, resolved_table_name, error_response = get_validated_store(table_name, "read")
    if error_response:
        return error_response

    entity = store.get(resolved_table_name, entity_id)
    if not entity:
        return build_not_found_response(table_name, entity_id)

    return json_response({
        "ok": True,
        "item": entity
    })


@resources_bp.post("/<table_name>")
def create_entity(table_name):
    store, resolved_table_name, error_response = get_validated_store(table_name, "create")
    if error_response:
        return error_response

    payload = request.get_json(silent=True) or {}
    entity = store.create(resolved_table_name, payload)
    publish_event("table-changed", {
        "table": resolved_table_name,
        "action": "create",
        "id": entity.get("id")
    })
    return json_response({
        "ok": True,
        "item": entity,
        "meta": store.get_meta(resolved_table_name)
    }, 201)


@resources_bp.patch("/<table_name>/<entity_id>")
def update_entity(table_name, entity_id):
    store, resolved_table_name, error_response = get_validated_store(table_name, "update")
    if error_response:
        return error_response

    payload = request.get_json(silent=True) or {}
    entity = store.update(resolved_table_name, entity_id, payload)
    if not entity:
        return build_not_found_response(table_name, entity_id)

    publish_event("table-changed", {
        "table": resolved_table_name,
        "action": "update",
        "id": entity.get("id", entity_id)
    })
    return json_response({
        "ok": True,
        "item": entity,
        "meta": store.get_meta(resolved_table_name)
    })


@resources_bp.delete("/<table_name>/<entity_id>")
def delete_entity(table_name, entity_id):
    store, resolved_table_name, error_response = get_validated_store(table_name, "delete")
    if error_response:
        return error_response

    deleted = store.delete(resolved_table_name, entity_id)
    if not deleted:
        return build_not_found_response(table_name, entity_id)

    publish_event("table-changed", {
        "table": resolved_table_name,
        "action": "delete",
        "id": entity_id
    })
    return json_response({
        "ok": True,
        "meta": store.get_meta(resolved_table_name)
    })

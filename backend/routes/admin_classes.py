from flask import Blueprint, request, session

from api_utils import build_error_response, get_store_manager, json_response
from events import publish_event
from security import get_current_user, get_user_permissions, require_explicit_permission


admin_classes_bp = Blueprint("admin_classes", __name__, url_prefix="/api/admin/klassen")


def _require_admin():
    error = require_explicit_permission("benutzer.bearbeiten")
    if error:
        return None, error
    user = get_current_user()
    if "*" not in get_user_permissions(user):
        return None, build_error_response(403, "Nur Admins duerfen Klassen verwalten.")
    return user, None


@admin_classes_bp.get("")
def list_classes():
    _, error = _require_admin()
    if error:
        return error
    return json_response({"ok": True, "items": get_store_manager().list_classes(include_inactive=True)})


@admin_classes_bp.post("")
def create_class():
    _, error = _require_admin()
    if error:
        return error
    payload = request.get_json(silent=True) or {}
    try:
        item = get_store_manager().create_class(payload)
    except ValueError as error:
        return build_error_response(400, str(error))
    publish_event("table-changed", {"table": "klassen", "action": "create", "id": item.get("id")})
    if payload.get("copyParticipants"):
        publish_event("table-changed", {"table": "benutzer", "action": "update"})
    return json_response({"ok": True, "item": item}, 201)


@admin_classes_bp.patch("/<class_id>")
def update_class(class_id):
    _, error = _require_admin()
    if error:
        return error
    payload = request.get_json(silent=True) or {}
    item = get_store_manager().update_class(class_id, payload)
    if not item:
        return build_error_response(404, "Klasse wurde nicht gefunden.")
    publish_event("table-changed", {"table": "klassen", "action": "update", "id": item.get("id")})
    return json_response({"ok": True, "item": item})


@admin_classes_bp.post("/<class_id>/delete-with-password")
def delete_class(class_id):
    user, error = _require_admin()
    if error:
        return error
    payload = request.get_json(silent=True) or {}
    password = str(payload.get("password") or "")
    if password != str(user.get("password") or ""):
        return build_error_response(403, "Passwort wurde nicht bestaetigt.")
    try:
        item = get_store_manager().delete_class(class_id)
    except ValueError as error:
        return build_error_response(400, str(error))
    if not item:
        return build_error_response(404, "Klasse wurde nicht gefunden.")
    if str(session.get("active_class_id")) == str(class_id):
        session.pop("active_class_id", None)
        session.pop("active_class_db", None)
    publish_event("table-changed", {"table": "klassen", "action": "delete", "id": class_id})
    return json_response({"ok": True, "item": item})

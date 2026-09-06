from flask import Blueprint, request, session

from api_utils import build_error_response, get_common_store, get_store_manager, json_response
from security import get_user_permissions

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def sanitize_user(user):
    if not user:
        return None
    sanitized = {
        key: value
        for key, value in user.items()
        if key != "password"
    }
    permissions = get_user_permissions(user)
    sanitized["permissions"] = permissions
    store_manager = get_store_manager()
    assigned_classes = store_manager.get_accessible_classes({**user, "permissions": permissions})
    active_class = store_manager.resolve_active_class(
        {**user, "permissions": permissions},
        session.get("active_class_id")
    )
    if active_class:
        session["active_class_id"] = active_class.get("id")
        session["active_class_db"] = active_class.get("datenbankName")
    sanitized["assignedClasses"] = assigned_classes
    sanitized["activeClass"] = active_class
    sanitized["canSwitchClass"] = len(assigned_classes) > 1
    return sanitized


def build_auth_state_response(user=None):
    return json_response({
        "authenticated": bool(user),
        "user": sanitize_user(user)
    })


@auth_bp.get("/me")
def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return build_auth_state_response()

    user = get_common_store().get("benutzer", user_id)
    if not user:
        session.pop("user_id", None)
        return build_auth_state_response()

    return build_auth_state_response(user)


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", "")).strip()

    users = get_common_store().list("benutzer")
    user = next(
        (
            item for item in users
            if item.get("username") == username and item.get("password") == password
        ),
        None
    )

    if not user:
        return json_response({
            "ok": False,
            "message": "Benutzername oder Passwort falsch."
        }, 401)

    session["user_id"] = user["id"]
    sanitized = sanitize_user(user)
    if sanitized.get("activeClass"):
        get_common_store().update("benutzer", user["id"], {**user, "lastClassId": sanitized["activeClass"].get("id")})
    return json_response({
        "ok": True,
        "user": sanitized
    })


@auth_bp.post("/active-class")
def set_active_class():
    user_id = session.get("user_id")
    if not user_id:
        return json_response({"authenticated": False, "user": None}, 401)

    user = get_common_store().get("benutzer", user_id)
    if not user:
        session.pop("user_id", None)
        return json_response({"authenticated": False, "user": None}, 401)

    payload = request.get_json(silent=True) or {}
    class_id = payload.get("klasseId")
    if class_id in (None, ""):
        class_id = payload.get("classId")
    permissions = get_user_permissions(user)
    active_class = get_store_manager().resolve_active_class({**user, "permissions": permissions}, class_id)
    if not active_class or str(active_class.get("id")) != str(class_id):
        return build_error_response(403, "Keine Berechtigung fuer diese Klasse.")

    session["active_class_id"] = active_class.get("id")
    session["active_class_db"] = active_class.get("datenbankName")
    get_common_store().update("benutzer", user["id"], {**user, "lastClassId": active_class.get("id")})
    updated_user = get_common_store().get("benutzer", user["id"]) or user
    return build_auth_state_response(updated_user)


@auth_bp.post("/logout")
def logout():
    session.pop("user_id", None)
    return json_response({"ok": True})

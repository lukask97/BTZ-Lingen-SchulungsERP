from flask import Blueprint, current_app, request, session

from api_utils import get_store, json_response
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
    sanitized["permissions"] = get_user_permissions(user)
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

    user = get_store().get("benutzer", user_id)
    if not user:
        session.pop("user_id", None)
        return build_auth_state_response()

    return build_auth_state_response(user)


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", "")).strip()

    users = get_store().list("benutzer")
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
    return json_response({
        "ok": True,
        "user": sanitize_user(user),
        "mode": current_app.config["DATA_MODE"]
    })


@auth_bp.post("/logout")
def logout():
    session.pop("user_id", None)
    return json_response({"ok": True})

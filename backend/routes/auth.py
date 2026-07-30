from flask import Blueprint, current_app, jsonify, request, session

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def sanitize_user(user):
    if not user:
        return None
    return {
        key: value
        for key, value in user.items()
        if key != "password"
    }


def get_store():
    return current_app.extensions["store"]


@auth_bp.get("/me")
def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"authenticated": False, "user": None})

    user = get_store().get("benutzer", user_id)
    if not user:
        session.pop("user_id", None)
        return jsonify({"authenticated": False, "user": None})

    return jsonify({"authenticated": True, "user": sanitize_user(user)})


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
        return jsonify({
            "ok": False,
            "message": "Benutzername oder Passwort falsch."
        }), 401

    session["user_id"] = user["id"]
    return jsonify({
        "ok": True,
        "user": sanitize_user(user),
        "mode": current_app.config["DATA_MODE"]
    })


@auth_bp.post("/logout")
def logout():
    session.pop("user_id", None)
    return jsonify({"ok": True})

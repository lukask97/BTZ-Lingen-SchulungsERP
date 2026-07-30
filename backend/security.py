from flask import current_app, jsonify, session


TABLE_ACCESS_MAP = {
    "abteilungen": "organisation",
    "angebote": "verkauf",
    "arbeitszeiten": "personalwesen",
    "artikel": "artikel",
    "auftraege": "verkauf",
    "belege": "buchhaltung",
    "benutzer": "benutzer",
    "benutzerSpalten": "benutzer",
    "berichte": "gf",
    "bestellungen": "einkauf",
    "bewerber": "personalwesen",
    "einkaufsdokumente": "einkauf",
    "feldMetadaten": "benutzer",
    "firmenkonto": "buchhaltung",
    "freigaben": "gf",
    "kategorien": "artikel",
    "krankmeldungen": "personalwesen",
    "kunden": "kunde",
    "kundenanfragen": "verkauf",
    "lager": "lager",
    "lieferanten": "einkauf",
    "mahnungen": "buchhaltung",
    "marketingaktionen": "marketing",
    "mitarbeiter": "personalwesen",
    "nachrichten": "verkauf",
    "personalakten": "personalwesen",
    "rechte": "rechte",
    "reklamationen": "service",
    "retouren": "logistik",
    "rollen": "rollen",
    "schulungen": "personalwesen",
    "services": "service",
    "urlaubsantraege": "personalwesen",
    "versandauftraege": "logistik",
    "vertriebsdokumente": "verkauf",
    "zahlungen": "buchhaltung",
}


ACTION_CANDIDATES = {
    "read": ("anzeigen", "lesen", "bearbeiten"),
    "create": ("anlegen", "bearbeiten"),
    "update": ("bearbeiten",),
    "delete": ("loeschen", "bearbeiten"),
}


def get_store():
    return current_app.extensions["store"]


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return get_store().get("benutzer", user_id)


def permission_matches(user_permissions, required_permission):
    if "*" in user_permissions:
        return True
    if required_permission in user_permissions:
        return True

    if "." not in required_permission:
        return any(
            permission == required_permission
            or permission.startswith(required_permission + ".")
            for permission in user_permissions
        )

    access_prefix = required_permission.split(".", 1)[0]
    return access_prefix in user_permissions


def build_permission_candidates(table_name, action):
    access_key = TABLE_ACCESS_MAP.get(table_name)
    if not access_key:
        return []

    suffixes = ACTION_CANDIDATES.get(action, ())
    candidates = [access_key]
    candidates.extend(f"{access_key}.{suffix}" for suffix in suffixes)
    return candidates


def has_table_permission(user, table_name, action):
    if not user:
        return False

    permissions = user.get("permissions") or []
    candidates = build_permission_candidates(table_name, action)
    if not candidates:
        return False

    return any(permission_matches(permissions, candidate) for candidate in candidates)


def require_table_permission(table_name, action):
    user = get_current_user()
    if not user:
        return jsonify({
            "ok": False,
            "message": "Nicht angemeldet."
        }), 401

    if has_table_permission(user, table_name, action):
        return None

    return jsonify({
        "ok": False,
        "message": f"Keine Berechtigung fuer {action} auf '{table_name}'."
    }), 403


def require_explicit_permission(permission):
    user = get_current_user()
    if not user:
        return jsonify({
            "ok": False,
            "message": "Nicht angemeldet."
        }), 401

    permissions = user.get("permissions") or []
    if permission_matches(permissions, permission):
        return None

    return jsonify({
        "ok": False,
        "message": f"Keine Berechtigung fuer '{permission}'."
    }), 403

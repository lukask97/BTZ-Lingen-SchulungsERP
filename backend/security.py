from flask import session

from api_utils import build_error_response, get_store


TABLE_ACCESS_MAP = {
    "abteilungen": "organisation",
    "angebote": "verkauf",
    "angebotspositionen": "verkauf",
    "arbeitszeiten": "personalwesen",
    "artikel": "artikel",
    "artikelStueckliste": "artikel",
    "auftraege": "verkauf",
    "auftragspositionen": "verkauf",
    "belege": "buchhaltung",
    "benutzer": "benutzer",
    "benutzerSpalten": "benutzer",
    "berichte": "gf",
    "bestellungen": "einkauf",
    "bestellpositionen": "einkauf",
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
    "lehrkraftOptionen": "gf",
    "lieferanten": "einkauf",
    "mahnungen": "buchhaltung",
    "marketingaktionen": "marketing",
    "mitarbeiter": "personalwesen",
    "nachrichten": "verkauf",
    "nummernkreise": "benutzer",
    "personalakten": "personalwesen",
    "fristenOptionen": "benutzer",
    "rechte": "rechte",
    "reklamationen": "service",
    "retouren": "logistik",
    "rollen": "rollen",
    "rollenRechte": "rollen",
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


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return get_store().get("benutzer", user_id)


def get_user_permissions(user):
    permissions = list(user.get("permissions") or [])
    store = get_store()

    try:
        roles = store.list("rollen") if store.table_exists("rollen") else []
    except Exception:
        roles = []

    try:
        role_permissions = store.list("rollenRechte") if store.table_exists("rollenRechte") else []
    except Exception:
        role_permissions = []

    role_name = str(user.get("rolle") or "").lower()
    role_id = user.get("rolleId")
    matching_role = next((
        role for role in roles
        if str(role.get("id")) == str(role_id)
        or str(role.get("name") or "").lower() == role_name
    ), None)

    if matching_role:
        permissions.extend(matching_role.get("permissions") or [])
        permissions.extend(
            item.get("rechtName") or item.get("permission") or ""
            for item in role_permissions
            if str(item.get("rolleId") or item.get("rollenId") or "") == str(matching_role.get("id"))
            or str(item.get("rolleName") or "").lower() == str(matching_role.get("name") or "").lower()
        )

    deduped = []
    for permission in permissions:
        value = str(permission or "").strip()
        if value and value not in deduped:
            deduped.append(value)
    return deduped


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

    permissions = get_user_permissions(user)
    candidates = build_permission_candidates(table_name, action)
    if not candidates:
        return False

    return any(permission_matches(permissions, candidate) for candidate in candidates)


def require_table_permission(table_name, action):
    user = get_current_user()
    if not user:
        return build_error_response(401, "Nicht angemeldet.")

    # Persoenliche Spalteneinstellungen sollen fuer jeden angemeldeten Nutzer
    # verfuegbar sein und nicht von Verwaltungsrechten abhaengen.
    if table_name == "benutzerSpalten":
        return None

    if has_table_permission(user, table_name, action):
        return None

    return build_error_response(403, f"Keine Berechtigung fuer {action} auf '{table_name}'.")


def require_explicit_permission(permission):
    user = get_current_user()
    if not user:
        return build_error_response(401, "Nicht angemeldet.")

    permissions = get_user_permissions(user)
    if permission_matches(permissions, permission):
        return None

    return build_error_response(403, f"Keine Berechtigung fuer '{permission}'.")

import copy
import io
import json
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from flask import Blueprint, current_app, request, send_file

from api_utils import build_error_response, get_store_manager, json_response
from events import publish_event
from security import get_current_user, get_user_permissions, require_explicit_permission
from store_manager import CLASS_TABLES, COMMON_TABLES


admin_backup_bp = Blueprint("admin_backup", __name__, url_prefix="/api/admin/backup")

BACKUP_FORMAT = "btz-schulungserp-backup"
BACKUP_VERSION = 1

RESTORE_GROUPS = {
    "gesamt": {"label": "Gesamte Firma", "tables": set(CLASS_TABLES)},
    "stammdaten": {
        "label": "Stammdaten",
        "tables": {
            "kunden", "lieferanten", "artikel", "artikelIndividualisierung", "artikelStueckliste",
            "kategorien", "lager", "services", "lieferantenArtikelStaffeln"
        },
    },
    "verkauf": {
        "label": "Verkauf",
        "tables": {
            "kundenanfragen", "angebote", "angebotspositionen", "auftraege", "auftragspositionen",
            "vertriebsdokumente", "versandauftraege", "reklamationen", "retouren", "nachrichten"
        },
    },
    "einkauf": {
        "label": "Einkauf",
        "tables": {"lieferanten", "bestellungen", "bestellpositionen", "einkaufsdokumente"},
    },
    "buchhaltung": {
        "label": "Buchhaltung",
        "tables": {"rechnungen", "zahlungen", "mahnungen", "belege", "firmenkonto"},
    },
    "personal": {
        "label": "Personal",
        "tables": {
            "mitarbeiter", "arbeitszeiten", "urlaubsantraege", "krankmeldungen",
            "schulungen", "personalakten", "bewerber"
        },
    },
    "organisation": {
        "label": "Organisation",
        "tables": {"abteilungen", "marketingaktionen", "freigaben", "berichte"},
    },
    "verwaltung": {
        "label": "Verwaltung Klassendaten",
        "tables": {
            "unternehmen", "nummernkreise", "lehrkraftOptionen", "fristenOptionen",
            "feldMetadaten", "tagesversandprotokolle"
        },
    },
}

DEPENDENCIES = {
    "artikelIndividualisierung": {"artikel"},
    "artikelStueckliste": {"artikel"},
    "lieferantenArtikelStaffeln": {"lieferanten", "artikel"},
    "kundenanfragen": {"kunden"},
    "angebote": {"kunden", "kundenanfragen"},
    "angebotspositionen": {"angebote", "artikel", "services"},
    "auftraege": {"kunden", "kundenanfragen", "angebote"},
    "auftragspositionen": {"auftraege", "artikel", "services"},
    "vertriebsdokumente": {"auftraege", "kunden"},
    "versandauftraege": {"auftraege"},
    "reklamationen": {"kunden", "auftraege"},
    "retouren": {"kunden", "artikel"},
    "nachrichten": {"kundenanfragen", "angebote"},
    "bestellungen": {"lieferanten"},
    "bestellpositionen": {"bestellungen", "artikel"},
    "einkaufsdokumente": {"bestellungen", "lieferanten"},
    "rechnungen": {"auftraege", "bestellungen", "kunden", "lieferanten"},
    "zahlungen": {"rechnungen", "auftraege", "bestellungen"},
    "mahnungen": {"rechnungen"},
    "arbeitszeiten": {"mitarbeiter"},
    "urlaubsantraege": {"mitarbeiter"},
    "krankmeldungen": {"mitarbeiter"},
    "personalakten": {"mitarbeiter"},
}

REFERENCE_FIELDS = {
    "kundeId": "kunden",
    "lieferantId": "lieferanten",
    "artikelId": "artikel",
    "hauptartikelId": "artikel",
    "komponentenartikelId": "artikel",
    "serviceId": "services",
    "anfrageId": "kundenanfragen",
    "angebotId": "angebote",
    "auftragId": "auftraege",
    "bestellungId": "bestellungen",
    "rechnungId": "rechnungen",
    "mitarbeiterId": "mitarbeiter",
    "schulungId": "schulungen",
}


def _require_backup_admin():
    error = require_explicit_permission("benutzer.bearbeiten")
    if error:
        return None, error
    user = get_current_user()
    if "*" not in get_user_permissions(user):
        return None, build_error_response(403, "Nur Admins duerfen Backups verwalten.")
    return user, None


def _check_password(user, password):
    return str(password or "") == str(user.get("password") or "")


def _image_store():
    return current_app.extensions["article_image_store"]


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _table_counts(store):
    counts = {}
    for table_name in store.list_tables():
        try:
            counts[table_name] = len(store.list(table_name))
        except Exception:
            counts[table_name] = None
    return counts


def _build_manifest():
    manager = get_store_manager()
    common_store = manager.get_common_store()
    classes = manager.list_classes(include_inactive=True)
    return {
        "format": BACKUP_FORMAT,
        "version": BACKUP_VERSION,
        "createdAt": _now_iso(),
        "common": {
            table_name: common_store.list(table_name)
            for table_name in sorted(COMMON_TABLES)
            if common_store.table_exists(table_name)
        },
        "classes": [
            {
                "id": class_item.get("id"),
                "name": class_item.get("name"),
                "datenbankName": class_item.get("datenbankName"),
                "status": class_item.get("status"),
                "beschreibung": class_item.get("beschreibung"),
                "tables": {
                    table_name: manager.get_class_store(class_item.get("datenbankName")).list(table_name)
                    for table_name in CLASS_TABLES
                    if manager.get_class_store(class_item.get("datenbankName")).table_exists(table_name)
                },
            }
            for class_item in classes
        ],
        "restoreGroups": _restore_group_payload(),
    }


def _restore_group_payload():
    return [
        {
            "id": group_id,
            "label": group["label"],
            "tables": sorted(group["tables"]),
        }
        for group_id, group in RESTORE_GROUPS.items()
    ]


def _read_manifest_from_upload(upload):
    if not upload:
        raise ValueError("Keine Backup-Datei hochgeladen.")
    content = upload.read()
    with zipfile.ZipFile(io.BytesIO(content), "r") as archive:
        with archive.open("manifest.json") as manifest_file:
            manifest = json.loads(manifest_file.read().decode("utf-8"))
        image_names = [
            name for name in archive.namelist()
            if name.startswith("images/artikel/") and not name.endswith("/")
        ]
    _validate_manifest(manifest)
    return manifest, image_names, content


def _validate_manifest(manifest):
    if manifest.get("format") != BACKUP_FORMAT:
        raise ValueError("Diese Datei ist kein gueltiges SchulungsERP-Backup.")
    if int(manifest.get("version") or 0) > BACKUP_VERSION:
        raise ValueError("Die Backup-Datei stammt aus einer neueren Version.")


def _resolve_tables(group_ids):
    selected = set()
    for group_id in group_ids or []:
        group = RESTORE_GROUPS.get(str(group_id))
        if group:
            selected.update(group["tables"])
    if not selected:
        return set(), set()
    if "gesamt" in {str(item) for item in group_ids or []}:
        selected = set(CLASS_TABLES)
    resolved = set(selected)
    changed = True
    while changed:
        changed = False
        for table_name in list(resolved):
            before = len(resolved)
            resolved.update(DEPENDENCIES.get(table_name, set()))
            changed = changed or len(resolved) != before
    return selected, resolved


def _selected_class_tables(class_payload, table_names):
    tables = class_payload.get("tables") or {}
    return {
        table_name: copy.deepcopy(tables.get(table_name, []))
        for table_name in CLASS_TABLES
        if table_name in table_names
    }


def _max_numeric_id(records):
    values = []
    for item in records or []:
        try:
            values.append(int(item.get("id")))
        except (TypeError, ValueError):
            continue
    return max(values or [0])


def _make_id_maps(store, records_by_table):
    id_maps = {}
    for table_name, records in records_by_table.items():
        start = _max_numeric_id(store.list(table_name)) + 1
        id_maps[table_name] = {
            str(record.get("id")): start + index
            for index, record in enumerate(records or [])
            if record.get("id") not in (None, "")
        }
    return id_maps


def _remap_value(value, table_name, id_maps):
    if table_name not in id_maps or value in (None, ""):
        return value
    return id_maps[table_name].get(str(value), value)


def _remap_record(record, table_name, id_maps):
    item = copy.deepcopy(record)
    item["id"] = _remap_value(item.get("id"), table_name, id_maps)
    for key, target_table in REFERENCE_FIELDS.items():
        if key in item:
            item[key] = _remap_value(item.get(key), target_table, id_maps)
    for key, value in list(item.items()):
        if isinstance(value, dict):
            item[key] = _remap_nested(value, id_maps)
        elif isinstance(value, list):
            item[key] = [_remap_nested(child, id_maps) for child in value]
    return item


def _remap_nested(value, id_maps):
    if isinstance(value, dict):
        item = copy.deepcopy(value)
        for key, target_table in REFERENCE_FIELDS.items():
            if key in item:
                item[key] = _remap_value(item.get(key), target_table, id_maps)
        return item
    return value


def _records_for_mode(store, records_by_table, mode):
    if mode != "merge":
        return records_by_table
    id_maps = _make_id_maps(store, records_by_table)
    return {
        table_name: [_remap_record(record, table_name, id_maps) for record in records]
        for table_name, records in records_by_table.items()
    }


def _safe_image_member(name):
    if not name.startswith("images/artikel/"):
        return None
    filename = Path(name).name
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", filename or ""):
        return None
    return filename


def _restore_images(zip_content, selected_tables):
    if "artikel" not in selected_tables:
        return 0
    restored = 0
    image_store = _image_store()
    with zipfile.ZipFile(io.BytesIO(zip_content), "r") as archive:
        for name in archive.namelist():
            filename = _safe_image_member(name)
            if not filename:
                continue
            image_store.restore_file(filename, archive.read(name))
            restored += 1
    return restored


def _collect_article_numbers_except(class_id):
    manager = get_store_manager()
    article_numbers = set()
    for class_item in manager.list_classes(include_inactive=True):
        if str(class_item.get("id")) == str(class_id):
            continue
        store = manager.get_class_store(class_item.get("datenbankName"))
        for article in store.list("artikel"):
            article_number = str(article.get("artikelNr") or "").strip()
            if article_number:
                article_numbers.add(article_number)
    return article_numbers


def _delete_unused_article_images(article_numbers, used_article_numbers):
    image_store = _image_store()
    deleted = 0
    for article_number in article_numbers:
        if article_number in used_article_numbers:
            continue
        for image in image_store.list_images(article_number):
            if image_store.delete_image(article_number, image.get("slot")):
                deleted += 1
    return deleted


def _summarize_manifest(manifest, image_names=None):
    classes = []
    for class_payload in manifest.get("classes") or []:
        tables = class_payload.get("tables") or {}
        classes.append({
            "id": class_payload.get("id"),
            "name": class_payload.get("name"),
            "datenbankName": class_payload.get("datenbankName"),
            "status": class_payload.get("status"),
            "tableCounts": {table_name: len(records or []) for table_name, records in tables.items()},
        })
    return {
        "format": manifest.get("format"),
        "version": manifest.get("version"),
        "createdAt": manifest.get("createdAt"),
        "classes": classes,
        "commonTableCounts": {
            table_name: len(records or [])
            for table_name, records in (manifest.get("common") or {}).items()
        },
        "imageCount": len(image_names or []),
        "restoreGroups": _restore_group_payload(),
    }


@admin_backup_bp.get("/status")
def backup_status():
    _, error = _require_backup_admin()
    if error:
        return error
    manager = get_store_manager()
    classes = []
    for class_item in manager.list_classes(include_inactive=True):
        store = manager.get_class_store(class_item.get("datenbankName"))
        classes.append({
            **class_item,
            "tableCounts": _table_counts(store),
        })
    return json_response({
        "ok": True,
        "classes": classes,
        "commonTableCounts": _table_counts(manager.get_common_store()),
        "imageCount": len(_image_store().list_all_files()),
        "restoreGroups": _restore_group_payload(),
    })


@admin_backup_bp.post("/export")
def export_backup():
    _, error = _require_backup_admin()
    if error:
        return error
    manifest = _build_manifest()
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        for path in _image_store().list_all_files():
            archive.write(path, f"images/artikel/{path.name}")
    buffer.seek(0)
    filename = f"schulungserp-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.zip"
    return send_file(buffer, mimetype="application/zip", as_attachment=True, download_name=filename)


@admin_backup_bp.post("/inspect")
def inspect_backup():
    _, error = _require_backup_admin()
    if error:
        return error
    try:
        manifest, image_names, _ = _read_manifest_from_upload(request.files.get("backup"))
    except (ValueError, zipfile.BadZipFile, KeyError, json.JSONDecodeError) as error:
        return build_error_response(400, str(error) or "Backup-Datei konnte nicht gelesen werden.")
    return json_response({"ok": True, "summary": _summarize_manifest(manifest, image_names)})


@admin_backup_bp.post("/restore")
def restore_backup():
    user, error = _require_backup_admin()
    if error:
        return error
    if not _check_password(user, request.form.get("password")):
        return build_error_response(403, "Passwort wurde nicht bestaetigt.")
    try:
        mapping = json.loads(request.form.get("mapping") or "{}")
        manifest, _, zip_content = _read_manifest_from_upload(request.files.get("backup"))
    except (ValueError, zipfile.BadZipFile, KeyError, json.JSONDecodeError) as error:
        return build_error_response(400, str(error) or "Backup-Datei konnte nicht gelesen werden.")

    manager = get_store_manager()
    classes_by_source = {str(item.get("id")): item for item in manifest.get("classes") or []}
    restored = []
    changed_tables = set()
    image_count = 0

    for class_mapping in mapping.get("classes") or []:
        source = classes_by_source.get(str(class_mapping.get("sourceId")))
        if not source or class_mapping.get("mode") == "skip":
            continue
        selected, resolved = _resolve_tables(class_mapping.get("groups") or ["gesamt"])
        if not resolved:
            continue
        restore_mode = "merge" if class_mapping.get("restoreMode") == "merge" else "replace"
        records_by_table = _selected_class_tables(source, resolved)

        target_mode = class_mapping.get("targetMode")
        if target_mode == "new":
            target_class = manager.create_class({
                "name": class_mapping.get("newClassName") or f"{source.get('name') or 'Import'} Kopie",
                "beschreibung": f"Aus Backup vom {manifest.get('createdAt') or 'unbekannten Zeitpunkt'} importiert.",
            })
        else:
            target_class = manager.get_common_store().get("klassen", class_mapping.get("targetClassId"))
            if not target_class:
                return build_error_response(404, "Zielklasse wurde nicht gefunden.")

        store = manager.get_class_store(target_class.get("datenbankName"))
        prepared_records = _records_for_mode(store, records_by_table, restore_mode)
        if restore_mode == "merge":
            store.append_records(prepared_records)
        else:
            store.replace_records(prepared_records)
        image_count += _restore_images(zip_content, resolved)
        changed_tables.update(prepared_records.keys())
        restored.append({
            "sourceClass": source.get("name"),
            "targetClass": target_class.get("name"),
            "mode": restore_mode,
            "selectedTables": sorted(selected),
            "restoredTables": sorted(resolved),
        })

    if restored:
        publish_event("data-reset", {"tables": sorted(changed_tables)})
        publish_event("table-changed", {"table": "klassen", "action": "restore"})

    return json_response({"ok": True, "restored": restored, "imageCount": image_count})


@admin_backup_bp.post("/clear-class")
def clear_class_data():
    user, error = _require_backup_admin()
    if error:
        return error
    payload = request.get_json(silent=True) or {}
    if not _check_password(user, payload.get("password")):
        return build_error_response(403, "Passwort wurde nicht bestaetigt.")

    class_ids = payload.get("klasseIds") or []
    if not isinstance(class_ids, list):
        class_ids = [class_ids]
    if not class_ids:
        return build_error_response(400, "Keine Klasse ausgewaehlt.")

    manager = get_store_manager()
    cleared_tables = set()
    deleted_images = 0
    cleared_classes = []

    for class_id in class_ids:
        class_item = manager.get_common_store().get("klassen", class_id)
        if not class_item:
            return build_error_response(404, "Klasse wurde nicht gefunden.")
        store = manager.get_class_store(class_item.get("datenbankName"))
        article_numbers = {
            str(article.get("artikelNr") or "").strip()
            for article in store.list("artikel")
            if str(article.get("artikelNr") or "").strip()
        }
        used_article_numbers = _collect_article_numbers_except(class_id)
        deleted_images += _delete_unused_article_images(article_numbers, used_article_numbers)
        cleared_tables.update(manager.clear_classes([class_id]))
        cleared_classes.append(class_item)

    publish_event("data-reset", {"tables": sorted(cleared_tables)})
    return json_response({
        "ok": True,
        "classes": cleared_classes,
        "tables": sorted(cleared_tables),
        "deletedImages": deleted_images,
    })

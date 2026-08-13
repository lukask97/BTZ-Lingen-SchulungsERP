from flask import Blueprint, current_app, request, send_file

from api_utils import build_error_response, get_article_image_store, get_store, json_response
from events import publish_event
from security import require_table_permission

article_images_bp = Blueprint("article_images", __name__, url_prefix="/api/artikel")


def get_artikel_or_error(artikel_id):
    permission_error = require_table_permission("artikel", "read")
    if permission_error:
        return None, None, permission_error

    store = get_store()
    artikel = store.get("artikel", artikel_id)
    if not artikel:
        return None, None, build_error_response(404, f"Artikel {artikel_id} wurde nicht gefunden.")

    artikel_nr = artikel.get("artikelNr")
    if not artikel_nr:
        return None, None, build_error_response(400, "Der Artikel hat keine Artikelnummer fuer die Bildablage.")

    return store, artikel, None


def sync_image_count(store, artikel):
    artikel_nr = artikel.get("artikelNr")
    image_store = get_article_image_store()
    anzahl_bilder = image_store.count_images(artikel_nr)
    if int(artikel.get("anzahlBilder") or 0) == anzahl_bilder:
        return artikel

    updated = store.update("artikel", artikel.get("id"), {"anzahlBilder": anzahl_bilder})
    publish_event("table-changed", {
        "table": "artikel",
        "action": "update",
        "id": artikel.get("id")
    })
    return updated or {**artikel, "anzahlBilder": anzahl_bilder}


@article_images_bp.get("/<artikel_id>/bilder")
def list_article_images(artikel_id):
    store, artikel, error_response = get_artikel_or_error(artikel_id)
    if error_response:
        return error_response

    artikel = sync_image_count(store, artikel)
    images = get_article_image_store().list_images(artikel.get("artikelNr"))
    return json_response({
        "ok": True,
        "artikelId": artikel.get("id"),
        "artikelNr": artikel.get("artikelNr"),
        "anzahlBilder": artikel.get("anzahlBilder", len(images)),
        "items": images
    })


@article_images_bp.post("/<artikel_id>/bilder/<slot>")
def upload_article_image(artikel_id, slot):
    permission_error = require_table_permission("artikel", "update")
    if permission_error:
        return permission_error

    store, artikel, error_response = get_artikel_or_error(artikel_id)
    if error_response:
        return error_response

    uploaded_file = request.files.get("file")
    if not uploaded_file or not uploaded_file.filename:
        return build_error_response(400, "Es wurde keine Bilddatei hochgeladen.")

    try:
        image = get_article_image_store().save_image(artikel.get("artikelNr"), slot, uploaded_file)
        artikel = sync_image_count(store, artikel)
    except ValueError as error:
        return build_error_response(400, str(error))

    return json_response({
        "ok": True,
        "item": image,
        "anzahlBilder": artikel.get("anzahlBilder", 0),
        "maxBilder": current_app.config["ARTICLE_IMAGE_MAX_COUNT"]
    }, 201)


@article_images_bp.delete("/<artikel_id>/bilder/<slot>")
def delete_article_image(artikel_id, slot):
    permission_error = require_table_permission("artikel", "update")
    if permission_error:
        return permission_error

    store, artikel, error_response = get_artikel_or_error(artikel_id)
    if error_response:
        return error_response

    try:
        deleted = get_article_image_store().delete_image(artikel.get("artikelNr"), slot)
        artikel = sync_image_count(store, artikel)
    except ValueError as error:
        return build_error_response(400, str(error))

    if not deleted:
        return build_error_response(404, "Fuer diesen Slot existiert kein Bild.")

    return json_response({
        "ok": True,
        "anzahlBilder": artikel.get("anzahlBilder", 0)
    })


@article_images_bp.get("/bilder/<artikel_nr>/<slot>")
def serve_article_image(artikel_nr, slot):
    permission_error = require_table_permission("artikel", "read")
    if permission_error:
        return permission_error

    try:
        file_path = get_article_image_store().get_image_path(artikel_nr, slot)
    except ValueError as error:
        return build_error_response(400, str(error))

    if not file_path:
        return build_error_response(404, "Bild nicht gefunden.")

    return send_file(file_path)

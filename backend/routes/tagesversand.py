from flask import Blueprint

from api_utils import get_store, json_response
from events import publish_event
from security import require_explicit_permission
from tagesversand import run_tagesversand


tagesversand_bp = Blueprint("tagesversand", __name__, url_prefix="/api/verkauf/tagesversand")


@tagesversand_bp.get("/protokolle")
def list_protocols():
    error = require_explicit_permission("verkauf.lesen")
    if error:
        return error
    items = get_store("tagesversandprotokolle").list("tagesversandprotokolle")
    return json_response({"ok": True, "items": sorted(items, key=lambda item: str(item.get("ausgefuehrtAm") or ""), reverse=True)})


@tagesversand_bp.post("/ausfuehren")
def run_manually():
    error = require_explicit_permission("verkauf.bearbeiten")
    if error:
        return error
    result = run_tagesversand(get_store("tagesversandprotokolle"), force=True)
    if result.get("protocol"):
        for table_name in ("angebote", "nachrichten", "tagesversandprotokolle"):
            publish_event("table-changed", {"table": table_name, "action": "tagesversand"})
    return json_response(result)

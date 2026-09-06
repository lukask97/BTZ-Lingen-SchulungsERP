from flask import Blueprint, Response, request

from api_utils import get_store, get_store_manager, json_response
from events import publish_event
from security import get_current_user, get_user_permissions, require_explicit_permission

meta_bp = Blueprint("meta", __name__, url_prefix="/api")


def build_tables_payload(store):
    return [store.get_meta(table_name) for table_name in store.list_tables()]


def build_api_overview_html(store):
    table_links = "\n".join(
        f'<li><a href="/api/datenbanken/{meta["name"]}">/api/datenbanken/{meta["name"]}</a></li>'
        for meta in build_tables_payload(store)
    ) or "<li>Keine Tabellen vorhanden</li>"

    return f"""<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BTZ-SchulungsERP API</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #f5f7fb;
      --panel: #ffffff;
      --text: #172033;
      --muted: #5f6c85;
      --line: #d8e0ef;
      --accent: #1f5eff;
    }}
    body {{
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      background: linear-gradient(180deg, #eef3ff 0%, var(--bg) 100%);
      color: var(--text);
    }}
    main {{
      max-width: 980px;
      margin: 0 auto;
      padding: 32px 20px 48px;
    }}
    h1, h2 {{
      margin: 0 0 12px;
    }}
    p {{
      color: var(--muted);
      line-height: 1.5;
    }}
    .panel {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 20px;
      margin-top: 20px;
      box-shadow: 0 10px 30px rgba(18, 37, 63, 0.06);
    }}
    code, pre {{
      background: #eef2fb;
      border-radius: 6px;
    }}
    code {{
      padding: 2px 6px;
    }}
    pre {{
      padding: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
    }}
    ul {{
      margin: 12px 0 0;
      padding-left: 20px;
    }}
    li {{
      margin: 8px 0;
    }}
    a {{
      color: var(--accent);
      text-decoration: none;
    }}
    a:hover {{
      text-decoration: underline;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
    }}
  </style>
</head>
<body>
  <main>
    <h1>BTZ-SchulungsERP API</h1>
    <p>Diese Uebersicht zeigt die wichtigsten Einstiegspunkte der API-Schnittstelle, die Anmeldung und die aktuell verfuegbaren Tabellen-Endpunkte.</p>

    <div class="grid">
      <section class="panel">
        <h2>Basis-Endpunkte</h2>
        <ul>
          <li><a href="/api/"><code>GET /api</code></a></li>
          <li><a href="/api/health"><code>GET /api/health</code></a></li>
          <li><a href="/api/info"><code>GET /api/info</code></a></li>
          <li><a href="/api/meta"><code>GET /api/meta</code></a></li>
          <li><code>POST /api/reset</code></li>
          <li><code>/api/datenbanken/&lt;tabelle&gt;</code> fuer CRUD-Zugriffe</li>
        </ul>
      </section>

      <section class="panel">
        <h2>CRUD-Muster</h2>
        <ul>
          <li><code>GET /api/datenbanken/&lt;tabelle&gt;</code></li>
          <li><code>GET /api/datenbanken/&lt;tabelle&gt;/&lt;id&gt;</code></li>
          <li><code>POST /api/datenbanken/&lt;tabelle&gt;</code></li>
          <li><code>PATCH /api/datenbanken/&lt;tabelle&gt;/&lt;id&gt;</code></li>
          <li><code>DELETE /api/datenbanken/&lt;tabelle&gt;/&lt;id&gt;</code></li>
        </ul>
      </section>
    </div>

    <section class="panel">
      <h2>Anmeldung</h2>
      <p>Die API verwendet eine serverseitige Session-Anmeldung. Nach <code>POST /api/auth/login</code> wird ein Session-Cookie gesetzt, das bei weiteren Anfragen mitgesendet werden muss.</p>
      <ul>
        <li><code>POST /api/auth/login</code></li>
        <li><code>GET /api/auth/me</code></li>
        <li><code>POST /api/auth/logout</code></li>
      </ul>
      <p>Beispiel fuer den Login-Body:</p>
      <pre>{{
  "username": "admin",
  "password": "admin"
}}</pre>
    </section>

    <section class="panel">
      <h2>Verfuegbare Tabellen</h2>
      <ul>
        {table_links}
      </ul>
    </section>
  </main>
</body>
</html>"""


@meta_bp.get("")
@meta_bp.get("/")
def api_overview():
    store = get_store()
    return Response(build_api_overview_html(store), mimetype="text/html")


@meta_bp.get("/health")
def health():
    return json_response({
        "status": "ok"
    })


@meta_bp.get("/meta")
@meta_bp.get("/info")
def meta():
    store = get_store()
    return json_response({
        "app": "BTZ-SchulungsERP API",
        "tables": build_tables_payload(store)
    })


@meta_bp.post("/reset")
def reset():
    permission_error = require_explicit_permission("gf.bearbeiten")
    if permission_error:
        return permission_error

    payload = request.get_json(silent=True) or {}
    class_ids = payload.get("klasseIds") or payload.get("classIds") or []
    if not isinstance(class_ids, list):
        class_ids = [class_ids]
    store_manager = get_store_manager()
    user = get_current_user()
    permissions = get_user_permissions(user)
    allowed_ids = {str(item.get("id")) for item in store_manager.get_accessible_classes({**user, "permissions": permissions})}
    requested_ids = [class_id for class_id in (class_ids or [0]) if str(class_id) in allowed_ids]
    if not requested_ids:
        return json_response({"ok": False, "message": "Keine berechtigte Klasse fuer den Reset ausgewaehlt."}, 403)
    reset_tables = store_manager.reset_classes(requested_ids)
    publish_event("data-reset", {
        "tables": reset_tables
    })
    store = get_store()
    return json_response({
        "ok": True,
        "tables": build_tables_payload(store)
    })

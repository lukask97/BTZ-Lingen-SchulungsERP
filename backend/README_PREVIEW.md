# Backend und Datenbankmodus

Dieses Backend stellt den Mehrbenutzer-Betrieb fuer das Projekt bereit.
Standardmaessig arbeitet es im Docker-Setup mit PostgreSQL.

## Ziel

- Sitzungsbasiertes Login ueber Backend und Cookie-Session
- Zentrale Datenhaltung fuer mehrere Browser und Benutzer
- Generische REST-Endpunkte fuer die Tabellen des ERP-Mockups
- Ruecksetzen auf gemeinsame Seed-Daten fuer Tests und Unterricht

## Aktueller Modus

- `ERP_DATA_MODE=postgres`
- PostgreSQL-Anbindung ueber `DATABASE_DSN`
- hybrider Speicher: relationale Haupttabellen plus JSON-Ablage fuer kleine Konfigurationsdaten
- relationales SQL-Schema unter `database/init/001_relational_schema.sql`
- automatische Migrationen beim Backend-Start aus `backend/migrations/`
- Seed-Daten aus `backend/seed/mock_seed.json`

## Relationale Schema-Gruppierung

Das relationale PostgreSQL-Schema ist fachlich in mehrere Datenbank-Schemas
gegliedert, zum Beispiel:

- `kunden`
- `lieferanten`
- `waren`
- `verkauf`
- `einkauf`
- `buchhaltung`

Optional kann weiter ein In-Memory-Modus genutzt werden:

- `ERP_DATA_MODE=memory`
- Seed-Daten aus `backend/seed/preview_data.py`

## SQL- und JSON-Aufteilung

Wichtige Fach- und Prozessdaten werden im PostgreSQL-Modus schrittweise direkt in
relationalen Tabellen gespeichert. Dazu gehoeren aktuell insbesondere:

- `kunden`, `lieferanten`, `artikel`, `services`, `lager`
- `artikelStueckliste`
- `kategorien`
- `benutzer`, `rollen`, `rechte`, `rollenRechte`
- `kundenanfragen`, `angebote`, `angebotspositionen`
- `auftraege`, `auftragspositionen`
- `bestellungen`, `bestellpositionen`
- `rechnungen`
- `vertriebsdokumente`, `einkaufsdokumente`, `versandauftraege`
- `nachrichten`, `reklamationen`, `retouren`
- `zahlungen`, `mahnungen`, `belege`, `firmenkonto`

Kleinere, begrenzte Konfigurations- und Metadaten bleiben bewusst als JSON in
`app_records`, zum Beispiel:

- `feldMetadaten`
- `benutzerSpalten`
- `nummernkreise`
- `unternehmen`
- `fristenOptionen`
- `lehrkraftOptionen`

## Verfuegbare Endpunkte

- `GET /api/health`
- `GET /api/meta`
- `POST /api/reset`
- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/admin/backup`
- `POST /api/admin/restore`
- `GET /api/datenbanken/<table>`
- `GET /api/datenbanken/<table>/<id>`
- `POST /api/datenbanken/<table>`
- `PATCH /api/datenbanken/<table>/<id>`
- `DELETE /api/datenbanken/<table>/<id>`

## Beispiel-Logins aus den Seed-Daten

- `admin / admin`
- `lager / lager`
- `buchhaltung / buchhaltung`
- `marketing / marketing`
- `verkauf_azubi / verkauf`
- `verkauf_senior / verkauf`

## Synchronisation

- Mehrere Browser koennen gleichzeitig mit unterschiedlichen Benutzern angemeldet sein
- Im DB-Modus werden Aenderungen zentral in PostgreSQL gespeichert
- Das Frontend aktualisiert DB-Daten derzeit ueber erneutes Laden bzw. Polling von Tabellenansichten

## Backup und Wiederherstellung

Fuer Lehrkraft-/Admin-Faelle steht ein anwendungsseitiges JSON-Backup zur
Verfuegung. Dieses Backup enthaelt:

- relationale Haupttabellen
- kleinere JSON-Konfigurationstabellen

Die Oberflaeche dafuer liegt im Frontend im Bereich `Admin > Backup`.

## Seed-Daten neu erzeugen

Die Datei `backend/seed/mock_seed.json` wird aus den Frontend-Mockdaten erzeugt:

``` bash
node backend/scripts/generate_seed.mjs
```

## Naechste sinnvolle Schritte

1. Restliche Spezialfaelle ohne generischen CRUD-Pfad ebenfalls auf API/DB vereinheitlichen
2. Live-Synchronisation spaeter von Polling auf WebSocket oder Server-Sent Events erweitern
3. Persistente Benutzer- und Rollenpflege im Backend weiter ausbauen

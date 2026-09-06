# BTZ-Lingen-SchulungsERP

## Ueberblick

Dieses Repository ist ein Schulungs-ERP mit einer vereinfachten und klaren Laufzeitstruktur:

- `frontend/`: React, TypeScript, Vite
- `backend/`: Flask-API, Auth, Rechte, CRUD-Routen, Reset-Logik
- `database/`: PostgreSQL-Initialisierung und SQL-Skripte
- `backend/seed/`: zentrale Demo-, Seed- und Default-Daten
- `docs/`: fachliche Dokumentation und Projekthinweise

Es gibt nur noch einen technischen Betriebsweg:

- Backend auf Flask
- Persistenz in PostgreSQL mit relationalen Fachtabellen
- Seed-Daten aus `backend/seed/sources/json/`
- Reset ueber das Backend
- keine lokalen Mock- oder Memory-Modi mehr

## Projektstruktur

Wichtige Einstiegspunkte:

- `docker-compose.yml`: lokale Infrastruktur
- `backend/app.py`: Backend-Start
- `backend/app_factory.py`: App-Erzeugung, Blueprints, CORS, Store
- `backend/repositories/postgres_store.py`: relationale PostgreSQL-Persistenz mit kompatibler CRUD-API
- `backend/routes/`: API-Module
- `backend/seed/sources/json/`: zentrale, fachlich getrennte Demo- und Reset-Daten
- `backend/seed/optionenDefault.json`: Standardwerte fuer gezielte Resets
- `backend/seed/README.md`: Erklaerung der Seed- und Reset-Struktur
- `frontend/src/router/AppRouter.tsx`: Frontend-Routing
- `frontend/src/services/`: fachliche Frontend-Services
- `backend/seed/sources/json/`: fachlich gepflegte Seed-Quellen fuer Demo- und Reset-Daten

## Aktueller Aufraeumstand

Das Projekt wurde bereits auf eine klarere Grundlinie reduziert:

- nur noch PostgreSQL mit relationalen Fachtabellen als Persistenz
- kein Memory-Store, kein Frontend-Mocklaufzeitpfad, kein Preview-Backend-Modus
- Reset und Demo-Daten zentral ueber `backend/seed/`
- Frontend-Synchronisation nur noch ueber Backend-API, Cache und Server-Events

Die groessten verbleibenden Komplexitaetstreiber sind derzeit:

- sehr grosse Seiten wie `frontend/src/pages/verkauf/Angebote.tsx`
- grosse fachlich gemischte Seiten wie `frontend/src/pages/logistik/Artikel.tsx`
- lange Service-Dateien mit gemischter Verantwortung

Bereits begonnen wurde die Entlastung grosser Seiten durch ausgelagerte Helfermodule,
zum Beispiel mit `frontend/src/pages/verkauf/angeboteHelpers.ts`
und `frontend/src/pages/verkauf/MultiStatusFilter.tsx`.

Dabei gilt bewusst diese Regel:

- lieber wenige fachlich sinnvolle Sammeldateien als viele kleine Einzeldateien
- UI-Abschnitte bleiben nach Moeglichkeit in der Hauptseite
- ausgelagert werden vor allem wiederverwendbare Helfer, Berechnungen und Seed-Quellen

## Entwicklung

Empfohlener Ablauf:

1. PostgreSQL und Backend starten.
2. Frontend lokal mit Vite ausfuehren.

### Backend und Datenbank starten

```bash
docker compose up -d postgres backend pgadmin
```

Danach sind typischerweise erreichbar:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- pgAdmin: `http://localhost:5050`

### Frontend lokal starten

```bash
cd frontend
npm install
npm run dev
```

### Gesamten Stack in Docker starten

```bash
docker compose up -d
```

## Datenhaltung und Reset

Alle fachlichen Daten laufen ueber das Backend:

- CRUD-Endpunkte unter `/api/datenbanken/*`
- Login und Session im Backend
- Server-Events fuer Tabellen-Updates und Resets
- zentrale Seed-Daten in `backend/seed/sources/json/`, die beim Reset relational importiert werden

Resets funktionieren in zwei klaren Formen:

- globaler Reset: baut die relationalen Fachtabellen neu auf und laedt die Seed-Daten in PostgreSQL
- gezielte Options-Resets: laden Standardwerte aus `backend/seed/optionenDefault.json`

## Seed-Daten pflegen

Die gepflegten Quelldateien liegen zentral im Backend unter:

- `backend/seed/sources/json/stammdaten.json`
- `backend/seed/sources/json/einkaufLogistik.json`
- `backend/seed/sources/json/verkauf.json`
- `backend/seed/sources/json/verwaltung.json`
- `backend/seed/sources/json/fieldMetadata.json`

Diese Dateien werden direkt vom Backend fuer Initialbefuellung und Reset verwendet:

- `backend/seed/sources/json/`

Mehr Details zur Aufteilung stehen in:

- [backend/seed/README.md](backend/seed/README.md)

## Demo-Logins

Beispielkonten aus den Seed-Daten:

```text
admin / admin
lager / lager
buchhaltung / buchhaltung
marketing / marketing
verkauf_azubi / verkauf
verkauf_senior / verkauf
gf / gf
```

Weitere Logins stehen in [docs/Logins.md](docs/Logins.md).

## Validierung

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
python -m compileall backend
```

## Weitere sinnvolle Aufraeumschritte

Das Projekt ist schon deutlich klarer, aber diese Schritte wuerden es weiter vereinfachen:

1. Grosse Seiten wie `Angebote.tsx`, `Kundenanfragen.tsx` und aehnliche Dialog-Workflows in kleinere Teilkomponenten zerlegen.
2. Lange Service-Dateien fachlich trennen, zum Beispiel in Datenzugriff, Hydration, Berechnungen und UI-Helfer.
3. Fuer `backend/seed/sources/json/` die fachliche Aufteilung weiter schaerfen, zum Beispiel in noch klarere Buchhaltungs- und Prozessdateien.
4. Haeufig genutzte Typen aus Seiten und Services in gemeinsame Typdateien auslagern, damit weniger implizite `any`-Strukturen im Projekt bleiben.
5. Den `docs/`-Ordner in wenige klare Bereiche wie `architektur`, `prozesse` und `betrieb` aufteilen.
6. Fachlogik aus sehr langen React-Seiten in Hooks oder Hilfsmodule verlagern, damit Komponenten kuerzer und einfacher lesbar werden.
7. Reset-Defaults und Backend-Seed-Struktur langfristig aus einer einzigen Quelle ableiten, damit doppelte Pflege weiter sinkt.
8. Die JSON-Seedquellen bei weiterem Wachstum noch feiner nach Fachbereichen schneiden, damit Buchhaltung, Vertrieb und Einkauf separat wartbar bleiben.
9. Bei neuen Strukturverbesserungen bewusst keine Dateiflut erzeugen: erst pruefen, ob ein bestehendes Hilfsmodul erweitert werden kann.

## Dokumentation

- [docs/README.md](docs/README.md)
- [docs/DEMO.md](docs/DEMO.md)
- [docs/Logins.md](docs/Logins.md)
- [docs/Rechte.md](docs/Rechte.md)
- [docs/DB-Schema-Entwurf.md](docs/DB-Schema-Entwurf.md)

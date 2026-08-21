# AGENTS.md

## Projektüberblick

Dieses Repository ist ein Schulungs-ERP mit drei Kernbestandteilen:

- Frontend: React + TypeScript + Vite in [frontend/](frontend/)
- Backend: Flask-API in [backend/](backend/)
- Datenbank: PostgreSQL in [database/](database/) und Docker-Setup in [docker-compose.yml](docker-compose.yml)

Die Standardentwicklung läuft mit:

- Postgres und Backend in Docker
- Frontend lokal mit Vite
- API-Zugriff über `http://localhost:5000` und Frontend über `http://localhost:5173`

## Wichtige Dokumentation

- [README.md](README.md) – Startbefehle, Docker-Setup und Projektstruktur
- [docs/README.md](docs/README.md) – Uebersicht ueber die vorhandene Projektdokumentation
- [docs/DEMO.md](docs/DEMO.md) – Demo-Fluss und Testkonten
- [docs/DB-Schema-Entwurf.md](docs/DB-Schema-Entwurf.md) – Datenmodell und SQL-Ansatz

## Laufzeit- und Architektur-Prinzipien

- Das Flask-Backend erzeugt die App ueber [backend/app_factory.py](backend/app_factory.py) und liest Konfiguration aus [backend/config.py](backend/config.py).
- Es gibt nur noch einen Persistenzweg: PostgreSQL mit JSONB ueber [backend/repositories/postgres_store.py](backend/repositories/postgres_store.py).
- Das Frontend verwendet in [frontend/src/services/core/api.ts](frontend/src/services/core/api.ts) automatisch den Backend-Host auf Port 5000, sofern `VITE_API_URL` nicht gesetzt ist.
- Auth und Session-Handling laufen serverseitig im Backend; das Frontend prueft Berechtigungen ueber den Auth-Kontext.
- Die API folgt generischen CRUD-Pfaden unter `/api/datenbanken/<table>`; Spezialfaelle sollten nach dem bestehenden Muster in den Route-Blueprints ergaenzt werden.

## Typische Startbefehle

### Empfohlene lokale Entwicklung

```bash
docker compose up -d postgres backend pgadmin
cd frontend
npm install
npm run dev
```

### Vollständiger Docker-Stack

```bash
docker compose up -d
```

### Frontend-Build

```bash
cd frontend
npm run build
```

## Projektkonventionen

- Frontend-Code liegt in [frontend/src/](frontend/src/), nicht im Wurzelverzeichnis; Vite-Konfiguration ist in [frontend/vite.config.ts](frontend/vite.config.ts).
- Backend-Blueprints liegen unter [backend/routes/](backend/routes/); neue API-Module sollten dort eingefügt werden.
- Persistenzlogik gehört in [backend/repositories/](backend/repositories/), nicht in die Routen selbst.
- DB-Initialisierung und Schema-Änderungen stehen in [database/init/](database/init/) bzw. [backend/migrations/](backend/migrations/).
- Seed-, Demo- und Reset-Daten liegen zentral in [backend/seed/](backend/seed/); gepflegte Quellmodule dafuer liegen unter [frontend/src/services/seed/](frontend/src/services/seed/).

## Änderungen und Arbeitsweise

- Wenn ein Feature quer durch Frontend und Backend geht, prüfe zuerst die vorhandene Route- und Datenflussstruktur in [backend/routes/](backend/routes/) und [frontend/src/services/](frontend/src/services/).
- Behalte die bestehende CORS-, Session- und Datenprovider-Logik bei; Änderungen an API-Pfaden sollten mit der aktuellen Frontend-Abstraktion kompatibel bleiben.
- Bei Datenbankänderungen prüfe zusätzlich das SQL-Schema und die Seed-Daten; das System ist als Schulungsprojekt bewusst leicht nachvollziehbar, aber nicht als mikroservice-artige Architektur aufgeteilt.
- Vermeide unnötige Neu-Architektur; das Projekt bevorzugt klare, fokussierte Verbindungen zwischen React, Flask und PostgreSQL.

## Validierung

- Für Frontend-Änderungen ist der relevante Check in der Regel `cd frontend && npm run build`.
- Für Backend-Änderungen prüfe die Flask-Route- und Config-Struktur mit einem gezielten Start des Backends oder einem kurzen `python -m compileall backend`.
- Es gibt derzeit keine umfangreiche Test-Suite im Repository; validiere mit den kleinsten passenden, realen Checks.

## Wichtige Logins für Demo/Tests

- `admin / admin`
- `lager / lager`
- `buchhaltung / buchhaltung`
- `marketing / marketing`
- `verkauf_azubi / verkauf`
- `verkauf_senior / verkauf`

## Hinweise fuer AI-Coding-Agents

- Priorisiere Aenderungen, die die bestehende Architektur respektieren: React-Frontend, Flask-Backend, PostgreSQL-Store.
- Dokumentation und Design sind in diesem Repo wichtiger als neue Framework-Patterns; bleibe nah an den vorhandenen Mustern.
- Wenn du unsicher bist, lies zuerst [README.md](README.md), [docs/README.md](docs/README.md) und die betroffene Route/Service-Datei, bevor du neue Strukturen einfuehrst.

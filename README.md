# BTZ-Lingen-SchulungsERP

## Installation

Dieses Projekt bietet zwei sinnvolle Startvarianten:

- Empfohlene Entwicklungsumgebung: Backend und Datenbank in Docker, Frontend lokal mit Vite
- Vollstaendige Docker-Variante: Frontend, Backend und Datenbank komplett per Docker Compose

Die empfohlene Variante ist fuer die taegliche Entwicklung meist angenehmer, weil:

- Frontend-Hot-Reload lokal schneller ist
- Browser-Fehler und DevTools direkter sichtbar sind
- Backend und PostgreSQL trotzdem reproduzierbar in Containern laufen

## Projektstruktur

Die wichtigsten Ordner und Dateien:

- `frontend/`: React-, TypeScript- und Vite-Frontend
- `backend/`: Flask-Backend mit Auth, REST-Endpunkten und Datenzugriff
- `database/`: Initiale Datenbankskripte und Setup fuer PostgreSQL
- `docker/`: Docker-Hilfsdateien, zum Beispiel fuer pgAdmin
- `docs/`: Projektdokumentation, Demo-Ablauf und fachliche Hinweise
- `postman/` und `.postman/`: API-Requests und Umgebungen fuer Tests
- `docker-compose.yml`: Startet die komplette Entwicklungsumgebung
- `main.py`: Einstiegspunkt auf Projektebene
- `src/`: weitere Projektquellen ausserhalb des Vite-Frontends

## Voraussetzungen

Fuer die empfohlene Entwicklungsumgebung:

- Docker Desktop
- Node.js
- npm

Versionen pruefen:

```bash
docker --version
node -v
npm -v
```

## Empfohlene Entwicklungsumgebung

In diesem Modus laufen:

- `postgres`, `backend` und optional `pgadmin` in Docker
- `frontend` lokal auf deinem Rechner

### 1. Backend und Datenbank per Docker starten

Im Projektordner:

```bash
docker compose up -d postgres backend pgadmin
```

Danach sind die Dienste standardmaessig erreichbar unter:

- Frontend lokal spaeter unter `http://localhost:5173`
- Backend unter `http://localhost:5000`
- pgAdmin unter `http://localhost:5050`

### 2. Frontend lokal installieren

```bash
cd frontend
npm install
```

### 3. Frontend lokal starten

```bash
npm run dev
```

Die Anwendung ist danach unter `http://localhost:5173` erreichbar.

## Vollstaendige Docker-Variante

In diesem Modus laufen:

- `frontend`
- `backend`
- `postgres`
- `pgadmin`

alles zusammen per Docker Compose.

### Komplettstart

Im Projektordner:

```bash
docker compose up -d
```

Danach sind die Dienste standardmaessig erreichbar unter:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- pgAdmin: `http://localhost:5050`

Logs ansehen:

```bash
docker compose logs -f
```

Stoppen:

```bash
docker compose down
```

## Docker Watch

Fuer containerbasierte Entwicklung ist `docker compose watch` vorbereitet.

Start:

```bash
docker compose up -d
docker compose watch
```

Verhalten:

- `frontend/` wird in den Container synchronisiert
- `backend/` wird in den Container synchronisiert und bei Aenderungen neu gestartet
- Aenderungen an `package.json`, `package-lock.json`, `requirements.txt` oder `Dockerfile`s loesen einen Rebuild aus

Hinweis:

Fuer Frontend-Entwicklung ist die empfohlene Variante mit lokalem Vite-Server in der Regel trotzdem angenehmer als ein Frontend-Container.

## Backend und Datenbankmodus

Im Ordner `backend/` liegt das Flask-Backend fuer den Mehrbenutzerbetrieb.

- Standardmodus ist PostgreSQL ueber Docker Compose
- Login laeuft sitzungsbasiert ueber das Backend
- Tabellen werden im DB-Modus ueber REST-Endpunkte gelesen und geschrieben
- mehrere Browser koennen gleichzeitig mit unterschiedlichen Benutzern arbeiten

Weitere Details stehen in [backend/README_PREVIEW.md](backend/README_PREVIEW.md).

## Anmeldung

Im Mock-Modus und im DB-Modus werden dieselben Seed-Benutzer verwendet.

Beispiele:

```text
admin / admin
lager / lager
buchhaltung / buchhaltung
marketing / marketing
verkauf_azubi / verkauf
verkauf_senior / verkauf
```

Die Berechtigungen werden im Frontend weiterhin ueber den Auth-Kontext geprueft.

Eine gefuehrte Vorstellung mit Testkonten und Klickpfaden steht in [docs/DEMO.md](docs/DEMO.md).

## Produktion bauen

Frontend-Build erzeugen:

```bash
cd frontend
npm run build
```

Die fertigen Dateien liegen danach in `frontend/dist/`.

## Hinweise zum Datenmodus

- Standard ohne Umschalten: Backend- und PostgreSQL-Modus
- optionaler Mock-Modus im Browser:

```js
localStorage.setItem("data-provider", "mock-local-storage");
location.reload();
```

- im Datenbankmodus synchronisieren sich Aenderungen ueber das Backend zwischen Browsern
- ein Testdaten-Reset laedt im Datenbankmodus die Seed-Daten neu in PostgreSQL

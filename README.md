# Installation

## Voraussetzungen

-   Node.js installiert
-   npm installiert
-   PostgreSQL installiert (später benötigt)

Version prüfen:

``` bash
node -v
npm -v
```

------------------------------------------------------------------------

# Projekt starten

## Abhängigkeiten installieren

Zuerst ein Terminal im Projektordner öffnen
``` bash
cd frontend/
```
Im Terminal sollte jetzt etwa folgendes stehen:

``` cmd
C:\...\BTZ-SchulungsERP\frontend>
```

Im Projektordner:

``` bash
npm install
```

## Entwicklungsserver starten

``` bash
npm run dev
```

Die Anwendung ist danach erreichbar unter:

    http://localhost:5173

Eine geführte Vorstellung mit Testkonten und Klickpfaden steht in [docs/DEMO.md](docs/DEMO.md).

------------------------------------------------------------------------

# Backend und Datenbankmodus

Im Ordner `backend/` liegt jetzt das Flask-Backend fuer den Mehrbenutzerbetrieb.

- Standardmodus ist PostgreSQL ueber Docker Compose
- Login laeuft sitzungsbasiert ueber das Backend
- Tabellen werden im DB-Modus ueber REST-Endpunkte gelesen und geschrieben
- Mehrere Browser koennen gleichzeitig mit unterschiedlichen Benutzern arbeiten

Details stehen in:

    backend/README_PREVIEW.md

------------------------------------------------------------------------

# Anmeldung

Im Mock-Modus und im DB-Modus werden dieselben Seed-Benutzer verwendet.

Beispiele:

    admin / admin
    lager / lager
    buchhaltung / buchhaltung
    marketing / marketing
    verkauf_azubi / verkauf
    verkauf_senior / verkauf

Die Berechtigungen werden im Frontend weiter ueber den AuthContext geprueft.

------------------------------------------------------------------------

# Berechtigungen

Berechtigungen werden über den PermissionService definiert.

Beispiel:

``` js
{
    code:"kunde.lesen",
    text:"Kunden lesen"
}
```

Prüfung:

``` js
hasPermission("kunde.lesen")
```

------------------------------------------------------------------------

# Neue Seite hinzufügen

## 1. Seite erstellen

Beispiel:

    src/pages/NeueSeite.jsx

## 2. Route hinzufügen

In:

    AppRouter.jsx

Beispiel:

``` jsx
<Route
    path="neue-seite"
    element={<NeueSeite/>}
/>
```

## 3. Menü erweitern

In der Sidebar:

``` js
{
    title:"Neue Seite",
    path:"/neue-seite",
    permission:"seite.lesen"
}
```

------------------------------------------------------------------------

# Tabellen verwenden

Beispiel:

``` jsx
<DataTable
    title="Kunden"
    columns={columns}
    data={kunden}
/>
```

Unterstützt:

-   Suche
-   Sortierung
-   Pagination
-   Spaltenauswahl
-   Berechtigungen
-   Detailansicht
-   Zeilenaktionen

------------------------------------------------------------------------

# Formulare

Verfügbare Felder:

-   TextField
-   Checkbox
-   Label

Beispiel:

``` jsx
<TextField
    value={name}
    onChange={setName}
/>
```

------------------------------------------------------------------------

# Produktion bauen

Build erstellen:

``` bash
npm run build
```

Die fertigen Dateien befinden sich danach in:

    dist/

------------------------------------------------------------------------

# Hinweise zum Datenmodus

- Standard ohne Umschalten: Backend- und PostgreSQL-Modus
- Optionaler Mock-Modus im Browser:

``` js
localStorage.setItem("data-provider", "mock-local-storage");
location.reload();
```

- Im Datenbankmodus synchronisieren sich Aenderungen ueber das Backend zwischen Browsern
- Ein Testdaten-Reset laedt im Datenbankmodus die Seed-Daten neu in PostgreSQL

------------------------------------------------------------------------

# Docker Watch

Fuer die lokale Entwicklung ist `docker compose watch` eingerichtet, damit du Container nicht staendig manuell neu starten musst.

Start:

``` bash
docker compose up -d
docker compose watch
```

Verhalten:

- `frontend/` wird in den Container synchronisiert, Vite aktualisiert die Seite automatisch.
- `backend/` wird in den Container synchronisiert und der Backend-Container bei Aenderungen automatisch neu gestartet.
- Aenderungen an `backend/requirements.txt`, `frontend/package.json`, `frontend/package-lock.json` oder den jeweiligen `Dockerfile`s loesen einen Rebuild aus.

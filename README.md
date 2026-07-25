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

# Projektstruktur

    src
    │
    ├── components
    │   ├── DataTable.jsx
    │   ├── Dialog.jsx
    │   ├── PermissionButton.jsx
    │   └── form
    │       ├── TextField.jsx
    │       ├── Checkbox.jsx
    │       └── Label.jsx
    │
    ├── pages
    │   ├── Kunden.jsx
    │   ├── Artikel.jsx
    │   ├── Lager.jsx
    │   └── Rollen.jsx
    │
    ├── services
    │   ├── authService.jsx
    │   ├── permissionService.jsx
    │   └── roleService.jsx
    │
    ├── auth
    │   └── AuthContext.jsx
    │
    └── router
        └── AppRouter.jsx

------------------------------------------------------------------------

# Anmeldung

Aktuell werden Benutzer lokal verwaltet.

Beispiel:

    Benutzer:
    admin

    Passwort:
    admin

Die Rechte werden über den AuthContext geprüft.

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

# Spätere Erweiterungen

Geplant:

-   PostgreSQL Datenbank
-   Benutzerverwaltung
-   Rollenverwaltung
-   Feld-Metadaten
-   Benutzerdefinierte Tabellenansichten
-   Automatische Detailansichten
-   Verknüpfungen zwischen Datensätzen

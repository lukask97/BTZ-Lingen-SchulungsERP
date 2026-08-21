# Logins

Zentrale Uebersicht der aktuell im Projekt hinterlegten Demo- und Container-Zugangsdaten.

## ERP-Frontend

URL: `http://localhost:5173`

| Benutzer | Passwort | Rolle / Hinweis |
| --- | --- | --- |
| `admin` | `admin` | Vollzugriff / Demo aller Bereiche |
| `lager` | `lager` | Lager, Artikel, Wareneingang |
| `buchhaltung` | `buchhaltung` | Buchhaltung, Verkauf, Service |
| `marketing` | `marketing` | Marketing |
| `einkauf` | `einkauf` | Einkauf |
| `verkauf` | `verkauf` | Verkauf |
| `personalwesen` | `personalwesen` | Personalwesen |
| `verkauf_azubi` | `verkauf` | Verkauf Azubi |
| `verkauf_senior` | `verkauf` | Verkauf Senior |
| `gf` | `gf` | Geschaeftsfuehrung / Vollzugriff |

Hinweis:
Die Benutzer stammen aus den zentralen Seed-Daten in PostgreSQL. Nach einem Reset wird wieder genau dieser Stand hergestellt.

## pgAdmin

URL: `http://localhost:5050`

| Feld | Wert |
| --- | --- |
| E-Mail | `admin@test.de` |
| Passwort | `admin` |

## PostgreSQL

Host: `localhost`  
Port: `5432`

| Feld | Wert |
| --- | --- |
| Datenbank | `erp` |
| Benutzer | `erp` |
| Passwort | `geheim` |

## Backend

URL: `http://localhost:5000`

| Feld | Wert |
| --- | --- |
| Datenmodus | `postgres` |
| DSN | `dbname=erp user=erp password=geheim host=postgres port=5432` |

## Sicherheit

Alle oben genannten Daten wirken wie Demo- oder Entwicklungszugaenge. Vor einem echten Produktivbetrieb sollten diese Werte mindestens ersetzt werden durch:

- eigene Passwoerter
- Umgebungsvariablen statt Klartext im Repository
- getrennte Konten fuer Admin, App und Datenbank
- einen geheimen `SECRET_KEY`

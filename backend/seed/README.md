# Seed-Daten im Backend

Dieser Ordner ist die zentrale Backend-Ablage fuer Demo-, Reset- und Default-Daten.

## Dateien

- `mock_seed.json`
  komplette Demo-Datenbasis fuer Initialbefuellung und Gesamt-Reset
- `optionenDefault.json`
  gezielte Default-Werte fuer Optionen, Nummernkreise und Unternehmensdaten
- `__init__.py`
  markiert den Ordner als Python-Paket

## Herkunft der Daten

Die gepflegten Quellmodule fuer die meisten Seed-Daten liegen unter:

- `frontend/src/services/seed/data/`
- `frontend/src/services/seed/fieldMetadata.ts`

Das Skript

- `backend/scripts/generate_seed.mjs`

liest diese Quellmodule ein und schreibt daraus:

- `backend/seed/mock_seed.json`

## Ziel dieser Struktur

- eine einzige zentrale Reset-Datei fuer die Demo
- eine getrennte Default-Datei fuer gezielte Admin-Resets
- kein Memory-Modus und keine separate Preview-Datenhaltung mehr

## Sinnvolle weitere Vereinfachung

Langfristig waere es noch uebersichtlicher, wenn auch die Seed-Quellen nicht mehr im Frontend,
sondern in einem gemeinsamen neutralen Ordner liegen wuerden, zum Beispiel `shared/seed/`
oder direkt unter `backend/seed/sources/`.

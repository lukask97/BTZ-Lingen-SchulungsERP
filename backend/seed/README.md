# Seed-Daten im Backend

Dieser Ordner ist die zentrale Backend-Ablage fuer Demo-, Reset- und Default-Daten.

## Dateien

- `optionenDefault.json`
  gezielte Default-Werte fuer Optionen, Nummernkreise und Unternehmensdaten
- `__init__.py`
  markiert den Ordner als Python-Paket
- `sources/json/`
  fachlich getrennte Seed-Dateien fuer Initialbefuellung und Reset

## Herkunft der Daten

Die gepflegten Seed-Quellen liegen unter:

- `backend/seed/sources/json/`

Das Backend liest die JSON-Dateien in `backend/seed/sources/json/` direkt ein.

## Ziel dieser Struktur

- fachlich getrennte Reset-Dateien fuer die Demo
- eine getrennte Default-Datei fuer gezielte Admin-Resets
- kein Memory-Modus und keine separate Preview-Datenhaltung mehr

## Struktur

Die Seed-Quellen liegen bewusst im Backend-Bereich, damit fachliche Demo- und Reset-Daten
zentral gepflegt werden und nicht in Frontend-Services verteilt sind.

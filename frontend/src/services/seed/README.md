# Seed-Synchronisation

## Dateien

- `dataSync.ts`
  Frontend-Synchronisation fuer Backend-Reset und Server-Events

## Ablauf

1. Die fachlichen Seed-Quellen werden unter `backend/seed/sources/` gepflegt.
2. Das Backend liest diese JSON-Dateien direkt fuer Initialbefuellung und Reset.

## Hinweis

Wenn neue Tabellen zentral seedbar sein sollen, muessen sie an zwei Stellen auftauchen:

1. als JSON-Eintrag in einer der Dateien unter `backend/seed/sources/json/`
2. nach Bedarf in der fachlich passenden Quelldatei innerhalb dieses Ordners

# Seed-Quellen

Dieser Ordner enthaelt keine Laufzeit-Mocklogik mehr.

Er dient als Quelle fuer Demo- und Seed-Daten, aus denen die zentrale Backend-Datei
`backend/seed/mock_seed.json` erzeugt wird.

## Dateien

- `data/stammdaten.ts`
  Grunddaten wie Kunden, Artikel, Services, Benutzer, Rollen, Rechte und Nummernkreise
- `data/einkaufLogistik.ts`
  Einkauf, Lager, Lieferanten, Bestellungen und verwandte Daten
- `data/verkauf.ts`
  Kundenanfragen, Angebote, Auftraege, Nachrichten und Vertriebsdokumente
- `data/verwaltung.ts`
  Verwaltungsnahe Demo-Daten
- `fieldMetadata.ts`
  Feld-Metadaten und benutzerbezogene Spaltenkonfigurationen
- `dataSync.ts`
  Frontend-Synchronisation fuer Backend-Reset und Server-Events

## Ablauf

1. Die Seed-Quellen werden in diesem Ordner gepflegt.
2. `backend/scripts/generate_seed.mjs` liest diese Dateien ein.
3. Die Ausgabe wird nach `backend/seed/mock_seed.json` geschrieben.
4. Das Backend nutzt diese Datei fuer Initialbefuellung und Reset.

## Hinweis

Wenn neue Tabellen zentral seedbar sein sollen, muessen sie an zwei Stellen auftauchen:

1. als Export in einer der `data/*.ts`-Dateien
2. in der Exportliste von `backend/scripts/generate_seed.mjs`

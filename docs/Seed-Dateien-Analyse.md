# Seed-Dateien-Analyse

Stand: 24. August 2026

## Kurzfazit

Die Seed-Dateien sind aktuell technisch konsistent und koennen erfolgreich fuer einen Reset geladen werden.
Die Prozessreife ist bewusst gemischt:

- `stammdaten.json` ist als stabiles Basismodul angelegt.
- `einkaufLogistik.json` bildet eher fruehe bis mittlere Einkaufsprozesse ab.
- `verkauf.json` reicht von Angebotsphase bis zu gemahnten bzw. buchhalterisch relevanten Ausgangsrechnungen.
- `verwaltung.json` enthaelt spaete Buchhaltungsfaelle wie unbearbeitete Zahlungseingaenge, Mahngebuehren-Folge und Ueberzahlung.
- `fieldMetadata.json` ist technisches Begleitmaterial fuer die UI.

## Durchgefuehrte Pruefungen

Die Seed-Pruefung kann wiederholt werden mit:

```bash
python backend/scripts/seed_audit.py
```

Geprueft werden aktuell:

- referenzielle Integritaet zwischen den Seed-Tabellen
- doppelte IDs
- offensichtliche Lebenszyklusfehler zwischen Angebot, Auftrag, Rechnung und Zahlung
- grobe Prozessreife pro Seed-Datei

## Ergebnis der aktuellen Analyse

- Referenzfehler: keine
- ID-/Duplikatfehler: keine
- Lebenszyklus-/Prozessfehler: keine

## Fachliche Einordnung je Datei

### `stammdaten.json`

- Rolle: stabile Basis fuer Partner, Artikel, Rechte und Nummernkreise
- Reifegrad: hoch
- Bemerkung: dient mehreren Bereichen gleichzeitig und sollte moeglichst ruhig bleiben

### `einkaufLogistik.json`

- Rolle: fruehe bis mittlere Einkaufs- und Lagerphase
- Enthalten: Lieferanten, Staffelpreise, Bestellungen, Bestellpositionen, Lager, Kategorien
- Reifegrad: uneinheitlich, aber bewusst frueher als die Debitorenfaelle
- Wichtiger Hinweis: Der Kreditorenprozess ist noch schmaler modelliert als der Debitorenprozess

### `verkauf.json`

- Rolle: groesstes Prozessmodul
- Enthalten: Anfrage, Angebot, Auftrag, Rechnung, Zahlung, Mahnung, Versand, Vertriebspapiere
- Reifegrad: gemischt bis spaet
- Besonderheit: Die Datei enthaelt sowohl fruehe Vertriebsfaelle als auch spaete Buchhaltungsfaelle

### `verwaltung.json`

- Rolle: Verwaltung und Nebenbuchsicht
- Enthalten: `firmenkonto`, `lehrkraftOptionen`, `fristenOptionen`, `unternehmen`
- Reifegrad: spaete Buchhaltungsphase
- Besonderheit: Die unbearbeiteten Zahlungseingaenge fuer die Ausgangsrechnungen liegen fachlich hier

### `fieldMetadata.json`

- Rolle: UI-Metadaten
- Reifegrad: technisch
- Besonderheit: nicht fachprozessgetrieben, aber fuer Admin- und Tabellenansichten wichtig

## Aktuell bewusst unterschiedliche Prozessstaende

Nicht alle Seed-Dateien sollen denselben Stand haben. Das ist fachlich sinnvoll, wenn es bewusst bleibt.

### Fruehe Faelle

- Angebotsentwuerfe
- wartende Kundenantworten
- offene Auftraege ohne spaete Folgeobjekte
- Bestellungen im Einkaufsprozess

### Mittlere Faelle

- angenommene Angebote
- abgerechnete Auftraege
- offene Rechnungen
- versendete Dokumente

### Spaete Faelle

- ausgefuehrte Zahlungen
- gemahnte Debitorenrechnungen
- unbearbeitete Zahlungseingaenge im Verkaufskonto
- Teilzahlungs-, Skonto- und Ueberzahlungsfaelle

## Wichtigste bereits behobene Seed-Probleme

- Seed-Laden direkt aus `backend/seed/sources/json/` statt aus einer Sammeldatei
- fehlende Auftraege fuer `RG-2026-005`, `RG-2026-008` und `RG-2026-009` ergaenzt
- Reset-Fehler durch fehlende IDs in `feldMetadaten` im Backend-Loader abgefangen
- veraltete Tabelle `users` aus den Seed-Quellen entfernt
- spaete Debitorenfaelle von unpassenden Angebots-/Anfragebeziehungen entkoppelt

## Offene fachliche Spannungen

- Debitoren und Kreditoren teilen sich `rechnungen` und `zahlungen`; das verlangt in Services und UI sehr saubere Richtungslogik.
- Der Einkaufsbereich endet modellseitig frueher als der Debitorenbereich und wirkt deshalb weniger komplett.
- `firmenkonto` bildet Bankbewegungen didaktisch gut ab, ist aber kein vollwertiges Hauptbuchschema.
- Einige spaete Buchhaltungsfaelle sind absichtlich isolierte Lehrbeispiele und nicht vollstaendig aus fruehen Angebotsdaten hergeleitet.

## Empfohlene naechste Verbesserungen

- Eigene Prozessobjekte fuer Wareneingang und Lieferung pruefen
- Debitoren- und Kreditorenzahlungen fachlich staerker trennen oder mit einem klareren Richtungsfeld absichern
- Buchhaltungsfaelle optional in eine eigene Seed-Datei wie `buchhaltung.json` auslagern
- Die spaeten Lehrfaelle mit einem expliziten Kennzeichen als "isolierter Buchhaltungsfall" markieren

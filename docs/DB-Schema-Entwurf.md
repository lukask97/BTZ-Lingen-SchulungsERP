# DB-Schema-Entwurf

## Zielbild

Das Projekt nutzt kein starres SQL-Fachschema pro Modul, sondern eine generische JSONB-Ablage in `app_records`.
Das fachliche Schema ergibt sich deshalb aus den Seed-Tabellen und ihren Beziehungen.

## Technische Persistenz

- Physische Tabelle: `app_records`
- Schluessel: `table_name` + `entity_id`
- Nutzdaten: `data` als JSONB
- Sortierung: `sort_id`

## Fachliche Kernbereiche

### Stammdaten

- `kunden`
- `lieferanten`
- `artikel`
- `services`
- `kategorien`
- `lager`
- `unternehmen`

### Benutzer und Rechte

- `benutzer`
- `rollen`
- `rechte`
- `rollenRechte`
- `nummernkreise`
- `feldMetadaten`
- `benutzerSpalten`

### Verkauf

- `kundenanfragen`
- `angebote`
- `angebotspositionen`
- `auftraege`
- `auftragspositionen`
- `vertriebsdokumente`
- `versandauftraege`
- `rechnungen` fuer Ausgangsrechnungen
- `zahlungen` fuer Debitorenzahlungen
- `mahnungen`
- `belege`

### Einkauf

- `bestellungen`
- `bestellpositionen`
- `lieferantenArtikelStaffeln`
- `einkaufsdokumente`
- `rechnungen` fuer Eingangsrechnungen
- `zahlungen` fuer Kreditorenzahlungen

### Personal, Verwaltung und Begleitprozesse

- `mitarbeiter`
- `arbeitszeiten`
- `urlaubsantraege`
- `krankmeldungen`
- `schulungen`
- `personalakten`
- `bewerber`
- `freigaben`
- `berichte`
- `marketingaktionen`
- `reklamationen`
- `retouren`
- `abteilungen`
- `lehrkraftOptionen`
- `fristenOptionen`
- `firmenkonto`

## Wichtige Beziehungen

- `angebote.kundeId -> kunden.id`
- `angebotspositionen.angebotId -> angebote.id`
- `auftraege.kundeId -> kunden.id`
- `auftraege.angebotId -> angebote.id` optional
- `auftragspositionen.auftragId -> auftraege.id`
- `bestellungen.lieferantId -> lieferanten.id`
- `bestellpositionen.bestellungId -> bestellungen.id`
- `rechnungen.auftragId -> auftraege.id` fuer Ausgangsrechnungen
- `rechnungen.bestellungId -> bestellungen.id` fuer Eingangsrechnungen
- `zahlungen.rechnungId -> rechnungen.id`
- `mahnungen.rechnungId -> rechnungen.id`
- `belege.rechnungId -> rechnungen.id`
- `firmenkonto.zahlungId -> zahlungen.id` optional
- `firmenkonto.rechnungId -> rechnungen.id` optional

## Wichtige Modellregeln

- Die Tabelle `rechnungen` ist absichtlich gemischt und enthaelt Debitoren- und Kreditorenrechnungen.
- Die Tabelle `zahlungen` ist ebenfalls gemischt; die Richtung wird ueber `zahlungsart` bestimmt.
- Die offene-Posten-Logik entsteht nicht aus einer eigenen Tabelle, sondern aus `rechnungen`, `zahlungen`, `mahnungen` und `firmenkonto`.
- Nicht jede Seed-Datei bildet denselben fachlichen Reifegrad ab.
  `einkaufLogistik.json` liegt eher im Bestellprozess, waehrend `verkauf.json` und `verwaltung.json`
  bereits spaete Debitorenfaelle wie Mahnung, Teilzahlung und Ueberzahlung abbilden.

## Aktuelle Schema-Spannungen

- Debitoren- und Kreditorenlogik teilen sich `rechnungen` und `zahlungen`; das ist didaktisch praktikabel, aber fachlich nur mit klaren Richtungsfeldern stabil.
- Wareneingang, Auftragsbestaetigung und Lieferung sind aktuell eher dokumenten- oder statusnah modelliert, nicht als eigene starke Prozessobjekte.
- `firmenkonto` fungiert als Bank-/Nebenbuchsicht, ist aber noch kein vollstaendiges Buchungsjournal.

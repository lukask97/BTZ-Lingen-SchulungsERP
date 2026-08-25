# Auftragsmodell und Buchhaltungsprozess

Dieses Dokument beschreibt den aktuellen fachlichen Zielzustand fuer den Vertriebs- und Buchhaltungsprozess im Schulungs-ERP.

Im Unterschied zu einem frueheren Mockup gibt es inzwischen eigenstaendige Datensaetze fuer:

- `auftraege`
- `rechnungen`
- `zahlungen`
- `mahnungen`
- `belege`

Der didaktische Kern bleibt bewusst einfach, aber der Prozess ist jetzt als nachvollziehbare Kette aufgebaut.

---

## 1. Zielbild

Der Debitorenprozess folgt diesem Ablauf:

1. `kundenanfragen`
2. `angebote`
3. `auftraege`
4. Auftragsbestaetigung / Versand
5. `rechnungen` als Ausgangsrechnungen
6. offener Posten
7. `zahlungen`
8. `mahnungen`
9. vereinfachtes `Inkasso`

Der Kreditorenprozess folgt diesem Ablauf:

1. `bestellungen`
2. Wareneingang
3. `rechnungen` als Eingangsrechnungen
4. offener Kreditorenposten
5. `zahlungen`
6. Ausgleich

---

## 2. Wichtige Tabellen

### `auftraege`

- bildet den Kundenauftrag
- enthaelt Kundenbezug, Positionen, Betrag und Faelligkeit
- wird nach Rechnungsanlage fachlich als `abgerechnet` gefuehrt
- wird nach Zahlung fachlich als `bezahlt` gefuehrt

### `bestellungen`

- bildet die Lieferantenbestellung
- enthaelt Lieferantenbezug, Positionen und Prozessstatus
- kann nach Wareneingang in eine Eingangsrechnung uebergehen

### `rechnungen`

Wichtige Felder:

- `rechnungstyp`
- `auftragId` oder `bestellungId`
- `kundeId` oder `lieferantId`
- `datum`
- `faelligAm`
- `betrag`
- `status`
- `mahnstufe`
- `inkassoStatus`
- `inkassoAm`
- `inkassoGrund`

Rechnungen sind die fachliche Hauptquelle fuer offene Posten.

### `zahlungen`

- speichert Zahlungsplaene, Bankbewegungen und Ausfuehrungen
- kann einer Rechnung oder Bestellung zugeordnet sein
- gleicht offene Posten aus

### `mahnungen`

- speichert die Eskalation einer offenen Ausgangsrechnung
- arbeitet in der vereinfachten Reihenfolge:
  - `Zahlungserinnerung`
  - `1. Mahnung`
  - `2. Mahnung`
  - `Inkasso`

### `belege`

- dient als vereinfachtes Archiv fuer Rechnungs-, Mahn- und Zahlungsbezug

---

## 3. Statuslogik

### Rechnungslebenszyklus

Eine Rechnung wird in der Anwendung als einer dieser fachlichen Zustaende gelesen:

- `erstellt`
- `offen`
- `faellig`
- `ueberfaellig`
- `gemahnt`
- `inkasso`
- `bezahlt`
- `storniert`

Die Anzeige wird aus Rechnungsdaten, Zahlungen und Mahnungen gemeinsam abgeleitet.

### Mahnlogik

Die Fristen werden ueber die Verwaltungsoptionen gesteuert:

- Zahlungserinnerung
- 1. Mahnung
- 2. Mahnung
- Inkasso

Regeln:

- bezahlte oder stornierte Rechnungen werden nicht gemahnt
- die naechste Mahnstufe muss fachlich zur Frist passen
- eine zweite Mahnung ist erst nach einer ersten Mahnung zulaessig
- Inkasso ist nur als letzte didaktische Eskalationsstufe zulaessig

### Inkasso

Inkasso ist im Projekt bewusst vereinfacht.

Es bedeutet nicht einen vollstaendigen juristischen Prozess, sondern:

- Forderung wurde intern nicht mehr selbst weitergefuehrt
- Fall wurde als letzte Eskalationsstufe markiert
- Uebergabegrund und Datum bleiben sichtbar

---

## 4. Ableitungen und Beziehungen

- `rechnungen.auftragId -> auftraege.id`
- `rechnungen.bestellungId -> bestellungen.id`
- `zahlungen.rechnungId -> rechnungen.id`
- `mahnungen.rechnungId -> rechnungen.id`

Wichtige fachliche Regeln:

- Ausgangsrechnungen werden aus Auftraegen erzeugt
- Eingangsrechnungen werden aus Bestellungen erzeugt
- Zahlungen setzen Rechnungen nicht blind pauschal auf bezahlt, sondern gleichen den Vorgang fachlich aus
- Mahnungen und Inkasso bauen auf offenen Debitorenrechnungen auf

---

## 5. Didaktischer Fokus

Das System soll Schuelerinnen und Schuelern folgende Grundlagen verdeutlichen:

- Unterschied zwischen Debitoren und Kreditoren
- Bedeutung eines offenen Postens
- Zusammenhang von Auftrag, Rechnung und Zahlung
- Eskalation von faelligen Forderungen ueber Mahnstufen bis Inkasso
- Rolle von Belegen, Fristen und sauberem Zahlungsabgleich

Bewusst nicht im Mittelpunkt:

- Teilzahlungen
- Sammelzahlungen
- steuerliche Spezialfaelle
- vollstaendige juristische Inkassologik

---

## 6. Empfehlung fuer die Weiterentwicklung

Bei neuen Funktionen in Verkauf und Buchhaltung sollte dieses Modell die Grundlage bleiben:

1. Beleg oder Vorgang anlegen
2. offenen Posten sichtbar machen
3. naechsten fachlichen Schritt anzeigen
4. Zahlung oder Eskalation dokumentieren
5. Vorgang sauber abschliessen

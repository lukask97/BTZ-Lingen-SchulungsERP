# Auftragsmodell fuer den Verkaufsprozess

Dieses Dokument beschreibt das vereinfachte Datenmodell, das im aktuellen Mockup verwendet wird.
Der Verkaufsprozess wird im Mockup bewusst ueber wenige Tabellen und ueber den `status` des Auftrags gesteuert.

Wichtig: Im aktuellen Stand gibt es keine eigenstaendige Kern-Tabelle fuer `lieferscheine` oder `rechnungen`.
Lieferung und Rechnungsstellung werden aus dem Auftragsstatus abgeleitet.

---

## 1. Grundidee des vereinfachten Modells

Der gesamte Vertriebsprozess laeuft im Mockup ueber:

- `kundenanfragen`
- `angebote`
- `auftraege`
- `auftragspositionen` fachlich im Datensatz enthalten
- `zahlungen`
- `mahnungen`
- `belege`

Das bedeutet:

- Eine Kundenanfrage kann beantwortet werden, ohne sofort geloescht oder nur als gelesen markiert zu werden
- Eine Kundenanfrage kann direkt in ein Angebot oder direkt in einen Auftrag ueberfuehrt werden
- Ein Angebot ist ein eigener Datensatz in `angebote`
- Nach Annahme entsteht ein Datensatz in `auftraege`
- Die weitere Bearbeitung wird ueber `auftraege.status` gesteuert
- Ein Lieferschein ist im Mockup kein eigener Hauptdatensatz
- Eine Rechnung ist im Mockup keine eigene gespeicherte Ursprungstabelle mehr
- Die Rechnungsansicht wird aus abrechnungsrelevanten Auftraegen abgeleitet

---

## 2. Statuslogik des Auftrags

Der `status` in `auftraege` ist die zentrale Steuerung des Prozesses.

Empfohlene einfache Statuswerte:

| Status | Bedeutung |
|---|---|
| `angebot` | Vorgang liegt noch als Angebot vor |
| `offen` | Auftrag wurde angelegt, aber noch nicht weiterbearbeitet |
| `in Bearbeitung` | Auftrag wird vorbereitet oder intern bearbeitet |
| `geliefert` | Auftrag gilt logistisch als ausgeliefert |
| `abgerechnet` | Auftrag gilt als fakturiert |
| `bezahlt` | Zahlung ist eingegangen |
| `archiviert` | Vorgang ist abgeschlossen und nur noch zur Einsicht da |

Im aktuellen Mockup werden vor allem diese Zustande genutzt:

- `offen`
- `abgerechnet`
- `bezahlt`

---

## 3. Vereinfachter Ablauf

### 0. Kundenanfrage

- Datensatz in `kundenanfragen`
- Das Anliegen bleibt im Mockup sichtbar
- Eine Antwort kann direkt erfasst werden
- Status wechselt zum Beispiel von `offen` auf `beantwortet`

### 1. Angebot

- Kann aus einer Kundenanfrage entstehen
- Datensatz in `angebote`
- Positionen liegen direkt im Datensatz als Array
- Das urspruengliche Anliegen der Anfrage bleibt ueber `anfrageId` sichtbar
- Noch kein Lagerabgang

### 2. Auftrag

- Datensatz in `auftraege`
- Bezug auf `angebotId` moeglich
- Kann auch direkt aus einer Kundenanfrage entstehen, ohne vorheriges Angebot
- Positionen liegen direkt im Auftrag
- Das urspruengliche Anliegen der Anfrage bleibt ueber `anfrageId` sichtbar

### 3. Lieferung

- Keine eigene Kerntabelle noetig
- Im Mockup reicht der Auftragsstatus, um den logistischen Fortschritt zu zeigen
- Optional koennen Vertriebsdokumente weiterhin Unterrichtsdokumente enthalten, sie sind aber nicht die fachliche Hauptquelle

### 4. Rechnung

- Keine eigene Ursprungstabelle als Kern des Modells
- Eine Rechnungsnummer wird aus der Auftragsnummer abgeleitet
- Beispiel: `VK-2026-1201` wird zu `RE-2026-1201`
- Die Seite Rechnungen zeigt damit nur eine Sicht auf geeignete Auftraege

### 5. Zahlung

- Zahlung wird in `zahlungen` gespeichert
- Bezug erfolgt ueber `auftragId`, `auftragNr` und die abgeleitete `rechnungsnr`
- Nach Zahlung wird der Auftrag auf `bezahlt` gesetzt

### 6. Archivierung

- Nach Abschluss kann der Auftrag den Status `archiviert` erhalten

---

## 4. Relevante Tabellen im Mockup

### `kundenanfragen`

Wichtige Felder:

- `id`
- `typ`
- `kundeId`
- `kanal`
- `status`
- `datum`
- `anliegen`
- `antwort`
- `beantwortetAm`
- `angebotId`
- `auftragId`

### `angebote`

Wichtige Felder:

- `id`
- `angebotsNr`
- `anfrageId`
- `kundeId`
- `datum`
- `gueltigBis`
- `status`
- `gesamtbetrag`
- `positionen`

### `auftraege`

Wichtige Felder:

- `id`
- `auftragNr`
- `kundeId`
- `anfrageId`
- `angebotId`
- `datum`
- `status`
- `faelligAm`
- `gesamtbetrag`
- `positionen`

`auftraege` ist die wichtigste Tabelle des Verkaufsprozesses.
Aus ihr werden im Mockup Lieferstatus, Rechnungsstatus und Zahlungsbezug abgeleitet.

### `zahlungen`

Wichtige Felder:

- `id`
- `auftragId`
- `auftragNr`
- `rechnungsnr`
- `zahlungsart`
- `kunde`
- `datum`
- `betrag`
- `methode`

### `mahnungen`

Wichtige Felder:

- `id`
- `auftragId`
- `auftragNr`
- `rechnungsnr`
- `kunde`
- `datum`
- `status`
- `stufe`

### `belege`

Wichtige Felder:

- `id`
- `typ`
- `bezugTyp`
- `bezug`
- `datum`
- `status`
- `beschreibung`

Im Mockup zeigt `bezug` meist auf die abgeleitete Rechnungsnummer.

---

## 5. Beziehungen im vereinfachten Modell

Die wichtigsten Beziehungen sind:

- `kundenanfragen.kundeId -> kunden.id`
- `angebote.anfrageId -> kundenanfragen.id`
- `angebote.kundeId -> kunden.id`
- `auftraege.anfrageId -> kundenanfragen.id`
- `auftraege.kundeId -> kunden.id`
- `auftraege.angebotId -> angebote.id`
- `zahlungen.auftragId -> auftraege.id`
- `mahnungen.auftragId -> auftraege.id`

Zusatzlich wird im Mockup ueber fachliche Nummern gearbeitet:

- `auftraege.auftragNr`
- daraus abgeleitet `rechnungsnr`

---

## 6. Ableitungsregeln im Mockup

### Rechnungsnummer

- Regel: `VK-...` wird zu `RE-...`

### Anliegen aus Kundenanfragen

- Wenn ein Angebot aus einer Anfrage entsteht, bleibt das Anliegen sichtbar
- Wenn ein Auftrag direkt aus einer Anfrage entsteht, bleibt das Anliegen ebenfalls sichtbar
- Im Mockup wird das Anliegen in den Ansichten fuer Angebote und Auftraege angezeigt

### Rechnungsansicht

Ein Auftrag erscheint in der Rechnungsansicht, wenn sein Status rechnungsrelevant ist, zum Beispiel:

- `abgerechnet`
- `bezahlt`
- `archiviert`

### Rechnungsstatus

Die Rechnungsansicht leitet den Status aus `auftraege.status` ab:

- `abgerechnet` wird als offene Rechnung gezeigt
- `bezahlt` wird als bezahlte Rechnung gezeigt
- `archiviert` kann ebenfalls als erledigt gelten

### Zahlung

- Beim Erfassen einer Zahlung wird der zugehoerige Auftrag auf `bezahlt` gesetzt
- Beim Stornieren einer Zahlung kann der Auftrag wieder auf `abgerechnet` gesetzt werden

---

## 7. Vorteile dieser Vereinfachung

- weniger Tabellen
- weniger doppelte Daten
- leichter fuer Unterricht und Demo
- einfacher zu erklaeren
- Rechnungsansicht und Zahlungslogik bleiben trotzdem nachvollziehbar

---

## 8. Bewusste Grenzen des Modells

Dieses vereinfachte Modell ist didaktisch sinnvoll, hat aber fachliche Grenzen:

- keine echte eigenstaendige Lieferscheinverwaltung
- keine echte eigenstaendige Rechnung als Ursprungsbeleg
- Teilrechnungen sind nur schwer abbildbar
- Teillieferungen sind nur eingeschraenkt abbildbar
- steuerliche und buchhalterische Spezialfaelle sind nicht das Ziel des Mockups

Fuer ein Schulungs-ERP ist das in der aktuellen Projektphase absichtlich so gehalten.

---

## 9. Empfehlung fuer dieses Projekt

Fuer das aktuelle Mockup sollte die Dokumentation immer von diesem Kern ausgehen:

1. `kundenanfragen`
2. `angebote`
3. `auftraege`
4. `zahlungen`
5. `mahnungen`
6. `belege`

Alles Weitere ist im Moment eher eine Anzeige, ein Unterrichtsdokument oder eine spaetere Ausbauoption, aber nicht die fachliche Hauptstruktur.

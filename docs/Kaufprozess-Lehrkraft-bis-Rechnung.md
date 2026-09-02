# Kaufprozess von der Kundennachricht bis zur Rechnung

Dieses Dokument beschreibt den fachlichen Ablauf im Schulungs-ERP aus Sicht des Verkaufsprozesses:

1. Kundennachricht durch die Lehrkraft erfassen
2. Anfrage intern im Verkauf bearbeiten
3. Angebot erstellen und an den Kunden rueckspiegeln
4. Angebot annehmen und in einen Auftrag ueberfuehren
5. Auftrag bestaetigen und Lieferung abwickeln
6. Rechnung erstellen

Die Beschreibung orientiert sich an der aktuellen Projektstruktur in Frontend, Services und Prozesslogik.

---

## 1. Start: Kundennachricht durch die Lehrkraft

Der Prozess beginnt auf der Seite `Lehrkraft: Kundenkorrespondenz`.

Die Lehrkraft erfasst dort eine neue Kundenanfrage mit:

- Kunde oder neuer Kunde
- Ansprechpartner
- Kanal, zum Beispiel E-Mail
- Betreff
- Anliegen

Dabei werden fachlich zwei Dinge angelegt:

- ein Datensatz in `kundenanfragen`
- die erste Nachricht im Vorgang in `nachrichten`

Wichtig ist die `vorgangId`. Sie verbindet spaeter:

- Kundenanfrage
- Nachrichtenverlauf
- Angebot
- Auftrag
- Vertriebsdokumente

Typische Startstatus:

- Anfrage: `offen` oder `in bearbeitung`
- Nachrichtenverlauf: erster dokumentierter Kundenkontakt

---

## 2. Interne Bearbeitung im Verkauf

Nach der Erfassung uebernimmt der Verkauf den Vorgang. Die Anfrage bleibt als fachlicher Ausgangspunkt erhalten und kann ueber die `vorgangId` jederzeit nachvollzogen werden.

In dieser Phase passiert typischerweise:

- Sichtung des Anliegens
- Rueckfragen an den Kunden ueber den Nachrichtenverlauf
- Pruefung von Artikeln, Services und Preisen
- Vorbereitung eines Angebots

Wichtige Objekte:

- `kundenanfragen`
- `nachrichten`
- `kunden`
- `artikel`
- `services`

Ziel der Phase ist kein Abschluss, sondern ein belastbarer Angebotsstand.

---

## 3. Angebot erstellen

Aus der Anfrage wird ein Datensatz in `angebote` erzeugt. Das Angebot uebernimmt den fachlichen Bezug zur Anfrage und bleibt demselben Vorgang zugeordnet.

Ein Angebot enthaelt typischerweise:

- `angebotsNr`
- `anfrageId`
- `vorgangId`
- `kundeId`
- Positionen
- Preispositionen
- Gesamtbetrag
- Gueltigkeit
- Status

Wichtige Angebotsstatus im aktuellen Projekt:

- `in vorbereitung`
- `wartet auf antwort`
- `wiedervorlage`
- `angenommen`
- `abgelehnt`
- `beendet`

Sobald das Angebot an den Kunden herausgegeben wurde, ist der typische Arbeitsstatus:

- `wartet auf antwort`

Wenn Rueckfragen oder Verhandlungen entstehen, werden diese wieder im gemeinsamen Nachrichtenverlauf des Vorgangs dokumentiert.

---

## 4. Kundenentscheidung und Angebotsannahme

Die Lehrkraft bildet auf der Kundenseite die Rueckmeldung des Kunden ab. Im Thread kann ein offenes Angebot:

- angenommen
- abgelehnt
- beendet
- auf Wiedervorlage gesetzt

werden.

Wird ein Angebot angenommen, ist das der Uebergang vom Verhandlungs- in den Erfuellungsprozess.

Fachlich bedeutet das:

- Angebotsstatus wird auf `angenommen` gesetzt
- aus dem Angebot kann ein Auftrag entstehen

---

## 5. Auftrag anlegen

Nach der Angebotsannahme wird ein Datensatz in `auftraege` angelegt. Der Auftrag ist der verbindliche Kundenauftrag.

Der Auftrag uebernimmt den Prozessbezug aus Angebot und Anfrage:

- `angebotId`
- `anfrageId`
- `vorgangId`
- `kundeId`

Typische Inhalte des Auftrags:

- `auftragNr`
- Datum
- Positionen
- Gesamtbetrag
- Faelligkeit
- Status

Im aktuellen Modell ist der Auftrag die Grundlage fuer:

- Auftragsbestaetigung
- Versand- und Lieferdokumente
- spaetere Ausgangsrechnung

---

## 6. Auftragsbestaetigung und Vertriebsdokumente

Bevor eine Rechnung erzeugt werden darf, laeuft der Auftrag durch die naechsten Vertriebsstufen.

Das Projekt bildet dafuer `vertriebsdokumente` ab, insbesondere:

- `Auftragsbestaetigung`
- `Lieferschein`
- `Warenbegleitpapier`
- `Transportpapier`
- Liefer- bzw. Empfangsbestaetigung

Die Prozesslogik ist bewusst didaktisch aufgebaut:

1. Angebot angenommen
2. Auftragsbestaetigung erstellt
3. Auftragsbestaetigung versendet
4. Versand vorbereitet
5. Versand versendet
6. Warenempfang durch den Kunden bestaetigt

Erst wenn der Warenempfang bzw. die Lieferbestaetigung vorliegt, darf im aktuellen System die Ausgangsrechnung erstellt werden.

Das ist in der Prozesslogik bewusst so hinterlegt, damit Schueler den Zusammenhang zwischen:

- Auftrag
- Lieferung
- Empfangsbestaetigung
- Rechnung

klar sehen.

---

## 7. Voraussetzung fuer die Rechnung

Die Rechnungserstellung ist an einen fachlichen Check gekoppelt:

- Der Auftrag muss einen bestaetigten Warenempfang haben.

Ohne diese Bestaetigung kann keine Ausgangsrechnung erzeugt werden.

Damit ist der Ablauf im Projekt strenger als in vielen echten Unternehmen, aber didaktisch gut nachvollziehbar.

---

## 8. Rechnung erstellen

Die Rechnung wird als Datensatz in `rechnungen` angelegt, konkret als:

- `rechnungstyp = Ausgangsrechnung`

Die Erstellung erfolgt aus dem Auftrag heraus. Dabei werden unter anderem uebernommen:

- `auftragId`
- `kundeId`
- Rechnungsnummer
- Rechnungsdatum
- Faelligkeit
- Betrag

Initiale Felder der Ausgangsrechnung sind typischerweise:

- `rechnungsnr`
- `auftragId`
- `kundeId`
- `datum`
- `faelligAm`
- `betrag`
- `status = offen`
- `mahnstufe = -`

Mit dem Anlegen der Rechnung wird der Auftrag fachlich auf `abgerechnet` gesetzt.

Damit endet der hier betrachtete Kaufprozess. Danach folgt der Debitorenprozess mit:

- offenem Posten
- Zahlungseingang
- Mahnung
- Inkasso, falls noetig

---

## 9. Kompakter End-to-End-Ablauf

Der komplette Ablauf im Projekt ist:

1. Lehrkraft erfasst die Kundennachricht.
2. Das System legt `kundenanfragen` und den ersten Nachrichteneintrag an.
3. Der Verkauf bearbeitet die Anfrage intern.
4. Es wird ein Angebot in `angebote` erstellt.
5. Der Kunde reagiert ueber die Lehrkraft, der Verlauf bleibt in `nachrichten` sichtbar.
6. Bei Annahme wird aus dem Angebot ein Auftrag in `auftraege`.
7. Zum Auftrag werden Vertriebsdokumente wie Auftragsbestaetigung und Lieferdokumente erstellt.
8. Der Kunde bzw. die Lehrkraft bestaetigt den Warenempfang.
9. Erst danach wird aus dem Auftrag eine Ausgangsrechnung in `rechnungen` erzeugt.

---

## 10. Beteiligte Tabellen und Fachobjekte

- `kundenanfragen`: Startpunkt des Vorgangs
- `nachrichten`: kompletter Kommunikationsverlauf
- `kunden`: Kundenstammdaten
- `angebote`: Angebotsphase
- `angebotspositionen`: Positionen des Angebots
- `auftraege`: verbindlicher Kundenauftrag
- `auftragspositionen`: Positionen des Auftrags
- `vertriebsdokumente`: Auftrags- und Lieferdokumente
- `rechnungen`: Ausgangsrechnung nach erfolgreicher Lieferung

---

## 11. Didaktischer Nutzen im Schulungsprojekt

Der Ablauf zeigt Schuelerinnen und Schuelern besonders gut:

- wie aus einer einfachen Kundennachricht ein vollstaendiger Geschaeftsvorgang wird
- dass Angebot und Auftrag nicht dasselbe sind
- dass Lieferung und Empfang fachlich vor der Rechnung sichtbar sein koennen
- wie Informationen ueber eine gemeinsame `vorgangId` zusammenhaengen
- wie Verkauf und Buchhaltung nacheinander an demselben Vorgang arbeiten

Der Prozess ist damit nicht nur technisch, sondern auch fuer den Unterricht gut nachvollziehbar.

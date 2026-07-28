# Fokus: Einkauf, Verkauf und Artikel/Lagerbestand

Diese Liste konzentriert sich bewusst nur auf die Bereiche, die fuer ein vorzeigbares Mockup zuerst komplett wirken sollen:

- Einkauf
- Verkauf
- Artikel
- Lagerbestand

Ziel ist kein vollstaendiges ERP, sondern ein nachvollziehbares Schulungs-Mockup mit klaren Verknuepfungen, sinnvollen Oberflaechen und sichtbaren Prozessschritten.

---

## 1. Zielbild fuer das Mockup

Am Ende soll der Bereich so wirken, dass man folgende Kette im System sauber zeigen kann:

1. Artikel und Bestaende anlegen und verstehen
2. Bedarf erkennen und Bestellung ausloesen
3. Wareneingang buchen und Bestand veraendern
4. Kunde anlegen oder auswaehlen
5. Angebot mit passenden Positionen erstellen
6. Kundenreaktion dokumentieren
7. Auftrag erzeugen
8. Dokumente und Folgeaktionen nachvollziehen

---

## 2. Artikelstamm komplettieren

### Stammdaten und Anzeige

- [ ] Artikelnummer, Name, Kategorie und Typ durchgaengig einheitlich anzeigen
- [ ] Artikeltypen klar nutzen:
  `Einzelartikel`, `Komponente`, `Baugruppe`
- [ ] EK-Preis und VK-Preis auf allen relevanten Seiten konsistent verwenden
- [ ] In der Artikeltabelle sichtbar machen:
  `Beschaffungsart`, `Verkaufsstatus`, `Bestand`
- [ ] Detailansicht fuer Artikel so aufraeumen, dass Komponenten und Baugruppen verstaendlich lesbar sind

### Fachlogik

- [ ] Regel sichtbar machen:
  ohne EK-Preis = Herstellung
- [ ] Regel sichtbar machen:
  ohne VK-Preis = nicht verkaufbar
- [ ] Komponenten und Baugruppen mit VK-Preis im Verkauf zulassen
- [ ] Artikel ohne EK-Preis im Einkauf nicht auswählbar machen
- [ ] Nicht verkaufbare Artikel in Angebots- und Auftragsdialogen ausblenden

### Baugruppen und Komponenten

- [ ] Stueckliste fuer Baugruppen im Dialog einfach pflegbar halten
- [ ] Komponenten mit Menge anzeigen
- [ ] Entfernen und Hinzufuegen von Komponenten klar bedienbar machen
- [ ] In der Detailansicht eines Baugruppenartikels nicht nur IDs, sondern lesbare Komponentennamen zeigen

---

## 3. Lagerbestand komplettieren

### Bestand und Uebersicht

- [ ] Lagerbestand auf der Artikelseite direkt nachvollziehbar anzeigen
- [ ] Niedrige Bestaende oder Fehlmengen einfacher erkennbar machen
- [ ] Lagerseite und Artikelseite inhaltlich abstimmen, damit keine widerspruechlichen Bestandsanzeigen entstehen
- [ ] Lagerkennzahlen fuer das Mockup knapp und verstaendlich halten

### Bestandsbewegungen

- [ ] Wareneingang muss Bestand sichtbar erhoehen
- [ ] Retouren oder Korrekturen sollten zumindest als Folgeaktion dokumentierbar sein
- [ ] Falls kein echter Lagerbewegungsjournal kommt:
  mindestens letzte Aenderung oder Hinweistext anzeigen
- [ ] Klar machen, welche Bestandsaenderungen automatisch passieren und welche nur dokumentiert werden

### Didaktik

- [ ] Bestandsaenderung nach Wareneingang leicht demonstrierbar machen
- [ ] Differenz zwischen Einkaufsartikel, Lagerartikel und verkaufbarem Artikel im UI verstaendlich halten

---

## 4. Einkauf komplettieren

### Lieferanten

- [ ] Lieferantenstammdaten vollstaendig genug fuer die Demo halten
- [ ] Lieferantenvergleich fuer Preis, Lieferzeit und Bewertung klar nutzbar machen
- [ ] Favorit / Testlieferant / Bewertung sichtbar und einfach pflegbar halten
- [ ] Verlinkung von Bestellung zu Lieferant und zurueck pruefen

### Bestellung

- [ ] Neue Bestellung mit Suchfeld fuer Lieferant anlegen
- [ ] Bestellpositionen nur aus einkaufbaren Artikeln waehlen
- [ ] Positionsliste mit Mengen klar anzeigen
- [ ] Bestellwert oder einfache EK-Summe sichtbar machen
- [ ] Statusmodell fuer Bestellung einfach und konsistent halten

### Einkaufsdokumente

- [ ] Dokumente zur Bestellung sauber verknuepfen
- [ ] Bedarfsmeldung / Anfrage / Bestellung / Warenannahmeprotokoll fuer die Demo nachvollziehbar halten
- [ ] Automatisch erzeugte Titel und PDF-/Dokumentlogik konsistent halten
- [ ] Hinweise und Notizen im Dialog breit und gut lesbar darstellen

### Wareneingang

- [ ] Wareneingang nur bei passender Bestellung moeglich machen
- [ ] Nach Buchung Status und Bestand sichtbar aktualisieren
- [ ] Abweichungen oder Probleme zumindest als Notiz dokumentierbar machen
- [ ] Verlinkung Bestellung -> Wareneingang -> Artikelbestand pruefen

---

## 5. Verkauf komplettieren

### Kunden und Anfrage

- [ ] Kundenstammdaten fuer die Demo ausreichend pflegbar halten
- [ ] Kundenanfragen als sauberer Einstieg in den Vertriebsprozess nutzbar halten
- [ ] Verknuepfung Kunde -> Anfrage -> Angebot pruefen

### Angebot

- [ ] Angebot nur mit vorhandenem Kunden anlegbar machen
- [ ] Positionen per Suchfeld aus Artikel und Services auswaehlbar halten
- [ ] Nur verkaufbare Artikel im Angebotsdialog anzeigen
- [ ] Frist `Gültig bis` weiter sauber nutzen
- [ ] Verguenstigung und Begruendung sichtbar speichern und anzeigen
- [ ] Angebotsgesamtwert immer aus Positionen minus Verguenstigung ableiten

### Angebotsprozess

- [ ] Reihenfolge fuer den Mockup-Prozess beibehalten:
  `offen` -> `wartet auf Antwort` -> `angenommen` oder `abgelehnt`
- [ ] Kunde rueckmelden, Annahme bestaetigen und Ablehnung bestaetigen klar trennen
- [ ] Angebot erst nach Annahme in Auftrag ueberfuehren
- [ ] Folgekommunikation als Notiz oder Hinweis dokumentierbar machen

### Auftrag und Folgeprozess

- [ ] Auftrag aus Angebot mit allen wichtigen Daten uebernehmen
- [ ] Verguenstigung und Grund aus dem Angebot in den Auftrag mitnehmen
- [ ] Auftragsbestaetigung, Versand und Dokumente weiter verknuepft halten
- [ ] Links von Angebot zu Auftrag und von Auftrag zu Dokumenten pruefen

---

## 6. Bereichsuebergreifende Verknuepfungen absichern

- [ ] Artikel -> Bestellung -> Wareneingang -> Bestand
- [ ] Kunde -> Anfrage -> Angebot -> Auftrag
- [ ] Angebot -> Auftrag -> Vertriebsdokumente
- [ ] Bestellung -> Einkaufsdokumente -> Wareneingang
- [ ] Auftrag und Bestellung sollen aus Detailansichten direkt geoeffnet werden koennen

---

## 7. UI und Bedienbarkeit fuer das Mockup

- [ ] Suchfelder mit Dropdown ueberall dort verwenden, wo abhängige Datensaetze gebraucht werden
- [ ] Tabellenaktionen einheitlich benennen:
  `Bearbeiten`, `Löschen`, `Öffnen`, `Dokumente`, `Wareneingang`, `Annahme bestätigen`
- [ ] Breite Textfelder wie `Notiz`, `Beschreibung`, `Hinweis`, `Begruendung` ueber die volle Dialogbreite anzeigen
- [ ] Spaltenauswahl auf den wichtigen Tabellen verfuegbar machen, wenn sinnvoll
- [ ] Detaildialoge auf Konsistenz pruefen:
  Links, Labels, Datumsfelder, Summen, Notizen

---

## 8. Was fuer das Mockup nicht noetig ist

Diese Punkte muessen fuer den fokussierten Stand nicht voll ausgebaut werden:

- komplexe Lagerplatzlogik
- automatische Nachbestellvorschlaege
- echte Preis- und Rabattengine
- tiefere Freigabeworkflows
- exakte Produktionskalkulation von Baugruppen
- rechtlich vollstaendige Korrespondenz
- ausgefeilte PDF-Layouts

---

## 9. Priorisierte Reihenfolge

### Prioritaet A

- [ ] Artikelstamm logisch abschliessen
- [ ] Lagerbestand und Wareneingang sauber zeigen
- [ ] Bestellung mit Lieferant und Positionen stabil nutzbar machen
- [ ] Angebot mit Kunden, Positionen, Frist und Verguenstigung stabil nutzbar machen
- [ ] Angebotsprozess bis Auftrag verknuepft demonstrierbar machen

### Prioritaet B

- [ ] Einkaufsdokumente und Vertriebsdokumente auf Konsistenz pruefen
- [ ] Kennzahlen auf Einkaufs- und Verkaufs-Uebersichten nachziehen
- [ ] Detailansichten und Tabellenbuttons vereinheitlichen

### Prioritaet C

- [ ] Restliche Texte, Hinweise und kleine UX-Luecken fuer die Praesentation aufraeumen
- [ ] Demo-Daten fuer typische Unterrichtsfaelle gezielt verbessern

---

## 10. Abnahme fuer den fokussierten Stand

Der Bereich ist fuer das Mockup ausreichend komplett, wenn man folgende Demo ohne Bruch zeigen kann:

- [ ] Artikel oder Baugruppe anlegen und Bestand sehen
- [ ] Lieferant waehlen und Bestellung anlegen
- [ ] Wareneingang buchen und Bestandsaenderung sehen
- [ ] Kundenanfrage oder Kunde waehlen
- [ ] Angebot mit Artikel-/Servicepositionen erstellen
- [ ] Verguenstigung mit Grund erfassen
- [ ] Auf Kundenantwort warten
- [ ] Angebot annehmen und Auftrag erzeugen
- [ ] Auftrag und Dokumente per Verknuepfung oeffnen

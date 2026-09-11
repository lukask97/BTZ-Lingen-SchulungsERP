# Visuelle Smoke-Tests

Diese Checkliste ist fuer manuelle Tests im Browser gedacht. Ziel ist nicht, jede fachliche Regel vollstaendig zu beweisen, sondern mit wenigen effizienten Rundgaengen moeglichst viele visuelle Fehler, Layout-Brueche und Bedienungsunstimmigkeiten zu finden.

Empfohlener Login:

- `admin / admin` fuer Vollzugriff
- danach bei Bedarf einzelne Rollen testen, zum Beispiel `lager / lager`, `einkauf / einkauf`, `verkauf / verkauf`, `buchhaltung / buchhaltung`

## Vorbereitung

1. Frontend und Backend starten.
2. Browser auf `http://localhost:5173` oeffnen.
3. Bei jedem Fehler notieren:
   - Seite / Route
   - Rolle / Benutzer
   - Aktion
   - Browserbreite
   - Screenshot, falls es ein Layoutfehler ist

## Globale Sichtpruefung

Diese Punkte auf mehreren Seiten wiederholen:

- Sidebar: keine unsichtbaren Bereiche hinter dem Hauptlayout, Footer bleibt erreichbar.
- Sidebar-Footer: Rolle, Klasse, Nutzer und Dark-Mode-Schalter wirken kompakt und nicht gequetscht.
- Navigation: Seitenwechsel ueber Sidebar funktioniert ohne Haengenbleiben.
- Karten: Titel und Header-Aktionen ragen nicht in Rundungen.
- Tabellen: Toolbar, Suche, Filter, Spaltenmenue, Aktionen und Pagination wirken ausgerichtet.
- Spaltenmenue: Hintergrund ist deckend, liegt im Vordergrund und wird nicht von Tabellenaktionen ueberdeckt.
- Dialoge: Labels und Eingabefelder bleiben zusammen, auch bei schmalem Fenster.
- Buttons: stehen nicht abgeschnitten, ueberlappen nicht und umbrechen nicht unschoen.
- Dark Mode: Text, Tabellen, Karten, Dialoge und Dropdowns bleiben lesbar.

## Rundgang 1: Login, Layout, Navigation

Ziel: Grundlayout und Rollenrahmen pruefen.

1. Als `admin / admin` einloggen.
2. Dashboard oeffnen.
3. Sidebar-Gruppen nacheinander aufklappen.
4. Mehrere Seiten wechseln: `Artikel`, `Kategorien`, `Bestellungen`, `Angebote`, `Buchhaltung`, `Admin > Klassen`.
5. Browserbreite testen:
   - breit: ca. 1440px
   - mittel: ca. 1000px
   - schmal: ca. 760px
   - mobil: ca. 390px

Visuell pruefen:

- Inhalt bleibt innerhalb des Mainlayouts.
- Header, Karten und Tabellen haben konsistente Abstaende.
- Keine Elemente liegen hinter Sidebar oder Sticky-Tabellenspalten.
- Mobile Sidebar oeffnet/schliesst kontrolliert.

## Rundgang 2: Artikel und Kategorien

Ziel: Kategoriebaum, Artikelfilter, Artikeldialog und Kategorie-Erstellung im Artikelablauf pruefen.

1. `Logistik > Kategorien` oeffnen.
2. Kategorienbaum anzeigen.
3. Mehrere Ebenen auf- und zuklappen.
4. Kategorien-Tabelle pruefen:
   - alle Standardspalten sichtbar
   - Beschreibungen maximal wenige Zeilen
   - lange Texte per Hover lesbar
   - Aktionen stehen ordentlich
5. `Logistik > Artikel` oeffnen.
6. Kategorie-Filter mit langer Oberkategorie testen.
7. Pruefen, ob Artikel aus Unterkategorien rekursiv mit angezeigt werden.
8. Neuen Artikel starten.
9. Im Kategorie-Dropdown `Neue Kategorie anlegen...` waehlen.
10. Kategorie erstellen und zurueck in den Artikeldialog gehen.
11. Pruefen, ob bereits eingegebene Artikeldaten erhalten bleiben.
12. Artikel mit EK/VK-Preis, Bestand und Beschreibung speichern.

Visuell pruefen:

- Kategorie-Filter zerlegt die Toolbar nicht unnoetig.
- Lange Kategoriepfade sprengen keine Dropdowns oder Tabellenzellen.
- Euro-Suffix sitzt im Eingabefeld und nicht daneben.
- Dialog bleibt bei 2- bzw. 4-Spalten sauber responsiv.
- Bildbereich im Artikeldialog ist nicht gequetscht.

## Rundgang 3: Einkauf bis Bestellung

Ziel: Einkaufstabellen, Bestelldialoge und Excel-Export grob pruefen.

1. `Einkauf > Lieferanten` oeffnen.
2. Lieferanten bearbeiten und Dialog abbrechen.
3. `Lieferantenkonditionen` oeffnen.
4. Eine Kondition ansehen oder bearbeiten.
5. `Bestellungen` oeffnen.
6. Neue Bestellung starten.
7. Artikel auswaehlen, Menge setzen, Lieferant waehlen.
8. Bestellung speichern oder Dialog kontrolliert abbrechen.
9. Falls vorhanden: Bedarfsmeldungs-/Workbook-Export ausfuehren.

Visuell pruefen:

- Tabellenaktionen bleiben sichtbar und ueberdecken keine Inhalte.
- Dropdowns mit langen Namen bleiben bedienbar.
- Pflichtfeldfehler erscheinen sichtbar, aber nicht layoutbrechend.
- Beim Export/Erstellen ist erkennbar, ob gearbeitet wird.

## Rundgang 4: Verkauf von Anfrage bis Angebot

Ziel: Verkaufsdialoge, Positionstabellen, Freigabehinweise und Nachrichtenverlauf pruefen.

1. `Lehrkraft > Kundenkorrespondenz` oeffnen.
2. Neue Kundenanfrage anlegen oder vorhandenen Vorgang oeffnen.
3. Nachrichtenverlauf ansehen.
4. In `Verkauf > Kundenanfragen` denselben Vorgang suchen.
5. `Angebote` oeffnen.
6. Neues Angebot aus einer Anfrage oder Vorlage starten.
7. Position hinzufuegen.
8. Rabatt/Zuschlag testen, falls sichtbar.
9. Freigabe-/Warnhinweise pruefen.
10. Dialog bei schmaler Fensterbreite testen.

Visuell pruefen:

- Angebotspositionen und Kalkulationsuebersicht bleiben lesbar.
- Tabellen im Dialog haben keine abgeschnittenen Aktionen.
- Nachrichten-/Thread-Karten haben saubere Abstaende.
- Lange Kunden- oder Artikelnamen verursachen keine Ueberlappung.

## Rundgang 5: Auftrag, Versand, Rechnung

Ziel: Prozesskette und buchhalterische Folgeansichten pruefen.

1. `Verkauf > Auftraege` oeffnen.
2. Auftrag ansehen oder aus Angebot erzeugen, falls Testdaten passen.
3. `Vertriebsdokumente` oeffnen.
4. Dokumentdialog oeffnen und Vorschautitel pruefen.
5. `Logistik > Versand` oeffnen.
6. Versanddialog oeffnen.
7. `Buchhaltung > Ausgangsrechnungen` oeffnen.
8. Rechnungsprozess oder Rechnung ansehen.
9. `Bankauszug` und `Firmenkonto` kurz oeffnen.

Visuell pruefen:

- Prozesshinweise und Statuskarten wirken konsistent.
- Dialoge bleiben scrollbar, aber nicht abgeschnitten.
- Datumsfelder, Geldfelder und Statusfelder sind lesbar.
- Tabellen-Pagination startet sinnvoll und reagiert auf `pro Seite`.

## Rundgang 6: Admin, Klassen, Benutzer

Ziel: Klassenwechsel, Benutzerklassen und Admin-Dialoge pruefen.

1. `Admin > Klassen` oeffnen.
2. Neue Klasse starten.
3. Pruefen, dass neue Klasse leer startet.
4. Option `andere Klasse kopieren` testen.
5. Checkbox `Teilnehmer uebernehmen` ein- und ausschalten.
6. Klasse erstellen und warten, bis der Vorgang fertig ist.
7. Sidebar pruefen: neue Klasse soll ohne Reload erscheinen.
8. `Benutzer` oeffnen.
9. Benutzer bearbeiten.
10. Klassenliste mit Checkboxen testen.

Visuell pruefen:

- Ladezustand beim Klassenerstellen ist klar sichtbar.
- Button kann nicht mehrfach ausgeloest werden, waehrend gearbeitet wird.
- Klassen-Checkboxliste ist maximal ca. drei Elemente hoch und scrollbar.
- Sidebar aktualisiert Klasse und Rolle korrekt.

## Responsive Sonderpruefungen

Diese Seiten eignen sich besonders, um Layoutbrueche zu finden:

- `Artikel`: lange Kategorienamen, Artikeldialog, Bildbereich
- `Kategorien`: Kategoriebaum, lange Pfade, Beschreibungsspalte
- `Angebote`: grosser Dialog mit Positionstabellen
- `Bestellungen`: Toolbar, Tabellenaktionen, Dialoge
- `Lehrkraft-Optionen`: Statusbereich in allen Tabs
- `Benutzer`: Klassen-Checkboxliste
- `Sidebar`: schmale Hoehe und schmale Breite

Fensterbreiten:

- 1440px: Desktop normal
- 1180px: Sidebar plus breite Tabellen
- 900px: kritischer Tablet-Bereich
- 640px: mobile Toolbar/Dialoge
- 390px: Smartphone

## Typische visuelle Fehler

Notieren, wenn eines davon auftritt:

- Text ragt in Kartenrundung.
- Buttontext wird abgeschnitten.
- Aktionen liegen ueber Tabelleninhalt.
- Dropdown liegt hinter Sticky-Spalte oder Dialog.
- Label und Eingabefeld werden getrennt.
- Tabellenzellen werden leer oder verschwinden.
- Tooltip/Help-Punkt verdeckt Labels.
- Dark Mode hat zu wenig Kontrast.
- Scrollbar fehlt, obwohl Inhalt abgeschnitten ist.
- Layout springt nach Speichern, Filtern oder Seitenwechsel.

## Kurzes Ergebnisprotokoll

| Bereich            | OK? | Benutzer | Browserbreite | Notiz |
| ------------------ | --- | -------- | ------------- | ----- |
| Login/Layout       |     |          |               |       |
| Artikel/Kategorien |     |          |               |       |
| Einkauf/Bestellung |     |          |               |       |
| Verkauf/Angebot    |     |          |               |       |
| Auftrag/Rechnung   |     |          |               |       |
| Admin/Klassen      |     |          |               |       |

Befunde:

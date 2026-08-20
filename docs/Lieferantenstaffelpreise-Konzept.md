# Lieferantenstaffelpreise

## Ziel

Fuer den Einkauf soll je Kombination aus Artikel und Lieferant hinterlegt werden koennen,
welcher Preis pro Stueck ab einer bestimmten Mindestbestellmenge gilt.

Beispiel:

- Artikel `ART003 Fahrradhelm`
- Lieferant `KR10001 Velo Parts Nord`
- ab `10` Stueck: `23,90 EUR`
- ab `25` Stueck: `22,40 EUR`

## Datenmodell

Die Preisstaffel wird als eigene Tabelle `lieferantenArtikelStaffeln` gefuehrt.
Jeder Datensatz repraesentiert genau eine Staffelzeile.

Felder:

- `id`: technische ID
- `artikelId`: Referenz auf den Artikel
- `lieferantId`: Referenz auf den Lieferanten
- `mindestbestellmenge`: Untergrenze der Staffel
- `stueckpreis`: Preis pro Stueck fuer diese Staffel

## Fachliche Regeln

- Eine Lieferant-Artikel-Kombination kann mehrere Staffelzeilen besitzen.
- Die Seite `Lieferantenvergleich` gruppiert diese Zeilen zu einer sichtbaren Kombination.
- Im Bearbeitungsdialog werden immer alle Staffelungen der Kombination zusammen angezeigt.
- Die Staffelungen werden nach `mindestbestellmenge` sortiert gespeichert und dargestellt.
- Fuer jede Kombination muss mindestens eine Staffel vorhanden sein.
- `mindestbestellmenge` muss groesser `0` sein.
- `stueckpreis` darf nicht negativ sein.

## UI-Konzept

- Die Uebersicht zeigt pro Kombination genau eine Zeile:
  - Artikelnummer
  - Artikel
  - Lieferant
  - Staffeltext
- `Neu` und `Bearbeiten` oeffnen einen Dialog.
- Im Dialog werden Artikel und Lieferant einmalig gewaehlt.
- Darunter koennen beliebig viele Staffelzeilen angelegt, angepasst oder entfernt werden.

## Seed-Nutzung

Die Demo-Daten enthalten mehrere reale Beispielstaffeln fuer Fahrraeder, Komponenten und Zubehoer,
damit der Lieferantenvergleich direkt im Unterricht gezeigt und bearbeitet werden kann.

# Demo-Anleitung

## Start

```powershell
cd frontend
npm run dev
```

Anschliessend [http://localhost:5173](http://localhost:5173) oeffnen.

| Konto | Passwort | Zweck |
| --- | --- | --- |
| `admin` | `admin` | Vollstaendige Demo aller Bereiche |
| `lager` | `lager` | Lager, Artikel und Wareneingaenge |
| `buchhaltung` | `buchhaltung` | Buchhaltung, Verkauf und Service |
| `marketing` | `marketing` | Marketingaktionen |

## Testdaten zuruecksetzen

Als `admin` anmelden und auf dem Dashboard **Testdaten zuruecksetzen** waehlen. Die Aktion loescht ausschliesslich die lokalen Browserdaten und laedt danach die vorgegebenen Startdaten erneut.

## 1. Einkauf und Lager

**Ausgangszustand:** Als `admin` anmelden; die Bestellung `EK-2026-001` ist offen.

1. **Lieferanten** oeffnen und einen der Startlieferanten ansehen.
2. **Bestellungen** oeffnen und bei Bedarf eine neue Bestellung mit einem Artikel anlegen.
3. **Wareneingaenge** oeffnen und bei `EK-2026-001` auf **Wareneingang buchen** klicken.
4. **Artikel** oeffnen: Der Bestand von *Lastenrad Premium* ist um drei Stueck gestiegen.

## 2. Verkauf und Buchhaltung

**Ausgangszustand:** Als `admin` oder `buchhaltung` anmelden; im Bereich `Kundenanfragen` liegt eine Startanfrage vor.

1. **Kunden** oeffnen und die vorhandenen Kundendaten ansehen.
2. **Kundenanfragen** oeffnen und das hinterlegte Anliegen der Startanfrage pruefen.
3. Die Anfrage bei Bedarf direkt beantworten; der Antworttext wird im Vorgang gespeichert.
4. Aus der Anfrage entweder ein **Angebot** oder direkt einen **Auftrag** erzeugen.
5. **Angebote** oder **Auftraege** oeffnen und pruefen, dass das urspruengliche Anliegen oben im Dialog sichtbar bleibt.
6. **Buchhaltung** oeffnen und offene Rechnungen sowie Betraege ansehen.

## 3. Servicefall

**Ausgangszustand:** Als `admin` oder `buchhaltung` anmelden; die Startreklamation hat den Status `neu`.

1. **Reklamationen** oeffnen.
2. Bei der vorhandenen Reklamation auf **Ersatzlieferung planen** klicken.
3. Im Filter **Status** den Wert *Ersatzlieferung geplant* waehlen.
4. Optional eine neue Reklamation mit Kunde und Beschreibung erfassen.

## 4. Marketing

**Ausgangszustand:** Als `admin` oder `marketing` anmelden.

1. **Marketing** oeffnen und **Neue Aktion** waehlen.
2. Als Art zum Beispiel *Event* oder *Kundenfeedback* auswaehlen.
3. Einen Titel vergeben und als Status **laeuft** waehlen.
4. Speichern und anschliessend nach Art und Status filtern.

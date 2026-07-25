# Demo-Anleitung

## Start

```powershell
cd frontend
npm run dev
```

Anschließend [http://localhost:5173](http://localhost:5173) öffnen.

| Konto | Passwort | Zweck |
| --- | --- | --- |
| `admin` | `admin` | Vollständige Demo aller Bereiche |
| `lager` | `lager` | Lager, Artikel und Wareneingänge |
| `buchhaltung` | `buchhaltung` | Buchhaltung, Verkauf und Service |
| `marketing` | `marketing` | Marketingaktionen |

## Testdaten zurücksetzen

Als `admin` anmelden und auf dem Dashboard **Testdaten zurücksetzen** wählen. Die Aktion löscht ausschließlich die lokalen Browserdaten und lädt danach die vorgegebenen Startdaten erneut.

## 1. Einkauf und Lager

**Ausgangszustand:** Als `admin` anmelden; die Bestellung `EK-2026-001` ist offen.

1. **Lieferanten** öffnen und einen der Startlieferanten ansehen.
2. **Bestellungen** öffnen und bei Bedarf eine neue Bestellung mit einem Artikel anlegen.
3. **Wareneingänge** öffnen und bei `EK-2026-001` auf **Wareneingang buchen** klicken.
4. **Artikel** öffnen: Der Bestand von *Lastenrad Premium* ist um drei Stück gestiegen.

## 2. Verkauf und Buchhaltung

**Ausgangszustand:** Als `admin` oder `buchhaltung` anmelden; das Angebot `ANG-2026-001` ist offen.

1. **Kunden** öffnen und die vorhandenen Kundendaten ansehen.
2. **Angebote** öffnen; ein neues Angebot anlegen oder das Startangebot verwenden.
3. Beim offenen Angebot auf **In Auftrag übernehmen** klicken.
4. **Aufträge** öffnen und den neu erzeugten Auftrag prüfen.
5. **Buchhaltung** öffnen und offene Rechnungen sowie Beträge ansehen.

## 3. Servicefall

**Ausgangszustand:** Als `admin` oder `buchhaltung` anmelden; die Startreklamation hat den Status `neu`.

1. **Reklamationen** öffnen.
2. Bei der vorhandenen Reklamation auf **Ersatzlieferung planen** klicken.
3. Im Filter **Status** den Wert *Ersatzlieferung geplant* wählen.
4. Optional eine neue Reklamation mit Kunde und Beschreibung erfassen.

## 4. Marketing

**Ausgangszustand:** Als `admin` oder `marketing` anmelden.

1. **Marketing** öffnen und **Neue Aktion** wählen.
2. Als Art zum Beispiel *Event* oder *Kundenfeedback* auswählen.
3. Einen Titel vergeben und als Status **läuft** wählen.
4. Speichern und anschließend nach Art und Status filtern.

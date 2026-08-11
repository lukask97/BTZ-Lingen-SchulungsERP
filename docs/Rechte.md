# Rechte

Stand: 2026-08-03

## Ziel

Diese Datei dokumentiert die im Projekt verwendete Rechte-Logik fuer Backend, Frontend und Seed-Daten.
Geprueft wurden dabei:

- Rollen aus den Demo- und Seed-Daten
- Tabellen-Mapping in `backend/security.py`
- sichtbare Bereiche und Routen im Frontend
- praktisch verwendete, aber zuvor unvollstaendig dokumentierte Rechte

## Grundprinzip

Das Backend prueft Tabellenzugriffe ueber `TABLE_ACCESS_MAP` in `backend/security.py`.
Ein Tabellenzugriff ist erlaubt, wenn ein Benutzer zum jeweiligen Bereich mindestens eines der folgenden Rechte besitzt:

- das nackte Bereichsrecht, z. B. `verkauf`
- ein Leserecht, z. B. `verkauf.lesen`
- ein Anzeigerecht, z. B. `verkauf.anzeigen`
- ein Bearbeitungsrecht, z. B. `verkauf.bearbeiten`

Fuer `read` akzeptiert das Backend aktuell `anzeigen`, `lesen` und `bearbeiten`.

## Wichtige Ergaenzungen

Folgende Punkte wurden als fachlich sinnvoll ergaenzt:

- `Verkauf` erhaelt `artikel.lesen`, damit Angebote und Auftraege ihre Artikelreferenzen ohne `403` laden koennen.
- `Verkauf Azubi` erhaelt `kunde.lesen`, `artikel.lesen` und `service.lesen`, damit der normale Verkaufsfluss lesend funktioniert.
- `Verkauf Senior` wurde auf ein sinnvolles Senior-Niveau angehoben:
  `kunde.lesen`, `kunde.anlegen`, `kunde.bearbeiten`, `artikel.lesen`, `verkauf.lesen`, `verkauf.bearbeiten`, `service.lesen`, `service.bearbeiten`, `gf.lesen`.
- `Buchhaltung` erhaelt zusaetzlich `kunde.bearbeiten`, weil die Rolle laut Fachbild Kundenkonten verwaltet.
- Die Kontenuebersicht unter `/firmenkonto` ist nun bereichsbezogen:
  `Verkauf` sieht nur das Verkaufskonto, `Einkauf` nur das Einkaufskonto, waehrend `Buchhaltung` und `Geschaeftsfuehrung` alle drei Konten sehen und steuern duerfen.
- Der Zielbestand fuer das Einkaufskonto wird aktuell browserlokal gespeichert. Das reicht fuer das Schulungsmockup, ist aber noch keine zentrale Servereinstellung.

## Vollstaendiger Rechtekatalog

Der Rechtekatalog wurde vereinheitlicht und um fehlende, bereits genutzte Rechte ergaenzt:

- `*`
- `organisation.lesen`
- `einkauf.lesen`, `einkauf.bearbeiten`
- `verkauf.lesen`, `verkauf.bearbeiten`
- `service.lesen`, `service.bearbeiten`
- `marketing.lesen`, `marketing.bearbeiten`
- `buchhaltung.lesen`, `buchhaltung.bearbeiten`
- `logistik.lesen`, `logistik.bearbeiten`
- `personalwesen.lesen`, `personalwesen.bearbeiten`
- `gf.lesen`, `gf.bearbeiten`
- `kunde.lesen`, `kunde.anzeigen`, `kunde.anlegen`, `kunde.bearbeiten`, `kunde.loeschen`
- `artikel.lesen`, `artikel.anzeigen`, `artikel.anlegen`, `artikel.bearbeiten`, `artikel.loeschen`
- `rechnung.lesen`, `rechnung.anzeigen`, `rechnung.anlegen`, `rechnung.bearbeiten`, `rechnung.loeschen`
- `lager.lesen`, `lager.anzeigen`, `lager.anlegen`, `lager.bearbeiten`, `lager.loeschen`, `lager.buchen`
- `benutzer.lesen`, `benutzer.anzeigen`, `benutzer.anlegen`, `benutzer.bearbeiten`, `benutzer.loeschen`
- `rollen.lesen`, `rollen.anzeigen`, `rollen.anlegen`, `rollen.bearbeiten`, `rollen.loeschen`
- `rechte.lesen`, `rechte.anzeigen`, `rechte.anlegen`, `rechte.bearbeiten`, `rechte.loeschen`

## Rollenmatrix

### Admin

- `*`

### Lager

- `artikel.lesen`
- `lager.lesen`
- `lager.buchen`
- `einkauf.lesen`
- `einkauf.bearbeiten`

### Buchhaltung

- `kunde.lesen`
- `kunde.anlegen`
- `kunde.bearbeiten`
- `rechnung.lesen`
- `rechnung.anlegen`
- `rechnung.bearbeiten`
- `verkauf.lesen`
- `verkauf.bearbeiten`
- `service.lesen`
- `service.bearbeiten`
- `organisation.lesen`
- `buchhaltung.lesen`
- `buchhaltung.bearbeiten`

### Marketing

- `marketing.lesen`
- `marketing.bearbeiten`
- `verkauf.lesen`

### Einkauf

- `einkauf.lesen`
- `einkauf.bearbeiten`
- `lager.lesen`
- `lager.bearbeiten`
- `artikel.lesen`
- `artikel.bearbeiten`

### Verkauf

- `kunde.lesen`
- `kunde.anlegen`
- `kunde.bearbeiten`
- `artikel.lesen`
- `verkauf.lesen`
- `verkauf.bearbeiten`
- `service.lesen`
- `service.bearbeiten`

### Verkauf Azubi

- `kunde.lesen`
- `artikel.lesen`
- `verkauf.lesen`
- `verkauf.bearbeiten`
- `service.lesen`

### Verkauf Senior

- `kunde.lesen`
- `kunde.anlegen`
- `kunde.bearbeiten`
- `artikel.lesen`
- `verkauf.lesen`
- `verkauf.bearbeiten`
- `service.lesen`
- `service.bearbeiten`
- `gf.lesen`

### Personalwesen

- `personalwesen.lesen`
- `personalwesen.bearbeiten`
- `organisation.lesen`

### Geschaeftsfuehrung

- `*`

## Bekannte Modellgrenzen

- `gf.lesen` oeffnet im aktuellen Frontend den gesamten GF-Bereich lesend, nicht nur Freigaben.
- Das Projekt verwendet parallel `*.lesen` und `*.anzeigen`. Das Backend akzeptiert fuer Lesezugriffe derzeit beides.
- Der Seed-Generator konnte lokal wegen eines Node-Pfadproblems nicht verwendet werden; Frontend-Mock und Backend-Seed wurden deshalb direkt synchronisiert.
- Die Wochenumbuchung wird derzeit manuell ueber die Kontenseite ausgeloest. Es gibt noch keinen automatischen Scheduler fuer jeden Montag.

## Geaenderte Dateien

- `frontend/src/constants/permissions.ts`
- `frontend/src/auth/permissions.ts`
- `frontend/src/pages/buchhaltung/Firmenkonto.tsx`
- `frontend/src/router/AppRouter.tsx`
- `frontend/src/services/buchhaltung/firmenkontoService.ts`
- `frontend/src/services/mockup/mockData.ts`
- `frontend/src/styles/components.css`
- `frontend/src/types/auth.ts`
- `backend/seed/mock_seed.json`

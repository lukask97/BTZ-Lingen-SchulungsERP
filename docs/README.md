# Dokumentation

Diese Uebersicht hilft beim Einstieg in den `docs/`-Ordner.

## Schnellstart

- [Logins.md](./Logins.md)
  Demo-Zugaenge fuer ERP, Backend, PostgreSQL und pgAdmin
- [Bruno-API-Tests](../bruno/README.md)
  einzeln ausfuehrbare API-Checks und ein Ende-zu-Ende-Kaufprozess fuer die Bruno-Erweiterung

## Architektur und Datenmodell

- [DB-Schema-Entwurf.md](./DB-Schema-Entwurf.md)
  fachlicher Datenmodell-Entwurf auf Basis der aktuellen JSONB-Tabellen
- [Seed-Dateien-Analyse.md](./Seed-Dateien-Analyse.md)
  kompakte Analyse der Seed-Dateien, ihrer Reifegrade und aktuellen Befunde
- [Auftragsmodell-Verkaufsprozess.md](./Auftragsmodell-Verkaufsprozess.md)
  Ablauf und Struktur rund um Angebot, Auftrag und Folgeobjekte
- [Kaufprozess-Lehrkraft-bis-Rechnung.md](./Kaufprozess-Lehrkraft-bis-Rechnung.md)
  durchgehender Ablauf von der Kundennachricht durch die Lehrkraft bis zur Ausgangsrechnung
- [Lieferantenstaffelpreise-Konzept.md](./Lieferantenstaffelpreise-Konzept.md)
  Konzept fuer Lieferantenstaffeln und Preislogik

## Sonstige Unterlagen

- [Visuelle-Smoke-Tests.md](./Visuelle-Smoke-Tests.md)
  Manuelle Sichtpruefung fuer wichtige Ablaufe, responsive Layouts, Dialoge und visuelle Unstimmigkeiten
- [Logins.md](./Logins.md)
  Demo- und Test-Zugaenge

## Naechste Aufraeum-Ideen

1. Veraltete oder doppelte Fachnotizen wie `BesserExtern.md` und `Fokus.md` in eine gemeinsame Entscheidungsdokumentation ueberfuehren.
2. Bild- und Diagrammdateien in einen Unterordner wie `docs/assets/` verschieben.
3. Architektur, Bedienung und Konzeptpapiere in Unterordner wie `docs/architektur/`, `docs/prozesse/` und `docs/betrieb/` aufteilen.
4. Lange React-Seiten und umfangreiche Services jeweils mit passender Dokumentation verknuepfen, damit Fachlogik und Code schneller auffindbar sind.
5. Neue Strukturverbesserungen lieber ueber wenige klare Sammeldateien abbilden als ueber viele kleine Einzeldateien.

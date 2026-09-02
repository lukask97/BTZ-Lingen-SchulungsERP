# Bruno-API-Tests

Diese Sammlung kann direkt mit der Bruno-Erweiterung in VS Code geoeffnet werden.

1. Backend starten: `docker compose up -d postgres backend`
2. In Bruno `Open Collection` waehlen und den Ordner `bruno/` auswaehlen.
3. Die Umgebung `lokal` aktivieren.
4. Die Ordner jeweils ueber `Run Folder` in der angegebenen Reihenfolge ausfuehren: `01-Grundfunktionen`, `02-CRUD`, `03-Kaufprozess-Ende-zu-Ende`.

Die Requests innerhalb eines Ordners sind bewusst nummeriert. Einige Folge-Requests verwenden die ID, die der vorherige Request erzeugt hat. Sie sind daher nicht einzeln startbar: Bei `02-CRUD` zuerst `01-Testkunde-anlegen` ausfuehren; beim Ende-zu-Ende-Test immer bei `00-Anmelden-und-Reset` beginnen.

Der End-to-End-Test setzt vor dem Durchlauf die Seed-Daten ueber `POST /api/reset` zurueck. Er verwendet deshalb den Admin-Zugang und veraendert die lokale Demo-Datenbank. Der Durchlauf erstellt danach einen eigenen Kunden, eine Anfrage, Nachricht, Angebot samt Position, Auftrag samt Position, Warenempfangsbestaetigung und eine Ausgangsrechnung.

Die Requests verwenden die serverseitige Session. Bruno muss Cookies fuer `http://localhost:5000` speichern; dies ist in der Standardkonfiguration aktiv.

Hinweis zur Prozessregel: Der Test dokumentiert vor der Rechnung den bestaetigten Warenempfang. Die fachliche Sperre fuer eine zu fruehe Rechnung liegt aktuell in der Frontend-Prozesslogik; der generische API-Endpunkt selbst validiert diese Voraussetzung nicht.

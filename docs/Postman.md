# Postman-Tests

Importiere diese beiden Dateien in Postman:

- `docs/BTZ-SchulungsERP.postman_collection.json`
- `docs/BTZ-SchulungsERP.local.postman_environment.json`

Empfohlene Reihenfolge:

1. `System / Health`
2. `System / Meta`
3. `Auth / Login GF`
4. `System / Reset Demo-Daten`
5. `Auth / Current User`
6. `API-Berechtigungen / Logout fuer 401-Test`
7. `API-Berechtigungen / Session ohne Login`
8. `API-Berechtigungen / Kunden ohne Login verboten`
9. `API-Berechtigungen / Kunden bearbeiten ohne Login verboten`
10. `API-Berechtigungen / Login Lager`
11. `API-Berechtigungen / Session als Lager`
12. `API-Berechtigungen / Kunden als Lager verboten`
13. `API-Berechtigungen / Kunden bearbeiten als Lager verboten`
14. `API-Berechtigungen / Lieferanten als Lager erlaubt`
15. `API-Berechtigungen / Lieferanten bearbeiten als Lager erlaubt`
16. `API-Berechtigungen / Reset als Lager verboten`
17. `API-Berechtigungen / Login GF fuer Berechtigungstest`
18. `API-Berechtigungen / Session als GF`
19. `API-Berechtigungen / Kunden als GF erlaubt`
20. `API-Berechtigungen / Kunden bearbeiten als GF erlaubt`
21. `API-Berechtigungen / Reset als GF erlaubt`
22. `Kundenkorrespondenz / Liste Kundenanfragen`
23. `Kundenkorrespondenz / Neue Kundenanfrage anlegen`
24. `Kundenkorrespondenz / Nachricht zu Vorgang anlegen`
25. `Kundenkorrespondenz / Neues Angebot zum Vorgang anlegen`
26. `Kundenkorrespondenz / Angebot auf wartet auf Antwort setzen`
27. `Kundenkorrespondenz / Kundenanfrage als beantwortet markieren`

Hinweise:

- Die Sammlung verwendet standardmaessig `gf / gf`.
- Fuer die Rollen-Tests sind zusaetzlich `lager / lager` als Environment-Variablen hinterlegt.
- Das Environment setzt `baseUrl` auf `http://localhost:5000/api`.
- Tabellen- und CRUD-Requests nutzen `dbBaseUrl` mit `http://localhost:5000/api/datenbanken`.
- Postman speichert die Session-Cookies nach dem Login automatisch im Cookie Jar.
- IDs wie `anfrageId`, `vorgangId` und `angebotId` werden von den Tests automatisch aus Antworten in Environment-Variablen geschrieben.
- Die Datumsvariablen `requestDate`, `requestDateCompact` und `requestTimestamp` werden vor jedem Request automatisch gesetzt.

Die neuen Berechtigungs-Tests pruefen gezielt diese Faelle:

- `401`, wenn kein Benutzer angemeldet ist.
- `401`, wenn ohne Anmeldung ein Datensatz bearbeitet werden soll.
- `403`, wenn ein angemeldeter Benutzer nicht die passende Rolle hat.
- `403`, wenn ein angemeldeter Benutzer eine geschuetzte Bearbeitung ausfuehren will.
- `200`, wenn der Benutzer die benoetigte Berechtigung besitzt.
- `200`, wenn eine erlaubte Bearbeitung erfolgreich gespeichert wird.
- `403` auf `POST /reset` fuer normale Benutzer.
- `200` auf `POST /reset` fuer die Geschaeftsfuehrung.
- `GET /auth/me` zur Kontrolle, welche Session in Postman gerade aktiv ist.

Wenn du weitere Bereiche automatisieren willst, ist der gleiche Stil auch fuer `angebote`, `auftraege`, `vertriebsdokumente`, `zahlungen` und `freigaben` geeignet.

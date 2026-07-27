# SQL-Schema-Uebersicht

Diese Uebersicht fasst die aktuell im Mockup verwendeten Tabellen in Tabellenform zusammen.  
Beziehungen stehen direkt bei den Feldern in Klammern, zum Beispiel `kunde_id (kunden)`.

Fuer das aktuelle vereinfachte Mockup-Modell des Vertriebsprozesses siehe auch [Auftragsmodell-Verkaufsprozess.md](docs/Auftragsmodell-Verkaufsprozess.md).

## Hinweise

| Thema | Hinweis |
|---|---|
| Quelle | Die Liste orientiert sich an den aktiven Mock-Daten und den genutzten Modulen. |
| Beziehungen | Einige Verknuepfungen sind im Mockup noch als Freitext oder Nummernlogik vorhanden und sollten spaeter echte Fremdschluessel werden. |
| Positionen | Angebots-, Auftrags- und Bestellpositionen liegen aktuell noch in Arrays und sollten spaeter in eigene Tabellen ausgelagert werden. |
| Benutzer | `benutzer` und `users` sollten spaeter zu einer gemeinsamen SQL-Tabelle zusammengefuehrt werden. |

---

## 1. Stammdaten

| Tabelle | Zweck | Wichtige Felder | Hinweise |
|---|---|---|---|
| `kunden` | Kundenstammdaten fuer Verkauf und Buchhaltung | <ul><li>`id`</li><li>`kunden_nr`</li><li>`firma`</li><li>`anschrift`</li><li>`plz`</li><li>`ort`</li><li>`segment`</li><li>`website`</li><li>`notiz`</li></ul> | `optionen` ist aktuell eine Liste und sollte spaeter normalisiert oder als JSON gespeichert werden. |
| `lieferanten` | Lieferantenstammdaten fuer Einkauf | <ul><li>`id`</li><li>`lieferanten_nr`</li><li>`firma`</li><li>`anschrift`</li><li>`plz`</li><li>`ort`</li><li>`segment`</li><li>`fuer_bts`</li><li>`bewertung`</li><li>`favorit`</li></ul> | Bewertungs- und Favoritenlogik ist schon im Mockup vorhanden. |
| `artikel` | Produkt- und Komponentenstamm | <ul><li>`id`</li><li>`artikel_nr`</li><li>`name`</li><li>`kategorie`</li><li>`artikel_typ`</li><li>`einkaufspreis`</li><li>`verkaufspreis`</li><li>`bestand`</li><li>`beschreibung`</li></ul> | Stuecklisten liegen aktuell noch im Feld `komponenten` und sollten spaeter in `artikel_stueckliste` ausgelagert werden. |
| `services` | Servicestamm fuer Angebote und Auftraege | <ul><li>`id`</li><li>`service_nr`</li><li>`name`</li><li>`kategorie`</li><li>`einkaufspreis`</li><li>`verkaufspreis`</li><li>`beschreibung`</li></ul> | Services werden fachlich getrennt von Artikeln gepflegt. |
| `lager` | Lagerstandorte | <ul><li>`id`</li><li>`name`</li><li>`standort`</li><li>`kapazitaet`</li></ul> | Aktuell gibt es noch keine echte Lagerbestands-Tabelle pro Lager. |

---

## 2. Verkauf

| Tabelle | Zweck | Wichtige Felder | Hinweise |
|---|---|---|---|
| `kundenanfragen` | Erfassung eingehender Kundenanfragen | <ul><li>`id`</li><li>`typ`</li><li>`kunde_id (kunden)`</li><li>`angebot_id (angebote)`</li><li>`kanal`</li><li>`status`</li><li>`datum`</li><li>`anliegen`</li></ul> | Dient als Einstieg in den Vertriebsprozess. |
| `angebote` | Verkaufsangebote | <ul><li>`id`</li><li>`angebots_nr`</li><li>`anfrage_id (kundenanfragen)`</li><li>`kunde_id (kunden)`</li><li>`datum`</li><li>`status`</li></ul> | Positionen liegen aktuell noch als Array im Datensatz. |
| `auftraege` | Bestaetigte Verkaufsauftraege | <ul><li>`id`</li><li>`auftrag_nr`</li><li>`kunde_id (kunden)`</li><li>`angebot_id (angebote)`</li><li>`datum`</li><li>`status`</li><li>`faellig_am`</li></ul> | Zentrale Verkaufstabelle. Rechnungsansicht und Zahlungsbezug werden im Mockup aus dem Auftragsstatus abgeleitet. |
| `vertriebsdokumente` | Auftragsbestaetigung, Begleitdokumente und Unterrichtsbelege | <ul><li>`id`</li><li>`auftrag_id (auftraege)`</li><li>`auftrag_nr`</li><li>`kunde_id (kunden)`</li><li>`dokument_typ`</li><li>`titel`</li><li>`datum`</li><li>`status`</li><li>`versendet_am`</li><li>`notiz`</li></ul> | Im aktuellen Mockup nicht die fachliche Hauptquelle fuer Liefer- oder Rechnungslogik. |
| `versandauftraege` | Versandvorgaenge zu Auftraegen | <ul><li>`id`</li><li>`versand_nr`</li><li>`auftrag_id (auftraege)`</li><li>`datum`</li><li>`status`</li><li>`transport`</li></ul> | Im Mockup bereits mit Prozessreihenfolge verbunden. |
| `reklamationen` | Reklamationen aus Vertrieb und Service | <ul><li>`id`</li><li>`reklamations_nr`</li><li>`kunde_id (kunden)`</li><li>`datum`</li><li>`beschreibung`</li><li>`status`</li></ul> | Spaeter optional mit `auftrag_id (auftraege)` erweiterbar. |
| `retouren` | Retourenprozess in Logistik und Service | <ul><li>`id`</li><li>`retouren_nr`</li><li>`kunde`</li><li>`artikel`</li><li>`datum`</li><li>`status`</li><li>`grund`</li></ul> | Kunde und Artikel sind aktuell noch Freitext; spaeter besser `kunde_id (kunden)` und optional `artikel_id (artikel)`. |

---

## 3. Einkauf

| Tabelle | Zweck | Wichtige Felder | Hinweise |
|---|---|---|---|
| `bestellungen` | Einkaufsbestellungen an Lieferanten | <ul><li>`id`</li><li>`bestell_nr`</li><li>`lieferant_id (lieferanten)`</li><li>`datum`</li><li>`status`</li><li>`wareneingang_am`</li></ul> | Positionen liegen aktuell noch als Array vor. |
| `einkaufsdokumente` | Bedarfsmeldung, Anfrage, Bestellung, Warenannahmeprotokoll | <ul><li>`id`</li><li>`bestellung_id (bestellungen)`</li><li>`bestell_nr`</li><li>`lieferant_id (lieferanten)`</li><li>`dokument_typ`</li><li>`titel`</li><li>`datum`</li><li>`status`</li><li>`versendet_am`</li><li>`notiz`</li></ul> | Im Mockup schon mit Einkaufskette und Wareneingang verknuepft. |

---

## 4. Buchhaltung

| Tabelle | Zweck | Wichtige Felder | Hinweise |
|---|---|---|---|
| `rechnungen` | Abgeleitete Sicht im Mockup, keine eigenstaendige Kerntabelle mehr | <ul><li>`rechnungs_nr`</li><li>`auftrag_id (auftraege)`</li><li>`kunde_id (kunden)`</li><li>`datum`</li><li>`faellig_am`</li><li>`betrag`</li><li>`status`</li></ul> | Die Rechnungsansicht wird aus Auftraegen mit geeigneten Statuswerten abgeleitet. |
| `zahlungen` | Zahlungseingaenge und -ausgaenge | <ul><li>`id`</li><li>`auftrag_id (auftraege)`</li><li>`auftrag_nr`</li><li>`rechnungs_nr`</li><li>`zahlungsart`</li><li>`kunde`</li><li>`datum`</li><li>`betrag`</li><li>`methode`</li></ul> | Im Mockup fachlich ueber den Auftrag verbunden. |
| `mahnungen` | Mahnvorgaenge zu abgerechneten Auftraegen | <ul><li>`id`</li><li>`auftrag_id (auftraege)`</li><li>`auftrag_nr`</li><li>`rechnungs_nr`</li><li>`kunde`</li><li>`datum`</li><li>`status`</li><li>`stufe`</li></ul> | Im Mockup fachlich ueber den Auftrag verbunden. |
| `belege` | Beleg- und Dokumentenarchiv | <ul><li>`id`</li><li>`typ`</li><li>`bezug_typ`</li><li>`bezug`</li><li>`datum`</li><li>`status`</li><li>`beschreibung`</li></ul> | Kann spaeter polymorph bleiben oder spezialisiert werden. |
| `firmenkonto` | Vereinfachte Kontobewegungen fuer Schulungszwecke | <ul><li>`id`</li><li>`datum`</li><li>`betreff`</li><li>`info`</li><li>`soll`</li><li>`haben`</li><li>`saldo`</li></ul> | Rein didaktische Buchungstabelle. |

---

## 5. Personal

| Tabelle | Zweck | Wichtige Felder | Hinweise |
|---|---|---|---|
| `bewerber` | Bewerberverwaltung | <ul><li>`id`</li><li>`name`</li><li>`stelle`</li><li>`datum`</li><li>`status`</li><li>`notiz`</li></ul> | Aktuell noch ohne eigene Gespraechs- oder Terminrelation. |
| `mitarbeiter` | Mitarbeiterstammdaten | <ul><li>`id`</li><li>`name`</li><li>`abteilung`</li><li>`rolle`</li><li>`eintritt`</li><li>`status`</li></ul> | Zentrale Personaltabelle; wird von Arbeitszeiten, Urlaub, Krankmeldungen und Personalakten referenziert. |
| `arbeitszeiten` | Zeiterfassung | <ul><li>`id`</li><li>`mitarbeiter_id (mitarbeiter)`</li><li>`datum`</li><li>`von`</li><li>`bis`</li><li>`status`</li></ul> | Eignet sich spaeter fuer Freigabelogik. |
| `urlaubsantraege` | Urlaubsverwaltung | <ul><li>`id`</li><li>`mitarbeiter_id (mitarbeiter)`</li><li>`von`</li><li>`bis`</li><li>`tage`</li><li>`status`</li></ul> | Bereits als einfacher Genehmigungsprozess im Mockup vorhanden. |
| `krankmeldungen` | Krankmeldungen | <ul><li>`id`</li><li>`mitarbeiter_id (mitarbeiter)`</li><li>`von`</li><li>`bis`</li><li>`grund`</li><li>`status`</li></ul> | Mit Personalakte verbunden. |
| `schulungen` | Schulungsplanung | <ul><li>`id`</li><li>`titel`</li><li>`zielgruppe`</li><li>`datum`</li><li>`status`</li><li>`ort`</li></ul> | Teilnehmer sind aktuell noch nicht normalisiert. |
| `personalakten` | Dokumente und Formulare je Mitarbeiter | <ul><li>`id`</li><li>`mitarbeiter_id (mitarbeiter)`</li><li>`dokument_typ`</li><li>`titel`</li><li>`datum`</li><li>`status`</li><li>`notiz`</li></ul> | Gute Grundlage fuer spaetere Personal-Dokumentenlogik. |

---

## 6. Organisation und Steuerung

| Tabelle | Zweck | Wichtige Felder | Hinweise |
|---|---|---|---|
| `marketingaktionen` | Kampagnen, Newsletter, Events, Feedback | <ul><li>`id`</li><li>`typ`</li><li>`titel`</li><li>`datum`</li><li>`status`</li><li>`beschreibung`</li></ul> | Im Mockup eher einfach gehalten. |
| `abteilungen` | Organisationsstruktur | <ul><li>`id`</li><li>`kuerzel`</li><li>`name`</li><li>`zuordnung`</li></ul> | `aufgaben` ist aktuell eine Liste und sollte spaeter ausgelagert oder als JSON gespeichert werden. |
| `freigaben` | Freigabe- und Entscheidungsprozesse | <ul><li>`id`</li><li>`titel`</li><li>`bereich`</li><li>`status`</li><li>`verantwortung`</li><li>`datum`</li><li>`bezug`</li><li>`notiz`</li></ul> | Aktuell noch bereichsbezogen und frei formuliert. |
| `berichte` | Management- und Unterrichtsberichte | <ul><li>`id`</li><li>`titel`</li><li>`bereich`</li><li>`datum`</li><li>`status`</li><li>`zusammenfassung`</li><li>`zielgruppe`</li><li>`empfohlen_aktion`</li></ul> | Kann spaeter optional auf andere Tabellen referenzieren. |

---

## 7. Benutzer und Rechte

| Tabelle | Zweck | Wichtige Felder | Hinweise |
|---|---|---|---|
| `benutzer` | Frontend-Benutzerverwaltung | <ul><li>`id`</li><li>`username`</li><li>`email`</li><li>`password`</li><li>`rolle`</li></ul> | Sollte im SQL-Schema die zentrale Benutzertabelle werden; spaeter besser `rolle_id (rollen)`. |
| `rollen` | Rollendefinitionen | <ul><li>`id`</li><li>`name`</li><li>`beschreibung`</li></ul> | `permissions` ist aktuell noch eine Liste. |
| `rechte` | Einzelrechte | <ul><li>`id`</li><li>`name`</li><li>`beschreibung`</li></ul> | Grundlage fuer Rollenmodell. |
| `users` | Altes/paralleles Auth-Modell | <ul><li>`id`</li><li>`username`</li><li>`password`</li><li>`name`</li></ul> | Sollte mit `benutzer` zusammengefuehrt werden. |

---

## 8. Empfohlene neue SQL-Tabellen

| Tabelle | Zweck | Wichtige Felder | Hinweise |
|---|---|---|---|
| `angebotspositionen` | Positionen zu Angeboten | <ul><li>`id`</li><li>`angebot_id (angebote)`</li><li>`artikel_id (artikel)`</li><li>`service_id (services)`</li><li>`bezeichnung`</li><li>`menge`</li><li>`einzelpreis`</li></ul> | Sollte das aktuelle Positions-Array in `angebote` ersetzen. Entweder `artikel_id` oder `service_id` ist gefuellt. |
| `auftragspositionen` | Positionen zu Auftraegen | <ul><li>`id`</li><li>`auftrag_id (auftraege)`</li><li>`artikel_id (artikel)`</li><li>`service_id (services)`</li><li>`bezeichnung`</li><li>`menge`</li><li>`einzelpreis`</li></ul> | Sollte das aktuelle Positions-Array in `auftraege` ersetzen. Entweder `artikel_id` oder `service_id` ist gefuellt. |
| `bestellpositionen` | Positionen zu Bestellungen | <ul><li>`id`</li><li>`bestellung_id (bestellungen)`</li><li>`artikel_id (artikel)`</li><li>`bezeichnung`</li><li>`menge`</li><li>`einstandspreis`</li></ul> | Sollte das aktuelle Positions-Array in `bestellungen` ersetzen. |
| `artikel_stueckliste` | Komponenten einer Baugruppe | <ul><li>`id`</li><li>`hauptartikel_id (artikel)`</li><li>`komponentenartikel_id (artikel)`</li><li>`menge`</li></ul> | Ersetzt das Feld `komponenten` in `artikel`. |
| `rollen_rechte` | Zuordnung Rollen zu Rechten | <ul><li>`rolle_id (rollen)`</li><li>`recht_id (rechte)`</li></ul> | Klassische m:n-Tabelle. |
| `lagerbestaende` | Bestand je Lager und Artikel | <ul><li>`id`</li><li>`lager_id (lager)`</li><li>`artikel_id (artikel)`</li><li>`bestand`</li></ul> | Optional, aber fachlich sinnvoll fuer spaeter. |
| `schulung_teilnehmer` | Teilnehmer je Schulung | <ul><li>`id`</li><li>`schulung_id (schulungen)`</li><li>`mitarbeiter_id (mitarbeiter)`</li></ul> | Optional fuer spaetere Personalerweiterung. |

---

## 9. Empfohlene Einfuehrungsreihenfolge

| Schritt | Bereich | Tabellen |
|---|---|---|
| 1 | Stammdaten | `kunden`, `lieferanten`, `artikel`, `services`, `mitarbeiter` |
| 2 | Kerngeschaeft | `angebote`, `auftraege`, `bestellungen` |
| 3 | Positionsdaten | `angebotspositionen`, `auftragspositionen`, `bestellpositionen` |
| 4 | Folgeprozesse | `vertriebsdokumente`, `versandauftraege`, `einkaufsdokumente` |
| 5 | Buchhaltung | `zahlungen`, `mahnungen`, `belege`, `firmenkonto` |
| 6 | Personal und Zusatzmodule | `bewerber`, `arbeitszeiten`, `urlaubsantraege`, `krankmeldungen`, `schulungen`, `personalakten` |
| 7 | Organisation und Rechte | `rollen`, `rechte`, `rollen_rechte`, `benutzer` |

---

## 10. Wichtige Bereinigung vor SQL

| Thema | Empfohlene Bereinigung |
|---|---|
| Benutzer | `benutzer` und `users` zusammenfuehren |
| Positionen | Arrays aus `angebote`, `auftraege`, `bestellungen` in eigene Positions-Tabellen auslagern |
| Stuecklisten | `komponenten` aus `artikel` in `artikel_stueckliste` ueberfuehren |
| Fremdschluessel | Freitextfelder wie `kunde`, `lieferant`, `rechnungs_nr`, `bestellNr` soweit moeglich durch IDs ersetzen |
| Statuswerte | Statuslogik fuer Angebot, Auftrag, Bestellung und Versand zentralisieren; im Mockup wird die Rechnung daraus abgeleitet |



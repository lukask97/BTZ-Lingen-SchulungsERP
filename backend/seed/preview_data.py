PREVIEW_DATA = {
    "benutzer": [
        {
            "id": 1,
            "username": "admin",
            "email": "admin@test.de",
            "password": "admin",
            "name": "Admin Demo",
            "rolle": "Admin",
            "permissions": ["*"]
        },
        {
            "id": 2,
            "username": "verkauf",
            "email": "verkauf@test.de",
            "password": "verkauf",
            "name": "Verkauf Demo",
            "rolle": "Verkauf"
        },
        {
            "id": 3,
            "username": "gf",
            "email": "gf@test.de",
            "password": "gf",
            "name": "Lehrkraft Demo",
            "rolle": "Geschäftsführung"
        }
    ],
    "rollen": [
        {"id": 1, "name": "Admin", "beschreibung": "Vollzugriff"},
        {"id": 2, "name": "Verkauf", "beschreibung": "Verkauf"},
        {"id": 3, "name": "Geschäftsführung", "beschreibung": "Lehrkraft"}
    ],
    "rechte": [
        {"id": 1, "name": "*", "beschreibung": "Vollzugriff"},
        {"id": 2, "name": "verkauf.anzeigen", "beschreibung": "Verkauf anzeigen"},
        {"id": 3, "name": "verkauf.bearbeiten", "beschreibung": "Verkauf bearbeiten"},
        {"id": 4, "name": "kunde", "beschreibung": "Kundenzugriff"},
        {"id": 5, "name": "gf", "beschreibung": "Geschäftsführung"},
        {"id": 6, "name": "buchhaltung.anzeigen", "beschreibung": "Buchhaltung anzeigen"}
    ],
    "rollenRechte": [
        {"id": 1, "rolleId": 1, "rolleName": "Admin", "rechtName": "*"},
        {"id": 2, "rolleId": 2, "rolleName": "Verkauf", "rechtName": "verkauf.anzeigen"},
        {"id": 3, "rolleId": 2, "rolleName": "Verkauf", "rechtName": "verkauf.bearbeiten"},
        {"id": 4, "rolleId": 2, "rolleName": "Verkauf", "rechtName": "kunde"},
        {"id": 5, "rolleId": 3, "rolleName": "Geschäftsführung", "rechtName": "gf"},
        {"id": 6, "rolleId": 3, "rolleName": "Geschäftsführung", "rechtName": "verkauf.anzeigen"},
        {"id": 7, "rolleId": 3, "rolleName": "Geschäftsführung", "rechtName": "buchhaltung.anzeigen"}
    ],
    "kunden": [
        {
            "id": 1,
            "kundenNr": "K-1001",
            "firma": "Mueller GmbH",
            "ort": "Berlin",
            "segment": "B2B"
        },
        {
            "id": 2,
            "kundenNr": "K-1002",
            "firma": "Meier AG",
            "ort": "Leipzig",
            "segment": "Service"
        }
    ],
    "kundenanfragen": [
        {
            "id": 1,
            "kundeId": 1,
            "kunde": "Mueller GmbH",
            "typ": "Angebotswunsch",
            "kanal": "E-Mail",
            "status": "offen",
            "datum": "2026-07-30",
            "anliegen": "Bitte ein Angebot fuer 20 Sicherheitsjacken erstellen.",
            "vorgangId": "anfrage-1",
            "angebotId": "",
            "auftragId": ""
        }
    ],
    "angebote": [
        {
            "id": 1,
            "angebotsNr": "ANG-2026-001.0",
            "angebotsBasisNr": "ANG-2026-001",
            "revision": 0,
            "vorgangId": "anfrage-1",
            "anfrageId": 1,
            "kundeId": 1,
            "kunde": "Mueller GmbH",
            "datum": "2026-07-30",
            "gueltigBis": "2026-08-13",
            "status": "in Vorbereitung",
            "gesamtbetrag": 1190,
            "positionen": [
                {
                    "artikel": "Sicherheitsjacke",
                    "menge": 20,
                    "einzelpreis": 59.5
                }
            ]
        }
    ],
    "lehrkraftOptionen": [
        {
            "id": 1,
            "autoLieferannahmeNach1Tag": False,
            "autoDebitorenzahlungNach1Tag": False,
            "debitorenzahlungRegeln": [
                {"id": "regel-1", "startTag": 0, "endTag": 0, "gewichtung": 1},
                {"id": "regel-2", "startTag": 3, "endTag": 14, "gewichtung": 35},
                {"id": "regel-3", "startTag": 15, "endTag": 28, "gewichtung": 61},
                {"id": "regel-4", "startTag": 29, "endTag": 42, "gewichtung": 2},
                {"id": "regel-5", "startTag": 43, "endTag": 56, "gewichtung": 1}
            ]
        }
    ],
    "fristenOptionen": [
        {
            "id": 1,
            "skontoTage": 7,
            "skontoProzent": 2,
            "zahlungszielTage": 14,
            "zahlungserinnerungTage": 3,
            "mahnung1AbTage": 1,
            "mahnung2AbTage": 8,
            "inkassoAbTage": 22
        }
    ],
    "unternehmen": [
        {
            "id": 1,
            "firmenname": "UEF Lin",
            "branche": "Gross- & Einzelhandel Sport, Freizeit, Rad",
            "steuernummer": "88 888 89480",
            "ustIdNr": "DE194227226",
            "handelsregisterNr": "HRB 5985",
            "betriebsNr": "11129381",
            "unternehmerNr": "",
            "strasse": "Schwarzer Weg 16",
            "plzOrt": "49809 Lingen (Ems)",
            "bundesland": "Niedersachsen",
            "telefon": "0591-97304-58",
            "mail": "de01BTS@zuef-edu.de",
            "unternehmensNr": "123456789123 001",
            "amtsgericht": "Lingen (EMS)",
            "finanzamtNr": "",
            "firmaKontoname": "UEF Lin",
            "firmaBankName": "Ruhrtal-Bank",
            "firmaIban": "DE36360440810021070851",
            "firmaKontoNr": "210 708 51",
            "firmaBic": "RUHRDEE0",
            "firmaBlz": "360 440 81",
            "verkaufKontoname": "UEF Lin-VK",
            "verkaufBankName": "Ruhrtal-Bank",
            "verkaufIban": "DE36360440810021070852",
            "verkaufKontoNr": "210 708 52",
            "verkaufBic": "RUHRDEE0",
            "verkaufBlz": "360 440 81",
            "einkaufKontoname": "UEF Lin-EK",
            "einkaufBankName": "Ruhrtal-Bank",
            "einkaufIban": "DE36360440810021070853",
            "einkaufKontoNr": "210 708 53",
            "einkaufBic": "RUHRDEE0",
            "einkaufBlz": "360 440 81"
        }
    ],
    "nummernkreise": [
        {"id": 1, "schluessel": "angebot", "bezeichnung": "Angebot", "kuerzel": "ANG"},
        {"id": 2, "schluessel": "auftrag", "bezeichnung": "Auftrag", "kuerzel": "AU"},
        {"id": 3, "schluessel": "rechnung", "bezeichnung": "Rechnung", "kuerzel": "RG"},
        {"id": 4, "schluessel": "lieferschein", "bezeichnung": "Lieferschein", "kuerzel": "LS"},
        {"id": 5, "schluessel": "bestellung", "bezeichnung": "Bestellung", "kuerzel": "EK"},
        {"id": 6, "schluessel": "gutschrift", "bezeichnung": "Gutschrift", "kuerzel": "GS"},
        {"id": 7, "schluessel": "mahnung", "bezeichnung": "Mahnung", "kuerzel": "MH"},
        {"id": 8, "schluessel": "zahlung", "bezeichnung": "Zahlung", "kuerzel": "ZA"}
    ],
    "auftraege": [],
    "lieferantenArtikelStaffeln": [],
    "vertriebsdokumente": [],
    "rechnungen": [],
    "zahlungen": [],
    "mahnungen": []
}

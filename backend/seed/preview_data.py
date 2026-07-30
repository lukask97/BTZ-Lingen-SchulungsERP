PREVIEW_DATA = {
    "benutzer": [
        {
            "id": 1,
            "username": "admin",
            "email": "admin@test.de",
            "password": "admin",
            "name": "Admin Demo",
            "rolle": "admin",
            "permissions": ["*"]
        },
        {
            "id": 2,
            "username": "verkauf",
            "email": "verkauf@test.de",
            "password": "verkauf",
            "name": "Verkauf Demo",
            "rolle": "verkauf",
            "permissions": [
                "verkauf.anzeigen",
                "verkauf.bearbeiten",
                "kunde"
            ]
        },
        {
            "id": 3,
            "username": "gf",
            "email": "gf@test.de",
            "password": "gf",
            "name": "Lehrkraft Demo",
            "rolle": "gf",
            "permissions": [
                "gf",
                "verkauf.anzeigen",
                "buchhaltung.anzeigen"
            ]
        }
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
    "auftraege": [],
    "vertriebsdokumente": [],
    "rechnungen": [],
    "zahlungen": [],
    "mahnungen": []
}

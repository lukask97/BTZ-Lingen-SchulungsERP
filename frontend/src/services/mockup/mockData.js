// Zentrale Testdaten
// Nur im Arbeitsspeicher


export let kunden = [

    {
        id: 1,
        kundenNr: "DB10001",
        firma: "Campus Baumarkt GmbH",
        anschrift: "Industriestraße 3",
        plz: "49809",
        ort: "Lingen",
        segment: "Baumarkt",

        optionen: ["Fahrradbekleidung", "Sicherheitsbekleidung", "Sonderfahrräder", "Lastenbikes"],
        notiz:"",
        aktiv: true
    },


    {
        id: 2,
        kundenNr: "DB10002",
        firma: "Emsland Tourismus GmbH",
        anschrift: "Helter Damm 11a",
        plz: "49716",
        ort: "Meppen",
        segment: "Tourismus",

        optionen: ["Bikes aller Art", "Leasing", "Reparatur Service"],

        website: "https://www.emsland.com/",
        notiz:"",
        aktiv: true
    }

];


export let artikel = [

    {
        id: 1, artikelNr: "ART001", name: "Lastenrad Premium", kategorie: "Fahrräder", preis: 3499, bestand: 5, beschreibung: "Hochwertiges Lastenrad für den Transport", aktiv: true
    },


    {
        id: 2, artikelNr: "ART002", name: "Sicherheitsjacke", kategorie: "Bekleidung", preis: 89.90, bestand: 120, beschreibung: "Reflektierende Sicherheitsjacke", aktiv: true
    },

    {
        id: 3, artikelNr: "ART003", name: "Fahrradhelm", kategorie: "Zubehör", preis: 59.99, bestand: 45, beschreibung: "Sicherer Fahrradhelm mit Zertifikat", aktiv: true
    }

];

export let benutzer = [

    {
        id: 1, username: "admin", email: "admin@test.de", password: "admin", rolle: "Admin", aktiv: true
    },

    {
        id: 2, username: "lager", email: "lager@test.de", password: "lager", rolle: "Lager", aktiv: true
    },

    {
        id: 3, username: "buchhaltung", email: "buchhaltung@test.de", password: "buchhaltung", rolle: "Buchhaltung", aktiv: true
    }

];

export let rollen = [

    {
        id: 1, 
        name: "Admin", 
        beschreibung: "Vollständiger Zugriff auf alle Funktionen",
        permissions: ["*"],
        aktiv: true
    },

    {
        id: 2,
        name: "Lager",
        beschreibung: "Verwaltung des Lagers und Bestände",
        permissions: [
            "artikel.anlegen", "artikel.bearbeiten", "artikel.anzeigen",
            "lager.anlegen", "lager.bearbeiten", "lager.anzeigen"
        ],
        aktiv: true
    },

    {
        id: 3,
        name: "Buchhaltung",
        beschreibung: "Verwaltung von Rechnungen und Kundenkonten",
        permissions: [
            "kunde.anlegen", "kunde.bearbeiten", "kunde.anzeigen",
            "rechnung.anlegen", "rechnung.bearbeiten", "rechnung.anzeigen"
        ],
        aktiv: true
    }

];

export let rechte = [

    {
        id: 1, name: "kunde.anlegen", beschreibung: "Neue Kunden erstellen", aktiv: true
    },

    {
        id: 2, name: "kunde.bearbeiten", beschreibung: "Kundendaten bearbeiten", aktiv: true
    },

    {
        id: 3, name: "artikel.anlegen", beschreibung: "Neue Artikel erstellen", aktiv: true
    },

    {
        id: 4, name: "artikel.bearbeiten", beschreibung: "Artikeldaten bearbeiten", aktiv: true
    },

    {
        id: 5, name: "rechnung.anlegen", beschreibung: "Neue Rechnungen erstellen", aktiv: true
    },

    {
        id: 6, name: "rechnung.bearbeiten", beschreibung: "Rechnungen bearbeiten", aktiv: true
    }

];

export let lager = [

    {
        id: 1, name: "Hauptlager", standort: "Lingen, Industriestraße 3", kapazitaet: 5000, aktiv: true
    },

    {
        id: 2, name: "Außenlager", standort: "Meppen, Gewerbepark Nord", kapazitaet: 2000, aktiv: true
    }

];

export let rechnungen = [

    {
        id: 1, 
        rechnungsnr: "RE-2024-001", 
        kunde: "Campus Baumarkt GmbH",
        datum: "2024-01-15",
        betrag: 1250.50,
        status: "bezahlt",
        aktiv: true
    },

    {
        id: 2,
        rechnungsnr: "RE-2024-002",
        kunde: "Emsland Tourismus GmbH",
        datum: "2024-01-20",
        betrag: 3499.00,
        status: "offen",
        aktiv: true
    },

    {
        id: 3,
        rechnungsnr: "RE-2024-003",
        kunde: "Campus Baumarkt GmbH",
        datum: "2024-01-25",
        betrag: 599.99,
        status: "offen",
        aktiv: true
    }

];

export let users = [

    {
        id: 1, username: "admin", password: "admin", name: "Administrator", permissions: ["*"]
    },


    {
        id: 2,
        username: "lager",
        password: "lager",
        name: "Lager Mitarbeiter",
        permissions: ["artikel.lesen", "lager.buchen"]
    },


    {
        id: 3,
        username: "buchhaltung",
        password: "buchhaltung",
        name: "Buchhaltung",
        permissions: ["kunde.lesen", "kunde.anlegen", "rechnung.lesen", "rechnung.erstellen"]
    }

];
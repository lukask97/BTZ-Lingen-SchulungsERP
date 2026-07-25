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
    },
    {
        id: 4, username: "marketing", email: "marketing@test.de", password: "marketing", rolle: "Marketing", aktiv: true
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
        permissions: ["artikel.lesen", "lager.buchen", "einkauf.lesen"]
    },


    {
        id: 3,
        username: "buchhaltung",
        password: "buchhaltung",
        name: "Buchhaltung",
        permissions: ["kunde.lesen", "kunde.anlegen", "rechnung.lesen", "rechnung.anlegen", "rechnung.bearbeiten", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten", "organisation.lesen", "buchhaltung.lesen"]
    },
    {
        id: 4,
        username: "marketing",
        password: "marketing",
        name: "Marketing Mitarbeiter",
        permissions: ["marketing.lesen", "marketing.bearbeiten"]
    }

];

// Lieferanten und Bestellungen bilden den bewusst einfachen Einkaufskreislauf
// ab: Bestellung -> Wareneingang -> erhöhter Artikelbestand.
export let lieferanten = [
    {
        id: 1,
        lieferantenNr: "KR10001",
        firma: "Weber GmbH",
        anschrift: "Max-Weber Str. 2",
        plz: "49716",
        ort: "Meppen",
        segment: "Fahrradbekleidung, Sicherheitsbekleidung, Sonderfahrräder, Lastenbikes",
        fuerBts: "Alternativlieferant für Zubehör und Lastenbikes",
        bewertung: 4,
        aktiv: true
    },
    {
        id: 2,
        lieferantenNr: "KR10002",
        firma: "Kalkhoff Werke GmbH",
        anschrift: "Europa-Allee 26",
        plz: "49685",
        ort: "Emstek",
        segment: "Fahrradwerk, Fahrradzubehör, Einzelteile, Service",
        fuerBts: "",
        bewertung: 5,
        aktiv: true
    },
    {
        id: 3,
        lieferantenNr: "KR10003",
        firma: "Meister Handels GmbH",
        anschrift: "Industriestraße 9",
        plz: "",
        ort: "",
        segment: "",
        fuerBts: "",
        bewertung: 3,
        aktiv: true
    },
    {
        id: 4,
        lieferantenNr: "KR10004",
        firma: "Campus Sonderbaumarkt GmbH",
        anschrift: "Industriestraße 9",
        plz: "49809",
        ort: "Lingen",
        segment: "Klassischer Baumarkt mit Fahrradabteilung",
        fuerBts: "Soll Lieferant sein und Kunde",
        bewertung: 3,
        aktiv: true
    }
];

export let bestellungen = [
    {
        id: 1,
        bestellNr: "EK-2026-001",
        lieferantId: 1,
        lieferant: "Weber GmbH",
        datum: "2026-07-20",
        status: "offen",
        positionen: [{ artikelId: 1, artikel: "Lastenrad Premium", menge: 3 }]
    }
];

// Der Verkaufskreislauf bleibt ebenso kompakt: Angebot -> Auftrag.
export let angebote = [
    {
        id: 1,
        angebotsNr: "ANG-2026-001",
        kundeId: 1,
        kunde: "Campus Baumarkt GmbH",
        datum: "2026-07-22",
        status: "offen",
        positionen: [{ artikelId: 2, artikel: "Sicherheitsjacke", menge: 15, einzelpreis: 89.9 }]
    }
];

export let auftraege = [];

export let reklamationen = [
    {
        id: 1,
        reklamationsNr: "REK-2026-001",
        kundeId: 2,
        kunde: "Emsland Tourismus GmbH",
        datum: "2026-07-24",
        beschreibung: "Ein Fahrradhelm wurde beschädigt geliefert.",
        status: "neu"
    }
];

export let marketingaktionen = [
    { id: 1, typ: "Kampagne", titel: "Sommeraktion Lastenbikes", datum: "2026-08-01", status: "geplant", beschreibung: "Regionale Kampagne für Lastenbikes und Zubehör." },
    { id: 2, typ: "Newsletter", titel: "Newsletter August", datum: "2026-08-05", status: "Entwurf", beschreibung: "Neue Fahrräder, Serviceangebote und Termine." }
];

export let abteilungen = [
    { id: 1, kuerzel: "BU", name: "Buchhaltung", zuordnung: "A – Bürowesen", aufgaben: ["Überweisungen", "Lohn und Gehalt", "Bankübersicht"] },
    { id: 2, kuerzel: "MW-EK", name: "Einkauf", zuordnung: "B – Materialwirtschaft", aufgaben: ["EK-Rechnungsprüfung", "Wareneingang"] },
    { id: 3, kuerzel: "MW-VK", name: "Verkauf", zuordnung: "C – Materialwirtschaft", aufgaben: ["Lieferscheine", "Auftragsbearbeitung", "Versandpapiere", "Transport"] },
    { id: 4, kuerzel: "MK", name: "Marketing", zuordnung: "C – Materialwirtschaft", aufgaben: ["Werbemaßnahmen", "Webseite", "Onlineshop", "Interner und externer Auftritt"] },
    { id: 5, kuerzel: "PW", name: "Personalwesen", zuordnung: "A – Bürowesen", aufgaben: ["Schulungen und Fortbildungen", "Personalbeschaffung und -einsatz", "Personalakten", "Abteilungsunterlagen"] },
    { id: 6, kuerzel: "MW-TAM", name: "Technische Anlagen und Maschinen", zuordnung: "B – Materialwirtschaft", aufgaben: ["Übersichten und Einsatzplanung", "TÜV und Papiere", "Miete, Leasing und Kauf"] },
    { id: 7, kuerzel: "MW-FP", name: "Fuhrpark", zuordnung: "B – Materialwirtschaft", aufgaben: ["Übersichten und Einsatzplanung", "TÜV und Papiere", "Miete, Leasing und Kauf"] },
    { id: 8, kuerzel: "IT", name: "IT und Kommunikation", zuordnung: "D – Stabsstelle unter Bürowesen", aufgaben: ["IT-Ausstattung", "Webshop, Flyer und Präsentationen", "Bilder und Gestaltung", "Schnittstelle für WW, BW und AGF"] },
    { id: 9, kuerzel: "AGF", name: "Stellvertretende Geschäftsführung", zuordnung: "Übergeordnet", aufgaben: ["Stellvertretende Leitung für die Geschäftsführung"] }
];

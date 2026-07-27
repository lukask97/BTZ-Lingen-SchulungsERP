// @ts-nocheck
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
        notiz:""
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
        notiz:""
    }

];


export let artikel = [

    {
        id: 1,
        artikelNr: "ART001",
        name: "Schulungsfahrrad City",
        kategorie: "Fahrräder",
        artikelTyp: "Baugruppe",
        einkaufspreis: 420,
        verkaufspreis: 799,
        bestand: 6,
        beschreibung: "Komplettes Fahrrad als Beispiel für einen zusammengesetzten Artikel.",
        komponenten: [
            { artikelId: 4, artikel: "Fahrradrahmen", menge: 1 },
            { artikelId: 5, artikel: "Lenker", menge: 1 },
            { artikelId: 6, artikel: "Reifen 28 Zoll", menge: 2 },
            { artikelId: 7, artikel: "Sattel Komfort", menge: 1 }
        ]
    },


    {
        id: 2,
        artikelNr: "ART002",
        name: "Sicherheitsjacke",
        kategorie: "Bekleidung",
        artikelTyp: "Einzelartikel",
        einkaufspreis: 39.9,
        verkaufspreis: 89.9,
        bestand: 120,
        beschreibung: "Reflektierende Sicherheitsjacke",
        komponenten: []
    },

    {
        id: 3,
        artikelNr: "ART003",
        name: "Fahrradhelm",
        kategorie: "Zubehör",
        artikelTyp: "Einzelartikel",
        einkaufspreis: 24.5,
        verkaufspreis: 59.99,
        bestand: 45,
        beschreibung: "Sicherer Fahrradhelm mit Zertifikat",
        komponenten: []
    },
    {
        id: 4,
        artikelNr: "ART004",
        name: "Fahrradrahmen",
        kategorie: "Komponenten",
        artikelTyp: "Komponente",
        einkaufspreis: 120,
        verkaufspreis: 199,
        bestand: 18,
        beschreibung: "Rahmen als Einzelkomponente für Schulungsbeispiele.",
        komponenten: []
    },
    {
        id: 5,
        artikelNr: "ART005",
        name: "Lenker",
        kategorie: "Komponenten",
        artikelTyp: "Komponente",
        einkaufspreis: 18,
        verkaufspreis: 34.9,
        bestand: 35,
        beschreibung: "Lenker für Fahrradmontage.",
        komponenten: []
    },
    {
        id: 6,
        artikelNr: "ART006",
        name: "Reifen 28 Zoll",
        kategorie: "Komponenten",
        artikelTyp: "Komponente",
        einkaufspreis: 14.5,
        verkaufspreis: 29.9,
        bestand: 64,
        beschreibung: "Standardreifen als Lagerkomponente.",
        komponenten: []
    },
    {
        id: 7,
        artikelNr: "ART007",
        name: "Sattel Komfort",
        kategorie: "Komponenten",
        artikelTyp: "Komponente",
        einkaufspreis: 16,
        verkaufspreis: 39,
        bestand: 29,
        beschreibung: "Komfortsattel für Schulungsfahrräder.",
        komponenten: []
    }
];

export let services = [
    {
        id: 1,
        serviceNr: "SER001",
        name: "Reparatur",
        kategorie: "Werkstatt",
        einkaufspreis: 0,
        verkaufspreis: 65,
        beschreibung: "Einfache Werkstattleistung für Reparaturen."
    },
    {
        id: 2,
        serviceNr: "SER002",
        name: "Wartung",
        kategorie: "Werkstatt",
        einkaufspreis: 0,
        verkaufspreis: 89,
        beschreibung: "Wartungspaket für Fahrräder oder Fuhrpark."
    },
    {
        id: 3,
        serviceNr: "SER003",
        name: "Leasing",
        kategorie: "Vertrag",
        einkaufspreis: 0,
        verkaufspreis: 149,
        beschreibung: "Leasingpauschale als Serviceangebot."
    },
    {
        id: 4,
        serviceNr: "SER004",
        name: "Lieferung",
        kategorie: "Logistik",
        einkaufspreis: 0,
        verkaufspreis: 35,
        beschreibung: "Lieferung zum Kundenstandort."
    },
    {
        id: 5,
        serviceNr: "SER005",
        name: "Abholung",
        kategorie: "Logistik",
        einkaufspreis: 0,
        verkaufspreis: 20,
        beschreibung: "Abholung beim Kunden oder Partner."
    }
];

export let benutzer = [

    {
        id: 1, username: "admin", email: "admin@test.de", password: "admin", rolle: "Admin"
    },

    {
        id: 2, username: "lager", email: "lager@test.de", password: "lager", rolle: "Lager"
    },

    {
        id: 3, username: "buchhaltung", email: "buchhaltung@test.de", password: "buchhaltung", rolle: "Buchhaltung"
    },
    {
        id: 4, username: "marketing", email: "marketing@test.de", password: "marketing", rolle: "Marketing"
    }

];

export let rollen = [

    {
        id: 1, 
        name: "Admin", 
        beschreibung: "Vollständiger Zugriff auf alle Funktionen",
        permissions: ["*"]
    },

    {
        id: 2,
        name: "Lager",
        beschreibung: "Verwaltung des Lagers und Bestände",
        permissions: [
            "artikel.anlegen", "artikel.bearbeiten", "artikel.anzeigen",
            "lager.anlegen", "lager.bearbeiten", "lager.anzeigen"
        ]
    },

    {
        id: 3,
        name: "Buchhaltung",
        beschreibung: "Verwaltung von Rechnungen und Kundenkonten",
        permissions: [
            "kunde.anlegen", "kunde.bearbeiten", "kunde.anzeigen",
            "rechnung.anlegen", "rechnung.bearbeiten", "rechnung.anzeigen"
        ]
    }

];

export let rechte = [

    {
        id: 1, name: "kunde.anlegen", beschreibung: "Neue Kunden erstellen"
    },

    {
        id: 2, name: "kunde.bearbeiten", beschreibung: "Kundendaten bearbeiten"
    },

    {
        id: 3, name: "artikel.anlegen", beschreibung: "Neue Artikel erstellen"
    },

    {
        id: 4, name: "artikel.bearbeiten", beschreibung: "Artikeldaten bearbeiten"
    },

    {
        id: 5, name: "rechnung.anlegen", beschreibung: "Neue Rechnungen erstellen"
    },

    {
        id: 6, name: "rechnung.bearbeiten", beschreibung: "Rechnungen bearbeiten"
    }

];

export let lager = [

    {
        id: 1, name: "Hauptlager", standort: "Lingen, Industriestraße 3", kapazitaet: 5000
    },

    {
        id: 2, name: "Außenlager", standort: "Meppen, Gewerbepark Nord", kapazitaet: 2000
    }

];

export let rechnungen = [

    {
        id: 1, 
        rechnungsnr: "RE-2024-001", 
        rechnungstyp: "Ausgangsrechnung",
        kundeId: 1,
        kunde: "Campus Baumarkt GmbH",
        bestellungId: "",
        bestellNr: "",
        datum: "2024-01-15",
        faelligAm: "2024-01-29",
        betrag: 1250.50,
        status: "bezahlt",
        mahnstufe: "-"
    },

    {
        id: 2,
        rechnungsnr: "RE-2024-002",
        rechnungstyp: "Ausgangsrechnung",
        kundeId: 2,
        kunde: "Emsland Tourismus GmbH",
        bestellungId: "",
        bestellNr: "",
        datum: "2026-07-10",
        faelligAm: "2026-07-20",
        betrag: 3499.00,
        status: "offen",
        mahnstufe: "1. Mahnung"
    },

    {
        id: 3,
        rechnungsnr: "ER-2026-003",
        rechnungstyp: "Eingangsrechnung",
        lieferantId: 1,
        kunde: "Weber GmbH",
        bestellungId: 1,
        bestellNr: "EK-2026-001",
        datum: "2026-07-24",
        faelligAm: "2026-07-30",
        betrag: 599.99,
        status: "offen",
        mahnstufe: "-"
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
        permissions: ["artikel.lesen", "lager.buchen", "lager.lesen", "einkauf.lesen", "einkauf.bearbeiten"]
    },


    {
        id: 3,
        username: "buchhaltung",
        password: "buchhaltung",
        name: "Buchhaltung",
        permissions: ["kunde.lesen", "kunde.anlegen", "rechnung.lesen", "rechnung.anlegen", "rechnung.bearbeiten", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten", "organisation.lesen", "buchhaltung.lesen", "buchhaltung.bearbeiten"]
    },
    {
        id: 4,
        username: "marketing",
        password: "marketing",
        name: "Marketing Mitarbeiter",
        permissions: ["marketing.lesen", "marketing.bearbeiten", "verkauf.lesen"]
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
        favorit: false
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
        favorit: true
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
        favorit: false
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
        favorit: false
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
        anfrageId: "",
        kundeId: 1,
        kunde: "Campus Baumarkt GmbH",
        datum: "2026-07-22",
        gueltigBis: "2026-08-05",
        rabattBetrag: 0,
        gesamtbetrag: 1348.5,
        status: "offen",
        positionen: [{ artikelId: 2, artikel: "Sicherheitsjacke", menge: 15, einzelpreis: 89.9 }]
    }
];

export let auftraege = [
    {
        id: 1,
        auftragNr: "VK-2026-1201",
        kundeId: 1,
        kunde: "Campus Baumarkt GmbH",
        datum: "2026-07-25",
        status: "offen",
        rabattBetrag: 0,
        gesamtbetrag: 1348.5,
        positionen: [{ artikelId: 2, artikel: "Sicherheitsjacke", menge: 15, einzelpreis: 89.9 }],
        angebotId: 1
    }
];

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
    { id: 2, typ: "Newsletter", titel: "Newsletter August", datum: "2026-08-05", status: "Entwurf", beschreibung: "Neue Fahrräder, Serviceangebote und Termine." },
    { id: 3, typ: "Event", titel: "Betriebshoffest", datum: "2026-09-10", status: "geplant", beschreibung: "Schulungs- und Kundenevent mit Testfahrten." }
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

export let kundenanfragen = [
    {
        id: 1,
        typ: "Produktanfrage",
        kundeId: 1,
        kunde: "Campus Baumarkt GmbH",
        angebotId: "",
        kanal: "Telefon",
        status: "offen",
        datum: "2026-07-24",
        anliegen: "Frage nach Lieferzeiten für Sicherheitsjacken."
    }
];

export let zahlungen = [
    {
        id: 1,
        rechnungsnr: "RE-2024-001",
        zahlungsart: "Eingang",
        kunde: "Campus Baumarkt GmbH",
        datum: "2026-07-22",
        betrag: 1250.5,
        methode: "Überweisung"
    }
];

export let mahnungen = [
    {
        id: 1,
        rechnungsnr: "RE-2024-002",
        kunde: "Emsland Tourismus GmbH",
        datum: "2026-07-23",
        status: "gesendet",
        stufe: "1. Mahnung"
    }
];

export let belege = [
    {
        id: 1,
        typ: "Rechnungskopie",
        bezugTyp: "Rechnung",
        bezug: "RE-2024-001",
        datum: "2026-07-21",
        status: "archiviert",
        beschreibung: "Digitale Ablage für die erste Beispielrechnung."
    },
    {
        id: 2,
        typ: "Zahlungsbeleg",
        bezugTyp: "Rechnung",
        bezug: "RE-2024-001",
        datum: "2026-07-22",
        status: "archiviert",
        beschreibung: "Zahlungseingang per Überweisung wurde abgelegt."
    },
    {
        id: 3,
        typ: "Mahnschreiben",
        bezugTyp: "Rechnung",
        bezug: "RE-2024-002",
        datum: "2026-07-23",
        status: "versendet",
        beschreibung: "1. Mahnung für eine fällige Ausgangsrechnung."
    },
    {
        id: 4,
        typ: "Eingangsrechnung",
        bezugTyp: "Rechnung",
        bezug: "ER-2026-003",
        datum: "2026-07-24",
        status: "archiviert",
        beschreibung: "Lieferantenrechnung zur Bestellung wurde abgelegt."
    }
];

export let freigaben = [
    {
        id: 1,
        titel: "Rabattfreigabe Großkunde",
        bereich: "verkauf",
        status: "offen",
        verantwortung: "Geschäftsführung",
        datum: "2026-07-25",
        bezug: "Großbestellung Nordrad Einkauf",
        notiz: "10 % Mengenrabatt für den Großkunden prüfen."
    }
];

export let berichte = [
    {
        id: 1,
        titel: "Wochenbericht Vertrieb",
        bereich: "verkauf",
        datum: "2026-07-25",
        status: "fertig",
        zusammenfassung: "3 offene Angebote, 1 neuer Auftrag, 1 Reklamation.",
        zielgruppe: "Lehrkraft",
        empfohlenAktion: "Angebote und Reklamationen im Unterricht vergleichen."
    },
    {
        id: 2,
        titel: "Lagerüberblick",
        bereich: "logistik",
        datum: "2026-07-25",
        status: "Entwurf",
        zusammenfassung: "Niedrige Bestände bei Lastenrädern und Helmen.",
        zielgruppe: "Klasse",
        empfohlenAktion: "Bedarfsmeldung und Bestellung aus dem Lagerstand ableiten."
    }
];

export let versandauftraege = [
    {
        id: 1,
        versandNr: "LOG-2026-001",
        auftragId: 1,
        auftrag: "VK-2026-1201",
        kunde: "Campus Baumarkt GmbH",
        datum: "2026-07-26",
        status: "in Vorbereitung",
        transport: "Spedition Nord"
    }
];

export let retouren = [
    {
        id: 1,
        retourenNr: "RET-2026-001",
        kunde: "Emsland Tourismus GmbH",
        artikel: "Fahrradhelm",
        datum: "2026-07-25",
        status: "eingegangen",
        grund: "Transportschaden"
    }
];

export let bewerber = [
    {
        id: 1,
        name: "Lena Fischer",
        stelle: "Kaufmännische Assistenz",
        datum: "2026-07-20",
        status: "eingegangen",
        notiz: "Gute Vorkenntnisse in Excel und Kundenkontakt."
    }
];

export let mitarbeiter = [
    {
        id: 1,
        name: "Tom Berger",
        abteilung: "Lager",
        rolle: "Fachkraft",
        eintritt: "2024-08-01",
        status: "im Einsatz"
    },
    {
        id: 2,
        name: "Mira Koch",
        abteilung: "Marketing",
        rolle: "Koordinatorin",
        eintritt: "2025-02-15",
        status: "im Einsatz"
    }
];

export let arbeitszeiten = [
    {
        id: 1,
        mitarbeiterId: 1,
        mitarbeiter: "Tom Berger",
        datum: "2026-07-25",
        von: "08:00",
        bis: "16:30",
        status: "erfasst"
    }
];

export let urlaubsantraege = [
    {
        id: 1,
        mitarbeiterId: 2,
        mitarbeiter: "Mira Koch",
        von: "2026-08-10",
        bis: "2026-08-14",
        tage: 5,
        status: "offen"
    }
];

export let krankmeldungen = [
    {
        id: 1,
        mitarbeiterId: 1,
        mitarbeiter: "Tom Berger",
        von: "2026-07-24",
        bis: "2026-07-26",
        grund: "Erkältung",
        status: "eingegangen"
    }
];

export let schulungen = [
    {
        id: 1,
        titel: "Produktschulung Lastenbikes",
        zielgruppe: "Verkauf",
        datum: "2026-08-18",
        status: "geplant",
        ort: "Seminarraum 2"
    }
];

export let personalakten = [
    {
        id: 1,
        mitarbeiterId: 1,
        mitarbeiter: "Tom Berger",
        dokumentTyp: "Vertragsunterlage",
        titel: "Arbeitsvertrag Fachkraft Lager",
        datum: "2024-08-01",
        status: "archiviert",
        notiz: "Grundlage für die simulierte Personalakte."
    },
    {
        id: 2,
        mitarbeiterId: 1,
        mitarbeiter: "Tom Berger",
        dokumentTyp: "Onboarding-Checkliste",
        titel: "Einarbeitung Lager und Sicherheit",
        datum: "2024-08-02",
        status: "abgeschlossen",
        notiz: "Einweisung in Lagerordnung, Arbeitsschutz und Scanner."
    },
    {
        id: 3,
        mitarbeiterId: 2,
        mitarbeiter: "Mira Koch",
        dokumentTyp: "Urlaubsantrag",
        titel: "Urlaubsantrag August 2026",
        datum: "2026-07-26",
        status: "offen",
        notiz: "Antrag liegt zur Genehmigung vor."
    },
    {
        id: 4,
        mitarbeiterId: 2,
        mitarbeiter: "Mira Koch",
        dokumentTyp: "Schulungsnachweis",
        titel: "Marketing-Schulung Kampagnenplanung",
        datum: "2026-07-15",
        status: "archiviert",
        notiz: "Teilnahmebescheinigung für interne Weiterbildung."
    }
];

export let vertriebsdokumente = [
    {
        id: 1,
        auftragId: 1,
        auftragNr: "VK-2026-1201",
        kundeId: 1,
        kunde: "Campus Baumarkt GmbH",
        dokumentTyp: "Auftragsbestätigung",
        titel: "Auftragsbestätigung VK-2026-1201",
        datum: "2026-07-25",
        status: "fertig",
        notiz: "Bestellung bestätigt und Liefertermin angekündigt."
    },
    {
        id: 2,
        auftragId: 1,
        auftragNr: "VK-2026-1201",
        kundeId: 1,
        kunde: "Campus Baumarkt GmbH",
        dokumentTyp: "Lieferschein",
        titel: "Lieferschein für Sicherheitsjacken",
        datum: "2026-07-26",
        status: "Entwurf",
        notiz: "Wird mit dem Versand abgestimmt."
    }
];

export let einkaufsdokumente = [
    {
        id: 1,
        bestellungId: 1,
        bestellNr: "EK-2026-001",
        lieferantId: 1,
        lieferant: "Weber GmbH",
        dokumentTyp: "Bedarfsmeldung",
        titel: "Bedarfsmeldung Lastenrad Premium",
        datum: "2026-07-18",
        status: "freigegeben",
        notiz: "Lagerbestand unterschreitet den Zielwert."
    },
    {
        id: 2,
        bestellungId: 1,
        bestellNr: "EK-2026-001",
        lieferantId: 1,
        lieferant: "Weber GmbH",
        dokumentTyp: "Anfrage",
        titel: "Anfrage Lieferzeit und Staffelpreise",
        datum: "2026-07-19",
        status: "versendet",
        notiz: "Lieferant soll Lieferzeit und Preisstaffel bestätigen."
    },
    {
        id: 3,
        bestellungId: 1,
        bestellNr: "EK-2026-001",
        lieferantId: 1,
        lieferant: "Weber GmbH",
        dokumentTyp: "Bestellung",
        titel: "Bestellung EK-2026-001",
        datum: "2026-07-20",
        status: "fertig",
        notiz: "Verbindliche Bestellung ausgelöst."
    }
];

export let firmenkonto = [
    {
        id: 1,
        datum: "2024-10-01",
        betreff: "Stammkapitaleinzahlung",
        info: "",
        soll: 0,
        haben: 25000,
        saldo: 25000
    },
    {
        id: 2,
        datum: "",
        betreff: "",
        info: "",
        soll: 0,
        haben: 0,
        saldo: 25000
    },
    {
        id: 3,
        datum: "",
        betreff: "",
        info: "",
        soll: 0,
        haben: 0,
        saldo: 25000
    }
];

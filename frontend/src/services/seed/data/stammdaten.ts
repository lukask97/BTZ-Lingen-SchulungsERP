// Zentrale Testdaten
// Nur im Arbeitsspeicher

// Vertrieb und Stammdaten


export let kunden = [

    {
        id: 1,
        kundenNr: "DB10001",
        firma: "Campus Baumarkt GmbH",
        anschrift: "IndustriestraÃŸe 3",
        plz: "49809",
        ort: "Lingen",
        segment: "Baumarkt",
        abc: "A",
        iban: "DE44500105175407324931",

        optionen: ["Fahrradbekleidung", "Sicherheitsbekleidung", "SonderfahrrÃ¤der", "Lastenbikes"],
        notiz:"",
        ansprechpartner: [
            { id: "kp-1-1", name: "Mara Heinen", abteilung: "Einkauf" },
            { id: "kp-1-2", name: "Thomas Wilken", abteilung: "Filialleitung" }
        ]
    },


    {
        id: 2,
        kundenNr: "DB10002",
        firma: "Emsland Tourismus GmbH",
        anschrift: "Helter Damm 11a",
        plz: "49716",
        ort: "Meppen",
        segment: "Tourismus",
        abc: "B",
        iban: "DE75512108001245126199",

        optionen: ["Bikes aller Art", "Leasing", "Reparatur Service"],

        website: "https://www.emsland.com/",
        notiz:"",
        ansprechpartner: [
            { id: "kp-2-1", name: "Lena Kramer", abteilung: "Touristik" },
            { id: "kp-2-2", name: "Jan Feldkamp", abteilung: "Eventplanung" }
        ]
    },

    {
        id: 3,
        kundenNr: "DB10003",
        firma: "Nordrad Campus Service",
        anschrift: "LindenstraÃŸe 22",
        plz: "48529",
        ort: "Nordhorn",
        segment: "Dienstleistung",
        abc: "B",
        iban: "DE31500105170648489890",
        optionen: ["Service", "Wartung", "Abholung"],
        website: "https://www.nordrad-campus.de/",
        ansprechpartner: [
            { id: "kp-3-1", name: "Sven Hartmann", abteilung: "Werkstattleitung" },
            { id: "kp-3-2", name: "Kira Beckmann", abteilung: "Disposition" }
        ],
        notiz:"Servicekunde mit regelmÃ¤ÃŸigen Wartungsanfragen."
    },

    {
        id: 4,
        kundenNr: "DB10004",
        firma: "Stadtwerke Lingen MobilitÃ¤t",
        anschrift: "KaiserstraÃŸe 14",
        plz: "49808",
        ort: "Lingen",
        segment: "Ã–ffentliche Einrichtung",
        abc: "A",
        iban: "DE98500105179876543210",
        optionen: ["Flottenkunden", "Lastenbikes", "Sicherheitsausstattung"],
        website: "https://www.stadtwerke-lingen.de/",
        ansprechpartner: [
            { id: "kp-4-1", name: "Nadine Albers", abteilung: "MobilitÃ¤tsmanagement" },
            { id: "kp-4-2", name: "Timo Gerdes", abteilung: "Beschaffung" }
        ],
        notiz:"Potenzial fÃ¼r grÃ¶ÃŸere Flottenbestellungen."
    },

    {
        id: 5,
        kundenNr: "DB10005",
        firma: "Jugendwerkstatt Ems-Vechte",
        anschrift: "WerkstraÃŸe 7",
        plz: "48431",
        ort: "Rheine",
        segment: "Bildung",
        abc: "C",
        iban: "DE12500105171234567890",
        optionen: ["SchulungsfahrrÃ¤der", "Helme", "Projektmaterial"],
        website: "",
        ansprechpartner: [
            { id: "kp-5-1", name: "Leonie Schulte", abteilung: "Projektkoordination" },
            { id: "kp-5-2", name: "Bastian Kruse", abteilung: "Ausbildung" }
        ],
        notiz:"Neuer Projektkunde mit wiederkehrendem Trainingsbedarf."
    }

];


export let artikel = [

    {
        id: 1,
        artikelNr: "ART001",
        name: "Schulungsfahrrad City",
        kategorieId: 4,
        kategorie: "FahrrÃ¤der",
        kategoriePfad: "FahrrÃ¤der > Citybike",
        artikelTyp: "Baugruppe",
        einkaufspreis: 420,
        verkaufspreis: 799,
        bestand: 4,
        mindestmenge: 3,
        bedarfsmeldungBei: 5,
        beschreibung: "Komplettes Fahrrad als Beispiel fÃ¼r einen zusammengesetzten Artikel. Bereits nachbestellt und daher im Zulauf."
    },


    {
        id: 2,
        artikelNr: "ART002",
        name: "Sicherheitsjacke",
        kategorieId: 6,
        kategorie: "Bekleidung",
        kategoriePfad: "Bekleidung > Sicherheitsbekleidung",
        artikelTyp: "Einzelartikel",
        einkaufspreis: 39.9,
        verkaufspreis: 89.9,
        bestand: 120,
        mindestmenge: 20,
        bedarfsmeldungBei: 30,
        beschreibung: "Reflektierende Sicherheitsjacke mit komfortablem Lagerbestand."
    },

    {
        id: 3,
        artikelNr: "ART003",
        name: "Fahrradhelm",
        kategorieId: 8,
        kategorie: "ZubehÃ¶r",
        kategoriePfad: "ZubehÃ¶r > Helm",
        artikelTyp: "Einzelartikel",
        einkaufspreis: 24.5,
        verkaufspreis: 59.99,
        bestand: 12,
        mindestmenge: 10,
        bedarfsmeldungBei: 15,
        beschreibung: "Sicherer Fahrradhelm mit Zertifikat. ZusÃ¤tzliche Menge ist bereits bestellt."
    },
    {
        id: 4,
        artikelNr: "ART004",
        name: "Fahrradrahmen",
        kategorieId: 10,
        kategorie: "Mechanik",
        kategoriePfad: "Mechanik > Rahmen",
        artikelTyp: "Komponente",
        einkaufspreis: 120,
        verkaufspreis: 199,
        bestand: 8,
        mindestmenge: 6,
        bedarfsmeldungBei: 9,
        beschreibung: "Rahmen als Einzelkomponente fÃ¼r Schulungsbeispiele. Bedarfsmeldung wird bereits erreicht."
    },
    {
        id: 5,
        artikelNr: "ART005",
        name: "Lenker",
        kategorieId: 11,
        kategorie: "Mechanik",
        kategoriePfad: "Mechanik > Lenker",
        artikelTyp: "Komponente",
        einkaufspreis: 18,
        verkaufspreis: 34.9,
        bestand: 9,
        mindestmenge: 10,
        bedarfsmeldungBei: 12,
        beschreibung: "Lenker fÃ¼r Fahrradmontage. Sicherheitsbestand ist aktuell unterschritten."
    },
    {
        id: 6,
        artikelNr: "ART006",
        name: "Reifen 28 Zoll",
        kategorieId: 12,
        kategorie: "Mechanik",
        kategoriePfad: "Mechanik > Reifen",
        artikelTyp: "Komponente",
        einkaufspreis: 14.5,
        verkaufspreis: 29.9,
        bestand: 28,
        mindestmenge: 20,
        bedarfsmeldungBei: 25,
        beschreibung: "Standardreifen als Lagerkomponente mit noch stabilem Bestand."
    },
    {
        id: 7,
        artikelNr: "ART007",
        name: "Sattel Komfort",
        kategorieId: 13,
        kategorie: "Mechanik",
        kategoriePfad: "Mechanik > Sattel",
        artikelTyp: "Komponente",
        einkaufspreis: 16,
        verkaufspreis: 39,
        bestand: 14,
        mindestmenge: 8,
        bedarfsmeldungBei: 10,
        beschreibung: "Komfortsattel fÃ¼r SchulungsfahrrÃ¤der mit ausreichend freiem Bestand."
    },
    {
        id: 8,
        artikelNr: "ART008",
        name: "Sattel Sport",
        kategorieId: 13,
        kategorie: "Mechanik",
        kategoriePfad: "Mechanik > Sattel",
        artikelTyp: "Komponente",
        einkaufspreis: 19,
        verkaufspreis: 45,
        bestand: 10,
        mindestmenge: 5,
        bedarfsmeldungBei: 8,
        beschreibung: "Sportsattel fÃ¼r die Individualisierung."
    },
    {
        id: 9,
        artikelNr: "ART009",
        name: "Sattel Premium",
        kategorieId: 13,
        kategorie: "Mechanik",
        kategoriePfad: "Mechanik > Sattel",
        artikelTyp: "Komponente",
        einkaufspreis: 28,
        verkaufspreis: 65,
        bestand: 5,
        mindestmenge: 2,
        bedarfsmeldungBei: 5,
        beschreibung: "Hochwertiger Premium-Sattel."
    },
    {
        id: 10,
        artikelNr: "ART010",
        name: "Schulungsfahrrad Premium",
        kategorieId: 4,
        kategorie: "FahrrÃ¤der",
        kategoriePfad: "FahrrÃ¤der > Citybike",
        artikelTyp: "Baugruppe",
        einkaufspreis: 500,
        verkaufspreis: 999,
        bestand: 2,
        mindestmenge: 1,
        bedarfsmeldungBei: 3,
        beschreibung: "Premium Fahrrad, bei dem Komponenten individualisiert werden kÃ¶nnen."
    },
    {
        id: 11,
        artikelNr: "ART011",
        name: "Schulungsfahrrad Trekking",
        kategorieId: 4,
        kategorie: "FahrrÃ¤der",
        kategoriePfad: "FahrrÃ¤der > Trekking",
        artikelTyp: "Baugruppe",
        einkaufspreis: 550,
        verkaufspreis: 1099,
        bestand: 3,
        mindestmenge: 2,
        bedarfsmeldungBei: 4,
        beschreibung: "Trekking-Rad, ebenfalls mit anpassbaren Komponenten."
    },
    {
        id: 12,
        artikelNr: "ART012",
        name: "Schulungsfahrrad Urban Flex",
        kategorieId: 4,
        kategorie: "FahrrÃ¤der",
        kategoriePfad: "FahrrÃ¤der > Citybike",
        artikelTyp: "Baugruppe",
        einkaufspreis: 470,
        verkaufspreis: 939,
        bestand: 4,
        mindestmenge: 2,
        bedarfsmeldungBei: 3,
        beschreibung: "Urbanes Schulungsrad mit mehreren Individualisierungsoptionen fÃ¼r Demo-Angebote."
    },
    {
        id: 13,
        artikelNr: "ART013",
        name: "Schulungsfahrrad Cargo Start",
        kategorieId: 4,
        kategorie: "FahrrÃ¤der",
        kategoriePfad: "FahrrÃ¤der > Lastenrad",
        artikelTyp: "Baugruppe",
        einkaufspreis: 690,
        verkaufspreis: 1399,
        bestand: 2,
        mindestmenge: 1,
        bedarfsmeldungBei: 2,
        beschreibung: "Einfaches Lastenrad fÃ¼r Schulungs- und VorfÃ¼hrzwecke mit konfigurierbaren Komponenten."
    },
    {
        id: 14,
        artikelNr: "ART014",
        name: "Lenker Komfort Plus",
        kategorieId: 11,
        kategorie: "Mechanik",
        kategoriePfad: "Mechanik > Lenker",
        artikelTyp: "Komponente",
        einkaufspreis: 24,
        verkaufspreis: 49,
        bestand: 7,
        mindestmenge: 4,
        bedarfsmeldungBei: 5,
        beschreibung: "Breiter Komfortlenker als Upgrade fÃ¼r individualisierbare Baugruppen."
    },
    {
        id: 15,
        artikelNr: "ART015",
        name: "Reifen Pannenschutz 28 Zoll",
        kategorieId: 12,
        kategorie: "Mechanik",
        kategoriePfad: "Mechanik > Reifen",
        artikelTyp: "Komponente",
        einkaufspreis: 22,
        verkaufspreis: 44,
        bestand: 11,
        mindestmenge: 6,
        bedarfsmeldungBei: 8,
        beschreibung: "Pannensicherer Reifen als Upgrade fÃ¼r intensive SchulungseinsÃ¤tze."
    },
    {
        id: 16,
        artikelNr: "ART016",
        name: "Sattel Gel Tour",
        kategorieId: 13,
        kategorie: "Mechanik",
        kategoriePfad: "Mechanik > Sattel",
        artikelTyp: "Komponente",
        einkaufspreis: 23,
        verkaufspreis: 54,
        bestand: 9,
        mindestmenge: 4,
        bedarfsmeldungBei: 6,
        beschreibung: "Gel-Sattel fÃ¼r lÃ¤ngere Fahrten und Komfort-Demos."
    }
];

export let artikelStueckliste = [
    { id: 1, hauptartikelId: 1, komponentenartikelId: 4, menge: 1 },
    { id: 2, hauptartikelId: 1, komponentenartikelId: 5, menge: 1 },
    { id: 3, hauptartikelId: 1, komponentenartikelId: 6, menge: 2 },
    { id: 4, hauptartikelId: 1, komponentenartikelId: 7, menge: 1 },
    { id: 5, hauptartikelId: 10, komponentenartikelId: 4, menge: 1 },
    { id: 6, hauptartikelId: 10, komponentenartikelId: 5, menge: 1 },
    { id: 7, hauptartikelId: 10, komponentenartikelId: 6, menge: 2 },
    { id: 8, hauptartikelId: 10, komponentenartikelId: 7, menge: 1 },
    { id: 9, hauptartikelId: 11, komponentenartikelId: 4, menge: 1 },
    { id: 10, hauptartikelId: 11, komponentenartikelId: 5, menge: 1 },
    { id: 11, hauptartikelId: 11, komponentenartikelId: 6, menge: 2 },
    { id: 12, hauptartikelId: 11, komponentenartikelId: 8, menge: 1 },
    { id: 13, hauptartikelId: 12, komponentenartikelId: 4, menge: 1 },
    { id: 14, hauptartikelId: 12, komponentenartikelId: 14, menge: 1 },
    { id: 15, hauptartikelId: 12, komponentenartikelId: 6, menge: 2 },
    { id: 16, hauptartikelId: 12, komponentenartikelId: 7, menge: 1 },
    { id: 17, hauptartikelId: 13, komponentenartikelId: 4, menge: 1 },
    { id: 18, hauptartikelId: 13, komponentenartikelId: 5, menge: 1 },
    { id: 19, hauptartikelId: 13, komponentenartikelId: 15, menge: 2 },
    { id: 20, hauptartikelId: 13, komponentenartikelId: 16, menge: 1 }
];

export let artikelIndividualisierung = [
    // Optionen fÃ¼r das Schulungsfahrrad Premium (ID: 10)
    // Auswahl: Sattel
    { id: 1, artikelId: 10, individualArtikelId: 7, kategorieId: 13, anzahl: 1, preisaenderung: 0, standard: true },
    { id: 2, artikelId: 10, individualArtikelId: 8, kategorieId: 13, anzahl: 1, preisaenderung: 6, standard: false },
    { id: 3, artikelId: 10, individualArtikelId: 9, kategorieId: 13, anzahl: 1, preisaenderung: 26, standard: false },
    // Auswahl: Lenker
    { id: 4, artikelId: 10, individualArtikelId: 5, kategorieId: 11, anzahl: 1, preisaenderung: 0, standard: true },
    { id: 5, artikelId: 10, individualArtikelId: 14, kategorieId: 11, anzahl: 1, preisaenderung: 14, standard: false },
    
    // Optionen fÃ¼r das Schulungsfahrrad Trekking (ID: 11)
    // Auswahl: Sattel
    { id: 6, artikelId: 11, individualArtikelId: 8, kategorieId: 13, anzahl: 1, preisaenderung: 0, standard: true },
    { id: 7, artikelId: 11, individualArtikelId: 9, kategorieId: 13, anzahl: 1, preisaenderung: 20, standard: false },
    { id: 8, artikelId: 11, individualArtikelId: 16, kategorieId: 13, anzahl: 1, preisaenderung: 9, standard: false },
    // Auswahl: Lenker
    { id: 9, artikelId: 11, individualArtikelId: 5, kategorieId: 11, anzahl: 1, preisaenderung: 0, standard: true },
    { id: 10, artikelId: 11, individualArtikelId: 14, kategorieId: 11, anzahl: 1, preisaenderung: 16, standard: false },

    // Optionen fÃ¼r das Schulungsfahrrad Urban Flex (ID: 12)
    { id: 11, artikelId: 12, individualArtikelId: 7, kategorieId: 13, anzahl: 1, preisaenderung: 0, standard: true },
    { id: 12, artikelId: 12, individualArtikelId: 8, kategorieId: 13, anzahl: 1, preisaenderung: 8, standard: false },
    { id: 13, artikelId: 12, individualArtikelId: 16, kategorieId: 13, anzahl: 1, preisaenderung: 12, standard: false },
    { id: 14, artikelId: 12, individualArtikelId: 14, kategorieId: 11, anzahl: 1, preisaenderung: 0, standard: true },
    { id: 15, artikelId: 12, individualArtikelId: 5, kategorieId: 11, anzahl: 1, preisaenderung: -6, standard: false },

    // Optionen fÃ¼r das Schulungsfahrrad Cargo Start (ID: 13)
    { id: 16, artikelId: 13, individualArtikelId: 16, kategorieId: 13, anzahl: 1, preisaenderung: 0, standard: true },
    { id: 17, artikelId: 13, individualArtikelId: 9, kategorieId: 13, anzahl: 1, preisaenderung: 18, standard: false },
    { id: 18, artikelId: 13, individualArtikelId: 15, kategorieId: 12, anzahl: 2, preisaenderung: 0, standard: true },
    { id: 19, artikelId: 13, individualArtikelId: 6, kategorieId: 12, anzahl: 2, preisaenderung: -10, standard: false }
];

export let services = [
    {
        id: 1,
        serviceNr: "SER001",
        name: "Reparatur",
        kategorie: "Werkstatt",
        berechnungstyp: "Pauschal",
        zeEinheit: "",
        einkaufspreis: 0,
        verkaufspreis: 65,
        beschreibung: "Einfache Werkstattleistung fÃ¼r Reparaturen."
    },
    {
        id: 2,
        serviceNr: "SER002",
        name: "Wartung",
        kategorie: "Werkstatt",
        berechnungstyp: "Pauschal",
        zeEinheit: "",
        einkaufspreis: 0,
        verkaufspreis: 89,
        beschreibung: "Wartungspaket fÃ¼r FahrrÃ¤der oder Fuhrpark."
    },
    {
        id: 3,
        serviceNr: "SER003",
        name: "Miete",
        kategorie: "Vertrag",
        berechnungstyp: "ZE",
        zeEinheit: "1 Tag",
        einkaufspreis: 0,
        verkaufspreis: 149,
        beschreibung: "Mietleistung mit Berechnung je Zeiteinheit von einem Tag."
    },
    {
        id: 4,
        serviceNr: "SER004",
        name: "Lieferung",
        kategorie: "Logistik",
        berechnungstyp: "Pauschal",
        zeEinheit: "",
        einkaufspreis: 0,
        verkaufspreis: 35,
        beschreibung: "Lieferung zum Kundenstandort."
    },
    {
        id: 5,
        serviceNr: "SER005",
        name: "Abholung",
        kategorie: "Logistik",
        berechnungstyp: "Pauschal",
        zeEinheit: "",
        einkaufspreis: 0,
        verkaufspreis: 20,
        beschreibung: "Abholung beim Kunden oder Partner."
    }
];

export let nummernkreise = [
    {
        id: 1,
        schluessel: "artikel",
        bezeichnung: "Artikel",
        kuerzel: "ART"
    },
    {
        id: 2,
        schluessel: "service",
        bezeichnung: "Service",
        kuerzel: "SER"
    },
    {
        id: 3,
        schluessel: "angebot",
        bezeichnung: "Angebot",
        kuerzel: "ANG"
    },
    {
        id: 4,
        schluessel: "auftrag",
        bezeichnung: "Auftrag",
        kuerzel: "AU"
    },
    {
        id: 5,
        schluessel: "rechnung",
        bezeichnung: "Rechnung",
        kuerzel: "RG"
    },
    {
        id: 6,
        schluessel: "lieferschein",
        bezeichnung: "Lieferschein",
        kuerzel: "LS"
    },
    {
        id: 7,
        schluessel: "bestellung",
        bezeichnung: "Bestellung",
        kuerzel: "EK"
    },
    {
        id: 8,
        schluessel: "gutschrift",
        bezeichnung: "Gutschrift",
        kuerzel: "GS"
    },
    {
        id: 9,
        schluessel: "mahnung",
        bezeichnung: "Mahnung",
        kuerzel: "MH"
    },
    {
        id: 10,
        schluessel: "zahlung",
        bezeichnung: "Zahlung",
        kuerzel: "ZA"
    }
];

export let benutzer = [

    {
        id: 1, username: "admin", email: "admin@test.de", password: "admin", rolle: "Admin", vorname: "Test", nachname: "Admin", permissions: ["*"]
    },

    {
        id: 2, username: "lager", email: "lager@test.de", password: "lager", rolle: "Lager", vorname: "Lager", nachname: "Leo", permissions: ["artikel.lesen", "lager.buchen", "lager.lesen", "einkauf.lesen", "einkauf.bearbeiten"]
    },

    {
        id: 3, username: "buchhaltung", email: "buchhaltung@test.de", password: "buchhaltung", rolle: "Buchhaltung", vorname: "Bilanz", nachname: "Britta", permissions: ["kunde.lesen", "kunde.anlegen", "kunde.bearbeiten", "rechnung.lesen", "rechnung.anlegen", "rechnung.bearbeiten", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten", "organisation.lesen", "buchhaltung.lesen", "buchhaltung.bearbeiten"]
    },
    {
        id: 4, username: "marketing", email: "marketing@test.de", password: "marketing", rolle: "Marketing", vorname: "Marketing", nachname: "Mara", permissions: ["marketing.lesen", "marketing.bearbeiten", "verkauf.lesen"]
    },
    {
        id: 8, username: "einkauf", email: "einkauf@test.de", password: "einkauf", rolle: "Einkauf", vorname: "Einkauf", nachname: "Eva", permissions: ["einkauf.lesen", "einkauf.bearbeiten", "lager.lesen", "lager.bearbeiten", "artikel.lesen", "artikel.bearbeiten"]
    },
    {
        id: 10, username: "personalwesen", email: "personalwesen@test.de", password: "personalwesen", rolle: "Personalwesen", vorname: "HR", nachname: "Hannah", permissions: ["personalwesen.lesen", "personalwesen.bearbeiten", "organisation.lesen"]
    },
    {
        id: 5, username: "verkauf_azubi", email: "verkauf.azubi@test.de", password: "verkauf", rolle: "Verkauf Azubi", vorname: "Azubi", nachname: "Alex", permissions: ["kunde.lesen", "artikel.lesen", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen"]
    },
    {
        id: 6, username: "verkauf_senior", email: "verkauf.senior@test.de", password: "verkauf", rolle: "Verkauf Senior", vorname: "Senior", nachname: "Sascha", permissions: ["kunde.lesen", "kunde.anlegen", "kunde.bearbeiten", "artikel.lesen", "lager.lesen", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten"]
    },
    {
        id: 7, username: "gf", email: "gf@test.de", password: "gf", rolle: "GeschÃ¤ftsfÃ¼hrung", vorname: "Chef", nachname: "Carsten", permissions: ["*"]
    }

];

export let rollen = [

    {
        id: 1, 
        name: "Admin", 
        beschreibung: "VollstÃ¤ndiger Zugriff auf alle Funktionen"
    },

    {
        id: 2,
        name: "Lager",
        beschreibung: "Verwaltung des Lagers und BestÃ¤nde"
    },

    {
        id: 3,
        name: "Buchhaltung",
        beschreibung: "Verwaltung von Rechnungen und Kundenkonten"
    },
    {
        id: 4,
        name: "Marketing",
        beschreibung: "Marketing und Kampagnenarbeit"
    },
    {
        id: 5,
        name: "Einkauf",
        beschreibung: "Einkauf und Lieferantenmanagement"
    },
    {
        id: 6,
        name: "Verkauf",
        beschreibung: "Vertrieb und Kundenkommunikation"
    },
    {
        id: 7,
        name: "Personalwesen",
        beschreibung: "Mitarbeiter- und Personalarbeit"
    },
    {
        id: 8,
        name: "Verkauf Azubi",
        beschreibung: "Verkauf fÃ¼r Auszubildende"
    },
    {
        id: 9,
        name: "Verkauf Senior",
        beschreibung: "Erweiterte Verkaufsrolle mit Freigaben"
    },
    {
        id: 10,
        name: "GeschÃ¤ftsfÃ¼hrung",
        beschreibung: "Vollzugriff fÃ¼r die GeschÃ¤ftsfÃ¼hrung"
    }

];

export let rechte = [
    { id: 1, name: "*", beschreibung: "Vollzugriff auf alle Funktionen" },
    { id: 2, name: "organisation.lesen", beschreibung: "Organisationsdaten lesen" },
    { id: 3, name: "einkauf.lesen", beschreibung: "Einkaufsdaten lesen" },
    { id: 4, name: "einkauf.bearbeiten", beschreibung: "Einkaufsdaten bearbeiten" },
    { id: 5, name: "verkauf.lesen", beschreibung: "Verkaufsdaten lesen" },
    { id: 6, name: "verkauf.bearbeiten", beschreibung: "Verkaufsdaten bearbeiten" },
    { id: 7, name: "service.lesen", beschreibung: "Servicedaten lesen" },
    { id: 8, name: "service.bearbeiten", beschreibung: "Servicedaten bearbeiten" },
    { id: 9, name: "marketing.lesen", beschreibung: "Marketingdaten lesen" },
    { id: 10, name: "marketing.bearbeiten", beschreibung: "Marketingdaten bearbeiten" },
    { id: 11, name: "buchhaltung.lesen", beschreibung: "Buchhaltungsdaten lesen" },
    { id: 12, name: "buchhaltung.bearbeiten", beschreibung: "Buchhaltungsdaten bearbeiten" },
    { id: 13, name: "logistik.lesen", beschreibung: "Logistikdaten lesen" },
    { id: 14, name: "logistik.bearbeiten", beschreibung: "Logistikdaten bearbeiten" },
    { id: 15, name: "personalwesen.lesen", beschreibung: "Personaldaten lesen" },
    { id: 16, name: "personalwesen.bearbeiten", beschreibung: "Personaldaten bearbeiten" },
    { id: 17, name: "gf.lesen", beschreibung: "GeschÃ¤ftsfÃ¼hrungsdaten lesen" },
    { id: 18, name: "gf.bearbeiten", beschreibung: "GeschÃ¤ftsfÃ¼hrungsdaten bearbeiten" },
    { id: 19, name: "kunde.lesen", beschreibung: "Kundendaten lesen" },
    { id: 20, name: "kunde.anzeigen", beschreibung: "Kundendaten anzeigen" },
    { id: 21, name: "kunde.anlegen", beschreibung: "Neue Kunden erstellen" },
    { id: 22, name: "kunde.bearbeiten", beschreibung: "Kundendaten bearbeiten" },
    { id: 23, name: "kunde.loeschen", beschreibung: "Kundendaten lÃ¶schen" },
    { id: 24, name: "artikel.lesen", beschreibung: "Artikeldaten lesen" },
    { id: 25, name: "artikel.anzeigen", beschreibung: "Artikeldaten anzeigen" },
    { id: 26, name: "artikel.anlegen", beschreibung: "Neue Artikel erstellen" },
    { id: 27, name: "artikel.bearbeiten", beschreibung: "Artikeldaten bearbeiten" },
    { id: 28, name: "artikel.loeschen", beschreibung: "Artikeldaten lÃ¶schen" },
    { id: 29, name: "rechnung.lesen", beschreibung: "Rechnungen lesen" },
    { id: 30, name: "rechnung.anzeigen", beschreibung: "Rechnungen anzeigen" },
    { id: 31, name: "rechnung.anlegen", beschreibung: "Neue Rechnungen erstellen" },
    { id: 32, name: "rechnung.bearbeiten", beschreibung: "Rechnungen bearbeiten" },
    { id: 33, name: "rechnung.loeschen", beschreibung: "Rechnungen lÃ¶schen" },
    { id: 34, name: "lager.lesen", beschreibung: "Lagerdaten lesen" },
    { id: 35, name: "lager.anzeigen", beschreibung: "Lagerdaten anzeigen" },
    { id: 36, name: "lager.anlegen", beschreibung: "Neue Lager anlegen" },
    { id: 37, name: "lager.bearbeiten", beschreibung: "Lagerdaten bearbeiten" },
    { id: 38, name: "lager.loeschen", beschreibung: "Lagerdaten lÃ¶schen" },
    { id: 39, name: "lager.buchen", beschreibung: "Lagerbewegungen buchen" },
    { id: 40, name: "benutzer.lesen", beschreibung: "Benutzerdaten lesen" },
    { id: 41, name: "benutzer.anzeigen", beschreibung: "Benutzerdaten anzeigen" },
    { id: 42, name: "benutzer.anlegen", beschreibung: "Neue Benutzer anlegen" },
    { id: 43, name: "benutzer.bearbeiten", beschreibung: "Benutzerdaten bearbeiten" },
    { id: 44, name: "benutzer.loeschen", beschreibung: "Benutzerdaten lÃ¶schen" },
    { id: 45, name: "rollen.lesen", beschreibung: "Rollen lesen" },
    { id: 46, name: "rollen.anzeigen", beschreibung: "Rollen anzeigen" },
    { id: 47, name: "rollen.anlegen", beschreibung: "Neue Rollen anlegen" },
    { id: 48, name: "rollen.bearbeiten", beschreibung: "Rollen bearbeiten" },
    { id: 49, name: "rollen.loeschen", beschreibung: "Rollen lÃ¶schen" },
    { id: 50, name: "rechte.lesen", beschreibung: "Rechte lesen" },
    { id: 51, name: "rechte.anzeigen", beschreibung: "Rechte anzeigen" },
    { id: 52, name: "rechte.anlegen", beschreibung: "Neue Rechte anlegen" },
    { id: 53, name: "rechte.bearbeiten", beschreibung: "Rechte bearbeiten" },
    { id: 54, name: "rechte.loeschen", beschreibung: "Rechte lÃ¶schen" }
];

export let rollenRechte = [
    { id: 1, rolleId: 1, rolleName: "Admin", rechtName: "*" },
    { id: 2, rolleId: 2, rolleName: "Lager", rechtName: "artikel.lesen" },
    { id: 3, rolleId: 2, rolleName: "Lager", rechtName: "lager.buchen" },
    { id: 4, rolleId: 2, rolleName: "Lager", rechtName: "lager.lesen" },
    { id: 5, rolleId: 2, rolleName: "Lager", rechtName: "einkauf.lesen" },
    { id: 6, rolleId: 2, rolleName: "Lager", rechtName: "einkauf.bearbeiten" },
    { id: 7, rolleId: 3, rolleName: "Buchhaltung", rechtName: "kunde.lesen" },
    { id: 8, rolleId: 3, rolleName: "Buchhaltung", rechtName: "kunde.anlegen" },
    { id: 9, rolleId: 3, rolleName: "Buchhaltung", rechtName: "kunde.bearbeiten" },
    { id: 10, rolleId: 3, rolleName: "Buchhaltung", rechtName: "rechnung.lesen" },
    { id: 11, rolleId: 3, rolleName: "Buchhaltung", rechtName: "rechnung.anlegen" },
    { id: 12, rolleId: 3, rolleName: "Buchhaltung", rechtName: "rechnung.bearbeiten" },
    { id: 13, rolleId: 3, rolleName: "Buchhaltung", rechtName: "verkauf.lesen" },
    { id: 14, rolleId: 3, rolleName: "Buchhaltung", rechtName: "verkauf.bearbeiten" },
    { id: 15, rolleId: 3, rolleName: "Buchhaltung", rechtName: "service.lesen" },
    { id: 16, rolleId: 3, rolleName: "Buchhaltung", rechtName: "service.bearbeiten" },
    { id: 17, rolleId: 3, rolleName: "Buchhaltung", rechtName: "organisation.lesen" },
    { id: 18, rolleId: 3, rolleName: "Buchhaltung", rechtName: "buchhaltung.lesen" },
    { id: 19, rolleId: 3, rolleName: "Buchhaltung", rechtName: "buchhaltung.bearbeiten" },
    { id: 20, rolleId: 4, rolleName: "Marketing", rechtName: "marketing.lesen" },
    { id: 21, rolleId: 4, rolleName: "Marketing", rechtName: "marketing.bearbeiten" },
    { id: 22, rolleId: 4, rolleName: "Marketing", rechtName: "verkauf.lesen" },
    { id: 23, rolleId: 5, rolleName: "Einkauf", rechtName: "einkauf.lesen" },
    { id: 24, rolleId: 5, rolleName: "Einkauf", rechtName: "einkauf.bearbeiten" },
    { id: 25, rolleId: 5, rolleName: "Einkauf", rechtName: "lager.lesen" },
    { id: 26, rolleId: 5, rolleName: "Einkauf", rechtName: "lager.bearbeiten" },
    { id: 27, rolleId: 5, rolleName: "Einkauf", rechtName: "artikel.lesen" },
    { id: 28, rolleId: 5, rolleName: "Einkauf", rechtName: "artikel.bearbeiten" },
    { id: 29, rolleId: 6, rolleName: "Verkauf", rechtName: "kunde.lesen" },
    { id: 30, rolleId: 6, rolleName: "Verkauf", rechtName: "kunde.anlegen" },
    { id: 31, rolleId: 6, rolleName: "Verkauf", rechtName: "kunde.bearbeiten" },
    { id: 32, rolleId: 6, rolleName: "Verkauf", rechtName: "artikel.lesen" },
    { id: 33, rolleId: 6, rolleName: "Verkauf", rechtName: "verkauf.lesen" },
    { id: 34, rolleId: 6, rolleName: "Verkauf", rechtName: "verkauf.bearbeiten" },
    { id: 35, rolleId: 6, rolleName: "Verkauf", rechtName: "service.lesen" },
    { id: 36, rolleId: 6, rolleName: "Verkauf", rechtName: "service.bearbeiten" },
    { id: 37, rolleId: 7, rolleName: "Personalwesen", rechtName: "personalwesen.lesen" },
    { id: 38, rolleId: 7, rolleName: "Personalwesen", rechtName: "personalwesen.bearbeiten" },
    { id: 39, rolleId: 7, rolleName: "Personalwesen", rechtName: "organisation.lesen" },
    { id: 40, rolleId: 8, rolleName: "Verkauf Azubi", rechtName: "kunde.lesen" },
    { id: 41, rolleId: 8, rolleName: "Verkauf Azubi", rechtName: "artikel.lesen" },
    { id: 42, rolleId: 8, rolleName: "Verkauf Azubi", rechtName: "verkauf.lesen" },
    { id: 43, rolleId: 8, rolleName: "Verkauf Azubi", rechtName: "verkauf.bearbeiten" },
    { id: 44, rolleId: 8, rolleName: "Verkauf Azubi", rechtName: "service.lesen" },
    { id: 45, rolleId: 9, rolleName: "Verkauf Senior", rechtName: "kunde.lesen" },
    { id: 46, rolleId: 9, rolleName: "Verkauf Senior", rechtName: "kunde.anlegen" },
    { id: 47, rolleId: 9, rolleName: "Verkauf Senior", rechtName: "kunde.bearbeiten" },
    { id: 48, rolleId: 9, rolleName: "Verkauf Senior", rechtName: "artikel.lesen" },
    { id: 49, rolleId: 9, rolleName: "Verkauf Senior", rechtName: "verkauf.lesen" },
    { id: 50, rolleId: 9, rolleName: "Verkauf Senior", rechtName: "verkauf.bearbeiten" },
    { id: 51, rolleId: 9, rolleName: "Verkauf Senior", rechtName: "service.lesen" },
    { id: 52, rolleId: 9, rolleName: "Verkauf Senior", rechtName: "service.bearbeiten" },
    { id: 53, rolleId: 9, rolleName: "Verkauf Senior", rechtName: "lager.lesen" },
    { id: 54, rolleId: 10, rolleName: "GeschÃ¤ftsfÃ¼hrung", rechtName: "*" }
];

// Logistik und Einkauf


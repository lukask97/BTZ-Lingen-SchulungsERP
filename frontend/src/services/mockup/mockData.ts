// Zentrale Testdaten
// Nur im Arbeitsspeicher

// Vertrieb und Stammdaten


export let kunden = [

    {
        id: 1,
        kundenNr: "DB10001",
        firma: "Campus Baumarkt GmbH",
        anschrift: "Industriestraße 3",
        plz: "49809",
        ort: "Lingen",
        segment: "Baumarkt",
        abc: "A",
        iban: "DE44500105175407324931",

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
        abc: "B",
        iban: "DE75512108001245126199",

        optionen: ["Bikes aller Art", "Leasing", "Reparatur Service"],

        website: "https://www.emsland.com/",
        notiz:""
    },

    {
        id: 3,
        kundenNr: "DB10003",
        firma: "Nordrad Campus Service",
        anschrift: "Lindenstraße 22",
        plz: "48529",
        ort: "Nordhorn",
        segment: "Dienstleistung",
        abc: "B",
        iban: "DE31500105170648489890",
        optionen: ["Service", "Wartung", "Abholung"],
        website: "https://www.nordrad-campus.de/",
        notiz:"Servicekunde mit regelmäßigen Wartungsanfragen."
    },

    {
        id: 4,
        kundenNr: "DB10004",
        firma: "Stadtwerke Lingen Mobilität",
        anschrift: "Kaiserstraße 14",
        plz: "49808",
        ort: "Lingen",
        segment: "Öffentliche Einrichtung",
        abc: "A",
        iban: "DE98500105179876543210",
        optionen: ["Flottenkunden", "Lastenbikes", "Sicherheitsausstattung"],
        website: "https://www.stadtwerke-lingen.de/",
        notiz:"Potenzial für größere Flottenbestellungen."
    },

    {
        id: 5,
        kundenNr: "DB10005",
        firma: "Jugendwerkstatt Ems-Vechte",
        anschrift: "Werkstraße 7",
        plz: "48431",
        ort: "Rheine",
        segment: "Bildung",
        abc: "C",
        iban: "DE12500105171234567890",
        optionen: ["Schulungsfahrräder", "Helme", "Projektmaterial"],
        website: "",
        notiz:"Neuer Projektkunde mit wiederkehrendem Trainingsbedarf."
    }

];


export let artikel = [

    {
        id: 1,
        artikelNr: "ART001",
        name: "Schulungsfahrrad City",
        kategorieId: 4,
        kategorie: "Fahrräder",
        kategoriePfad: "Fahrräder > Citybike",
        artikelTyp: "Baugruppe",
        einkaufspreis: 420,
        verkaufspreis: 799,
        bestand: 4,
        mindestmenge: 3,
        bedarfsmeldungBei: 5,
        beschreibung: "Komplettes Fahrrad als Beispiel für einen zusammengesetzten Artikel. Bereits nachbestellt und daher im Zulauf."
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
        kategorie: "Zubehör",
        kategoriePfad: "Zubehör > Helm",
        artikelTyp: "Einzelartikel",
        einkaufspreis: 24.5,
        verkaufspreis: 59.99,
        bestand: 12,
        mindestmenge: 10,
        bedarfsmeldungBei: 15,
        beschreibung: "Sicherer Fahrradhelm mit Zertifikat. Zusätzliche Menge ist bereits bestellt."
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
        beschreibung: "Rahmen als Einzelkomponente für Schulungsbeispiele. Bedarfsmeldung wird bereits erreicht."
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
        beschreibung: "Lenker für Fahrradmontage. Sicherheitsbestand ist aktuell unterschritten."
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
        beschreibung: "Komfortsattel für Schulungsfahrräder mit ausreichend freiem Bestand."
    }
];

export let artikelStueckliste = [
    { id: 1, hauptartikelId: 1, komponentenartikelId: 4, menge: 1 },
    { id: 2, hauptartikelId: 1, komponentenartikelId: 5, menge: 1 },
    { id: 3, hauptartikelId: 1, komponentenartikelId: 6, menge: 2 },
    { id: 4, hauptartikelId: 1, komponentenartikelId: 7, menge: 1 }
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
        beschreibung: "Einfache Werkstattleistung für Reparaturen."
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
        beschreibung: "Wartungspaket für Fahrräder oder Fuhrpark."
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
        id: 1, username: "admin", email: "admin@test.de", password: "admin", rolle: "Admin", name: "Administrator", permissions: ["*"]
    },

    {
        id: 2, username: "lager", email: "lager@test.de", password: "lager", rolle: "Lager", name: "Lager Mitarbeiter", permissions: ["artikel.lesen", "lager.buchen", "lager.lesen", "einkauf.lesen", "einkauf.bearbeiten"]
    },

    {
        id: 3, username: "buchhaltung", email: "buchhaltung@test.de", password: "buchhaltung", rolle: "Buchhaltung", name: "Buchhaltung", permissions: ["kunde.lesen", "kunde.anlegen", "kunde.bearbeiten", "rechnung.lesen", "rechnung.anlegen", "rechnung.bearbeiten", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten", "organisation.lesen", "buchhaltung.lesen", "buchhaltung.bearbeiten"]
    },
    {
        id: 4, username: "marketing", email: "marketing@test.de", password: "marketing", rolle: "Marketing", name: "Marketing Mitarbeiter", permissions: ["marketing.lesen", "marketing.bearbeiten", "verkauf.lesen"]
    },
    {
        id: 8, username: "einkauf", email: "einkauf@test.de", password: "einkauf", rolle: "Einkauf", name: "Einkauf Mitarbeiter", permissions: ["einkauf.lesen", "einkauf.bearbeiten", "lager.lesen", "lager.bearbeiten", "artikel.lesen", "artikel.bearbeiten"]
    },
    {
        id: 9, username: "verkauf", email: "verkauf@test.de", password: "verkauf", rolle: "Verkauf", name: "Verkauf Mitarbeiter", permissions: ["kunde.lesen", "kunde.anlegen", "kunde.bearbeiten", "artikel.lesen", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten"]
    },
    {
        id: 10, username: "personalwesen", email: "personalwesen@test.de", password: "personalwesen", rolle: "Personalwesen", name: "Personalwesen Mitarbeiter", permissions: ["personalwesen.lesen", "personalwesen.bearbeiten", "organisation.lesen"]
    },
    {
        id: 5, username: "verkauf_azubi", email: "verkauf.azubi@test.de", password: "verkauf", rolle: "Verkauf Azubi", name: "Verkauf Azubi", permissions: ["kunde.lesen", "artikel.lesen", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen"]
    },
    {
        id: 6, username: "verkauf_senior", email: "verkauf.senior@test.de", password: "verkauf", rolle: "Verkauf Senior", name: "Verkauf Senior", permissions: ["kunde.lesen", "kunde.anlegen", "kunde.bearbeiten", "artikel.lesen", "lager.lesen", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten"]
    },
    {
        id: 7, username: "gf", email: "gf@test.de", password: "gf", rolle: "Geschäftsführung", name: "Geschäftsführung", permissions: ["*"]
    }

];

export let rollen = [

    {
        id: 1, 
        name: "Admin", 
        beschreibung: "Vollständiger Zugriff auf alle Funktionen"
    },

    {
        id: 2,
        name: "Lager",
        beschreibung: "Verwaltung des Lagers und Bestände"
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
        beschreibung: "Verkauf für Auszubildende"
    },
    {
        id: 9,
        name: "Verkauf Senior",
        beschreibung: "Erweiterte Verkaufsrolle mit Freigaben"
    },
    {
        id: 10,
        name: "Geschäftsführung",
        beschreibung: "Vollzugriff für die Geschäftsführung"
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
    { id: 17, name: "gf.lesen", beschreibung: "Geschäftsführungsdaten lesen" },
    { id: 18, name: "gf.bearbeiten", beschreibung: "Geschäftsführungsdaten bearbeiten" },
    { id: 19, name: "kunde.lesen", beschreibung: "Kundendaten lesen" },
    { id: 20, name: "kunde.anzeigen", beschreibung: "Kundendaten anzeigen" },
    { id: 21, name: "kunde.anlegen", beschreibung: "Neue Kunden erstellen" },
    { id: 22, name: "kunde.bearbeiten", beschreibung: "Kundendaten bearbeiten" },
    { id: 23, name: "kunde.loeschen", beschreibung: "Kundendaten löschen" },
    { id: 24, name: "artikel.lesen", beschreibung: "Artikeldaten lesen" },
    { id: 25, name: "artikel.anzeigen", beschreibung: "Artikeldaten anzeigen" },
    { id: 26, name: "artikel.anlegen", beschreibung: "Neue Artikel erstellen" },
    { id: 27, name: "artikel.bearbeiten", beschreibung: "Artikeldaten bearbeiten" },
    { id: 28, name: "artikel.loeschen", beschreibung: "Artikeldaten löschen" },
    { id: 29, name: "rechnung.lesen", beschreibung: "Rechnungen lesen" },
    { id: 30, name: "rechnung.anzeigen", beschreibung: "Rechnungen anzeigen" },
    { id: 31, name: "rechnung.anlegen", beschreibung: "Neue Rechnungen erstellen" },
    { id: 32, name: "rechnung.bearbeiten", beschreibung: "Rechnungen bearbeiten" },
    { id: 33, name: "rechnung.loeschen", beschreibung: "Rechnungen löschen" },
    { id: 34, name: "lager.lesen", beschreibung: "Lagerdaten lesen" },
    { id: 35, name: "lager.anzeigen", beschreibung: "Lagerdaten anzeigen" },
    { id: 36, name: "lager.anlegen", beschreibung: "Neue Lager anlegen" },
    { id: 37, name: "lager.bearbeiten", beschreibung: "Lagerdaten bearbeiten" },
    { id: 38, name: "lager.loeschen", beschreibung: "Lagerdaten löschen" },
    { id: 39, name: "lager.buchen", beschreibung: "Lagerbewegungen buchen" },
    { id: 40, name: "benutzer.lesen", beschreibung: "Benutzerdaten lesen" },
    { id: 41, name: "benutzer.anzeigen", beschreibung: "Benutzerdaten anzeigen" },
    { id: 42, name: "benutzer.anlegen", beschreibung: "Neue Benutzer anlegen" },
    { id: 43, name: "benutzer.bearbeiten", beschreibung: "Benutzerdaten bearbeiten" },
    { id: 44, name: "benutzer.loeschen", beschreibung: "Benutzerdaten löschen" },
    { id: 45, name: "rollen.lesen", beschreibung: "Rollen lesen" },
    { id: 46, name: "rollen.anzeigen", beschreibung: "Rollen anzeigen" },
    { id: 47, name: "rollen.anlegen", beschreibung: "Neue Rollen anlegen" },
    { id: 48, name: "rollen.bearbeiten", beschreibung: "Rollen bearbeiten" },
    { id: 49, name: "rollen.loeschen", beschreibung: "Rollen löschen" },
    { id: 50, name: "rechte.lesen", beschreibung: "Rechte lesen" },
    { id: 51, name: "rechte.anzeigen", beschreibung: "Rechte anzeigen" },
    { id: 52, name: "rechte.anlegen", beschreibung: "Neue Rechte anlegen" },
    { id: 53, name: "rechte.bearbeiten", beschreibung: "Rechte bearbeiten" },
    { id: 54, name: "rechte.loeschen", beschreibung: "Rechte löschen" }
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
    { id: 54, rolleId: 10, rolleName: "Geschäftsführung", rechtName: "*" }
];

// Logistik und Einkauf

export let lager = [

    {
        id: 1, name: "Hauptlager", standort: "Lingen, Industriestraße 3", kapazitaet: 5000
    },

    {
        id: 2, name: "Außenlager", standort: "Meppen, Gewerbepark Nord", kapazitaet: 2000
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
        permissions: ["kunde.lesen", "kunde.anlegen", "kunde.bearbeiten", "rechnung.lesen", "rechnung.anlegen", "rechnung.bearbeiten", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten", "organisation.lesen", "buchhaltung.lesen", "buchhaltung.bearbeiten"]
    },
    {
        id: 4,
        username: "marketing",
        password: "marketing",
        name: "Marketing Mitarbeiter",
        rolle: "Marketing",
        permissions: ["marketing.lesen", "marketing.bearbeiten", "verkauf.lesen"]
    },
    {
        id: 8,
        username: "einkauf",
        password: "einkauf",
        name: "Einkauf Mitarbeiter",
        rolle: "Einkauf",
        permissions: ["einkauf.lesen", "einkauf.bearbeiten", "lager.lesen", "lager.bearbeiten", "artikel.lesen", "artikel.bearbeiten"]
    },
    {
        id: 9,
        username: "verkauf",
        password: "verkauf",
        name: "Verkauf Mitarbeiter",
        rolle: "Verkauf",
        permissions: ["kunde.lesen", "kunde.anlegen", "kunde.bearbeiten", "artikel.lesen", "lager.lesen", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten"]
    },
    {
        id: 10,
        username: "personalwesen",
        password: "personalwesen",
        name: "Personalwesen Mitarbeiter",
        rolle: "Personalwesen",
        permissions: ["personalwesen.lesen", "personalwesen.bearbeiten", "organisation.lesen"]
    },
    {
        id: 5,
        username: "verkauf_azubi",
        password: "verkauf",
        name: "Verkauf Azubi",
        rolle: "Verkauf Azubi",
        permissions: ["kunde.lesen", "artikel.lesen", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen"]
    },
    {
        id: 6,
        username: "verkauf_senior",
        password: "verkauf",
        name: "Verkauf Senior",
        rolle: "Verkauf Senior",
        permissions: ["kunde.lesen", "kunde.anlegen", "kunde.bearbeiten", "artikel.lesen", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten"]
    },
    {
        id: 7,
        username: "gf",
        password: "gf",
        name: "Geschäftsführung",
        rolle: "Geschäftsführung",
        permissions: ["*"]
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
        iban: "DE91500105178640732418",
        fürBts: "Alternativlieferant für Zubehör und Lastenbikes",
        bewertung: 4,
        abc: "B"
    },
    {
        id: 2,
        lieferantenNr: "KR10002",
        firma: "Kalkhoff Werke GmbH",
        anschrift: "Europa-Allee 26",
        plz: "49685",
        ort: "Emstek",
        segment: "Fahrradwerk, Fahrradzubehör, Einzelteile, Service",
        iban: "DE68500500001234567890",
        fürBts: "",
        bewertung: 5,
        abc: "A"
    },
    {
        id: 3,
        lieferantenNr: "KR10003",
        firma: "Meister Handels GmbH",
        anschrift: "Industriestraße 9",
        plz: "",
        ort: "",
        segment: "",
        iban: "DE30500105170648489890",
        fürBts: "",
        bewertung: 3,
        abc: "C"
    },
    {
        id: 4,
        lieferantenNr: "KR10004",
        firma: "Campus Sonderbaumarkt GmbH",
        anschrift: "Industriestraße 9",
        plz: "49809",
        ort: "Lingen",
        segment: "Klassischer Baumarkt mit Fahrradabteilung",
        iban: "DE02500105170648489901",
        fürBts: "Soll Lieferant sein und Kunde",
        bewertung: 3,
        abc: "C"
    }
];

export let bestellungen = [
    {
        id: 1,
        bestellNr: "EK-2026-001",
        lieferantId: 1,
        datum: "2026-07-20",
        status: "angefragt",
        anfrageQuelle: "lieferantenvergleich",
        lehrkraftAngebotAm: "2026-07-21",
        lehrkraftAngebotPreis: 73.5,
        lehrkraftLieferzeitTage: 5,
        lehrkraftAngebotText: "Standardangebot für drei Helme aus dem Vergleich."
    },
    {
        id: 2,
        bestellNr: "EK-2026-002",
        lieferantId: 2,
        datum: "2026-08-01",
        status: "versendet",
        anfrageQuelle: "bedarfsmeldung",
        bedarfsmeldungId: "auto-artikel-1",
        rechnungStatus: "offen",
        faelligAm: "2026-08-20",
        anfrageNotiz: "Nachbestellung für Citybikes im Zulauf."
    }
];

export let bestellpositionen = [
    { id: 1, bestellungId: 1, artikelId: 3, artikelNr: "ART003", menge: 3, einzelpreis: 24.5 },
    { id: 2, bestellungId: 2, artikelId: 1, artikelNr: "ART001", menge: 5, einzelpreis: 420 }
];

export let kategorien = [
    {
        id: 1,
        name: "Fahrräder",
        parentId: "",
        beschreibung: "Komplette Fahrräder und fahrbereite Baugruppen."
    },
    {
        id: 4,
        name: "Citybike",
        parentId: 1,
        beschreibung: "Komplette City- und Schulungsfahrräder."
    },
    {
        id: 5,
        name: "Bekleidung",
        parentId: "",
        beschreibung: "Bekleidung und Sicherheitsausstattung."
    },
    {
        id: 6,
        name: "Sicherheitsbekleidung",
        parentId: 5,
        beschreibung: "Warn- und Schutzkleidung für den Einsatz."
    },
    {
        id: 7,
        name: "Zubehör",
        parentId: "",
        beschreibung: "Zusatzprodukte rund ums Fahrrad."
    },
    {
        id: 8,
        name: "Helm",
        parentId: 7,
        beschreibung: "Helme und Schutzzubehör."
    },
    {
        id: 9,
        name: "Mechanik",
        parentId: "",
        beschreibung: "Mechanische Bauteile und Einzelkomponenten."
    },
    {
        id: 10,
        name: "Rahmen",
        parentId: 9,
        beschreibung: "Rahmen und tragende Elemente."
    },
    {
        id: 11,
        name: "Lenker",
        parentId: 9,
        beschreibung: "Lenker und Bedienelemente."
    },
    {
        id: 12,
        name: "Reifen",
        parentId: 9,
        beschreibung: "Reifen und laufende Teile."
    },
    {
        id: 13,
        name: "Sattel",
        parentId: 9,
        beschreibung: "Saettel und Sitzkomponenten."
    },
    {
        id: 14,
        name: "Fahrradkette",
        parentId: 9,
        beschreibung: "Antriebskomponenten wie Ketten und Kettenräder."
    }
];

// Der Verkaufskreislauf bleibt ebenso kompakt: Angebot -> Auftrag.
// Angebots-, Auftrags- und Kommunikationsdaten

export let angebote = [
    {
        id: 1,
        angebotsNr: "ANG-2026-001.0",
        angebotsBasisNr: "ANG-2026-001",
        revision: 0,
        vorgangId: "anfrage-1",
        anfrageId: 1,
        kundeId: 1,
        datum: "2026-07-22",
        gueltigBis: "2026-08-04",
        rabattBetrag: 0,
        gesamtbetrag: 1348.5,
        status: "überarbeitet"
    },
    {
        id: 2,
        angebotsNr: "ANG-2026-001.1",
        angebotsBasisNr: "ANG-2026-001",
        revision: 1,
        vorgangId: "anfrage-1",
        anfrageId: 1,
        kundeId: 1,
        datum: "2026-07-24",
        gueltigBis: "2026-08-06",
        rabattBetrag: 0,
        gesamtbetrag: 1348.5,
        status: "angenommen"
    },
    {
        id: 3,
        angebotsNr: "ANG-2026-002.0",
        angebotsBasisNr: "ANG-2026-002",
        revision: 0,
        vorgangId: "anfrage-2",
        anfrageId: 2,
        kundeId: 2,
        datum: "2026-07-28",
        gueltigBis: "2026-08-11",
        rabattBetrag: 50,
        gesamtbetrag: 1749.7,
        status: "angenommen"
    },
    {
        id: 4,
        angebotsNr: "ANG-2026-003.0",
        angebotsBasisNr: "ANG-2026-003",
        revision: 0,
        vorgangId: "anfrage-3",
        anfrageId: 3,
        kundeId: 1,
        datum: "2026-08-05",
        gueltigBis: "2026-08-19",
        rabattBetrag: 0,
        gesamtbetrag: 799,
        status: "wartet auf Antwort"
    },
    {
        id: 5,
        angebotsNr: "ANG-2026-004.0",
        angebotsBasisNr: "ANG-2026-004",
        revision: 0,
        vorgangId: "anfrage-4",
        anfrageId: 4,
        kundeId: 3,
        datum: "2026-08-02",
        gueltigBis: "2026-08-16",
        rabattBetrag: 0,
        gesamtbetrag: 390,
        status: "angenommen"
    },
    {
        id: 6,
        angebotsNr: "ANG-2026-005.0",
        angebotsBasisNr: "ANG-2026-005",
        revision: 0,
        vorgangId: "anfrage-5",
        anfrageId: 5,
        kundeId: 5,
        datum: "2026-08-11",
        gueltigBis: "2026-08-25",
        rabattBetrag: 25,
        gesamtbetrag: 953.97,
        status: "in Vorbereitung"
    }
];

export let angebotspositionen = [
    {
        id: 1,
        angebotId: 1,
        artikelId: 2,
        leistungTyp: "Artikel",
        menge: 15,
        einzelpreis: 89.9
    },
    {
        id: 2,
        angebotId: 2,
        artikelId: 2,
        leistungTyp: "Artikel",
        menge: 15,
        einzelpreis: 89.9
    },
    {
        id: 3,
        angebotId: 3,
        artikelId: 3,
        leistungTyp: "Artikel",
        menge: 30,
        einzelpreis: 59.99
    },
    {
        id: 4,
        angebotId: 4,
        artikelId: 1,
        leistungTyp: "Artikel",
        menge: 1,
        einzelpreis: 799
    },
    {
        id: 5,
        angebotId: 5,
        serviceId: 2,
        leistungTyp: "Service",
        menge: 6,
        einzelpreis: 65
    },
    {
        id: 6,
        angebotId: 6,
        artikelId: 1,
        leistungTyp: "Artikel",
        menge: 1,
        einzelpreis: 799
    },
    {
        id: 7,
        angebotId: 6,
        artikelId: 3,
        leistungTyp: "Artikel",
        menge: 3,
        einzelpreis: 59.99
    }
];

export let auftraege = [
    {
        id: 1,
        auftragNr: "AU-2026-001",
        kundeId: 1,
        anfrageId: 1,
        vorgangId: "anfrage-1",
        datum: "2026-07-25",
        status: "abgerechnet",
        rabattBetrag: 0,
        gesamtbetrag: 1348.5,
        faelligAm: "2026-08-08",
        angebotId: 2
    },
    {
        id: 2,
        auftragNr: "AU-2026-002",
        kundeId: 2,
        anfrageId: 2,
        vorgangId: "anfrage-2",
        datum: "2026-07-30",
        status: "bezahlt",
        rabattBetrag: 50,
        gesamtbetrag: 1749.7,
        faelligAm: "2026-08-10",
        angebotId: 3
    },
    {
        id: 3,
        auftragNr: "AU-2026-003",
        kundeId: 1,
        anfrageId: 3,
        vorgangId: "anfrage-3",
        datum: "2026-08-08",
        status: "offen",
        rabattBetrag: 0,
        gesamtbetrag: 799,
        faelligAm: "2026-08-22",
        angebotId: 4
    },
    {
        id: 4,
        auftragNr: "AU-2026-004",
        kundeId: 3,
        anfrageId: 4,
        vorgangId: "anfrage-4",
        datum: "2026-08-03",
        status: "offen",
        rabattBetrag: 0,
        gesamtbetrag: 390,
        faelligAm: "2026-08-17",
        angebotId: 5
    },
    {
        id: 5,
        auftragNr: "AU-2026-005",
        kundeId: 5,
        anfrageId: 5,
        vorgangId: "anfrage-5",
        datum: "2026-08-12",
        status: "offen",
        rabattBetrag: 25,
        gesamtbetrag: 953.97,
        faelligAm: "2026-08-26",
        angebotId: 6
    }
];

export let auftragspositionen = [
    { id: 1, auftragId: 1, artikelId: 2, leistungTyp: "Artikel", menge: 15, einzelpreis: 89.9 },
    { id: 2, auftragId: 2, artikelId: 3, leistungTyp: "Artikel", menge: 30, einzelpreis: 59.99 },
    { id: 3, auftragId: 3, artikelId: 1, leistungTyp: "Artikel", menge: 1, einzelpreis: 799 },
    { id: 4, auftragId: 4, serviceId: 2, leistungTyp: "Service", menge: 6, einzelpreis: 65 },
    { id: 5, auftragId: 5, artikelId: 1, leistungTyp: "Artikel", menge: 1, einzelpreis: 799 },
    { id: 6, auftragId: 5, artikelId: 3, leistungTyp: "Artikel", menge: 3, einzelpreis: 59.99 }
];

export let reklamationen = [
    {
        id: 1,
        reklamationsNr: "REK-2026-001",
        kundeId: 2,
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
        vorgangId: "anfrage-1",
        angebotId: 1,
        kanal: "Telefon",
        status: "in Bearbeitung",
        datum: "2026-07-24",
        anliegen: "Frage nach Lieferzeiten für Sicherheitsjacken."
    }
    ,
    {
        id: 4,
        typ: "Serviceanfrage",
        kundeId: 3,
        vorgangId: "anfrage-4",
        angebotId: 5,
        kanal: "E-Mail",
        status: "erledigt",
        datum: "2026-08-01",
        anliegen: "Bitte Angebot für eine mobile Wartung von sechs Fahrrädern erstellen."
    },
    {
        id: 5,
        typ: "Projektanfrage",
        kundeId: 5,
        vorgangId: "anfrage-5",
        angebotId: 6,
        kanal: "Telefon",
        status: "offen",
        datum: "2026-08-10",
        anliegen: "Anfrage für Helme und Schulungsfahrräder für ein Herbstprojekt."
    }
];

export let nachrichten = [
    {
        id: 1,
        vorgangId: "anfrage-1",
        anfrageId: 1,
        angebotId: "",
        kundeId: 1,
        datum: "2026-07-24",
        senderRolle: "Kunde",
        senderName: "Campus Baumarkt GmbH",
        kanal: "Telefon",
        betreff: "Lieferzeiten für Sicherheitsjacken",
        nachricht: "Wir benötigen eine Rückmeldung zu Lieferzeiten und möglichen Mengenstaffeln.",
        typ: "Anfrage"
    },
    {
        id: 2,
        vorgangId: "anfrage-1",
        anfrageId: 1,
        angebotId: 1,
        kundeId: 1,
        datum: "2026-07-25",
        senderRolle: "Verkauf",
        senderName: "Schülerfirma Verkauf",
        kanal: "E-Mail",
        betreff: "Angebot ANG-2026-001.0",
        nachricht: "Ein erstes Angebot wurde erstellt und an den Kunden zur Prüfung weitergegeben.",
        typ: "Angebot"
    }
    ,
    {
        id: 3,
        vorgangId: "anfrage-4",
        anfrageId: 4,
        angebotId: "",
        kundeId: 3,
        datum: "2026-08-01",
        senderRolle: "Kunde",
        senderName: "Nordrad Campus Service",
        kanal: "E-Mail",
        betreff: "Mobile Wartung für sechs Fahrräder",
        nachricht: "Bitte senden Sie uns ein Angebot für eine mobile Wartung von sechs Fahrrädern vor Ort.",
        typ: "Anfrage"
    },
    {
        id: 4,
        vorgangId: "anfrage-4",
        anfrageId: 4,
        angebotId: 5,
        auftragId: 4,
        kundeId: 3,
        datum: "2026-08-02",
        senderRolle: "Verkauf",
        senderName: "Schülerfirma Verkauf",
        kanal: "E-Mail",
        betreff: "Angebot ANG-2026-004.0",
        nachricht: "Das Serviceangebot wurde erstellt und vom Kunden direkt bestätigt.",
        typ: "Angebot"
    },
    {
        id: 5,
        vorgangId: "anfrage-5",
        anfrageId: 5,
        angebotId: "",
        kundeId: 5,
        datum: "2026-08-10",
        senderRolle: "Kunde",
        senderName: "Jugendwerkstatt Ems-Vechte",
        kanal: "Telefon",
        betreff: "Projektanfrage Herbst",
        nachricht: "Wir planen ein Herbstprojekt und benötigen Schulungsfahrräder sowie mehrere Helme.",
        typ: "Anfrage"
    },
    {
        id: 6,
        vorgangId: "anfrage-5",
        anfrageId: 5,
        angebotId: 6,
        auftragId: 5,
        kundeId: 5,
        datum: "2026-08-11",
        senderRolle: "Verkauf",
        senderName: "Schülerfirma Verkauf",
        kanal: "E-Mail",
        betreff: "Angebot ANG-2026-005.0",
        nachricht: "Das Angebot ist intern vorbereitet und wartet noch auf die finale Freigabe vor dem Versand.",
        typ: "Angebot"
    }
];

// Buchhaltung und Führung

export let zahlungen = [
    {
        id: 1,
        auftragId: 2,
        rechnungId: 2,
        zahlungsart: "Eingang",
        datum: "2026-07-22",
        ausfuehrenAm: "2026-07-22",
        ausfuehrungsdatum: "2026-07-22",
        betrag: 1799.7,
        name: "Emsland Tourismus GmbH",
        iban: "DE75512108001245126199",
        verwendungszweck: "Rechnung RG-2026-002",
        methode: "Überweisung",
        status: "ausgefuehrt"
    },
    {
        id: 2,
        zahlungsart: "Eingang",
        datum: "2026-08-06",
        ausfuehrenAm: "2026-08-06",
        ausfuehrungsdatum: "2026-08-06",
        betrag: 1348.5,
        name: "Campus Baumarkt GmbH",
        iban: "DE44500105175407324931",
        verwendungszweck: "Zahlung zu RG-2026-001",
        methode: "Überweisung",
        status: "offen"
    },
    {
        id: 3,
        zahlungsart: "Ausgang",
        datum: "2026-08-07",
        ausfuehrenAm: "2026-08-07",
        ausfuehrungsdatum: "2026-08-07",
        betrag: 2100,
        name: "Kalkhoff Werke GmbH",
        iban: "DE68500500001234567890",
        verwendungszweck: "Eingangsrechnung ER-2026-002",
        methode: "Überweisung",
        status: "offen"
    }
];

export let mahnungen = [
    {
        id: 1,
        rechnungId: 1,
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
        rechnungId: 2,
        datum: "2026-07-21",
        status: "archiviert",
        beschreibung: "Digitale Ablage für die erste Beispielrechnung."
    },
    {
        id: 2,
        typ: "Zahlungsbeleg",
        bezugTyp: "Rechnung",
        rechnungId: 2,
        datum: "2026-07-22",
        status: "archiviert",
        beschreibung: "Zahlungseingang per Überweisung wurde abgelegt."
    },
    {
        id: 3,
        typ: "Mahnschreiben",
        bezugTyp: "Rechnung",
        rechnungId: 1,
        datum: "2026-07-23",
        status: "versendet",
        beschreibung: "1. Mahnung für eine fällige Ausgangsrechnung."
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
        empfohlenAktion: "Angebote und Reklamationen im Unterricht vergleichen.",
        startdatum: "2026-07-21",
        enddatum: "2026-07-27",
        intervall: "Woche"
    },
    {
        id: 2,
        titel: "Lagerüberblick",
        bereich: "logistik",
        datum: "2026-07-25",
        status: "Entwurf",
        zusammenfassung: "Niedrige Bestände bei Lastenrädern und Helmen.",
        zielgruppe: "Klasse",
        empfohlenAktion: "Bedarfsmeldung und Bestellung aus dem Lagerstand ableiten.",
        startdatum: "2026-07-01",
        enddatum: "2026-07-31",
        intervall: "Monat"
    }
];

// Versand und Retouren

export let versandauftraege = [
    {
        id: 1,
        versandNr: "LOG-2026-001",
        auftragId: 1,
        datum: "2026-07-26",
        status: "in Vorbereitung",
        transport: "Spedition Nord"
    },
    {
        id: 2,
        versandNr: "LOG-2026-002",
        auftragId: 2,
        datum: "2026-07-31",
        status: "versendet",
        transport: "Hauszustellung"
    },
    {
        id: 3,
        versandNr: "LOG-2026-004",
        auftragId: 4,
        datum: "2026-08-04",
        status: "versendet",
        transport: "Serviceteam mobil"
    }
];

export let retouren = [
    {
        id: 1,
        retourenNr: "RET-2026-001",
        kundeId: 2,
        artikelId: 3,
        datum: "2026-07-25",
        status: "eingegangen",
        grund: "Transportschaden"
    }
];

// Personalwesen

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
        dokumentTyp: "Vertragsunterlage",
        titel: "Arbeitsvertrag Fachkraft Lager",
        datum: "2024-08-01",
        status: "archiviert",
        notiz: "Grundlage für die simulierte Personalakte."
    },
    {
        id: 2,
        mitarbeiterId: 1,
        dokumentTyp: "Onboarding-Checkliste",
        titel: "Einarbeitung Lager und Sicherheit",
        datum: "2024-08-02",
        status: "abgeschlossen",
        notiz: "Einweisung in Lagerordnung, Arbeitsschutz und Scanner."
    },
    {
        id: 3,
        mitarbeiterId: 2,
        dokumentTyp: "Urlaubsantrag",
        titel: "Urlaubsantrag August 2026",
        datum: "2026-07-26",
        status: "offen",
        notiz: "Antrag liegt zur Genehmigung vor."
    },
    {
        id: 4,
        mitarbeiterId: 2,
        dokumentTyp: "Schulungsnachweis",
        titel: "Marketing-Schulung Kampagnenplanung",
        datum: "2026-07-15",
        status: "archiviert",
        notiz: "Teilnahmebescheinigung für interne Weiterbildung."
    }
];

// Dokumente und Finanzen

export let vertriebsdokumente = [
    {
        id: 1,
        auftragId: 1,
        angebotId: 1,
        anfrageId: 1,
        vorgangId: "anfrage-1",
        dokumentTyp: "Auftragsbestätigung",
        titel: "Auftragsbestätigung AU-2026-001",
        datum: "2026-07-25",
        status: "fertig",
        notiz: "Bestellung bestätigt und Liefertermin angekündigt."
    },
    {
        id: 2,
        auftragId: 1,
        angebotId: 1,
        anfrageId: 1,
        vorgangId: "anfrage-1",
        dokumentTyp: "Lieferschein",
        dokumentNr: "LS-2026-001",
        titel: "Lieferschein LS-2026-001",
        datum: "2026-07-26",
        status: "Entwurf",
        notiz: "Wird mit dem Versand abgestimmt."
    },
    {
        id: 3,
        auftragId: 2,
        angebotId: 3,
        anfrageId: 2,
        vorgangId: "anfrage-2",
        dokumentTyp: "Auftragsbestätigung",
        titel: "Auftragsbestätigung AU-2026-002",
        datum: "2026-07-30",
        status: "versendet",
        versendetAm: "2026-07-30",
        notiz: "Kunde hat die Auftragsbestätigung am selben Tag erhalten."
    },
    {
        id: 4,
        auftragId: 2,
        angebotId: 3,
        anfrageId: 2,
        vorgangId: "anfrage-2",
        dokumentTyp: "Lieferschein",
        dokumentNr: "LS-2026-002",
        titel: "Lieferschein LS-2026-002",
        datum: "2026-07-31",
        status: "entgegengenommen",
        versendetAm: "2026-07-31",
        annahmeAm: "2026-08-01",
        notiz: "Lieferung wurde beim Kunden angenommen."
    },
    {
        id: 5,
        auftragId: 2,
        angebotId: 3,
        anfrageId: 2,
        vorgangId: "anfrage-2",
        dokumentTyp: "Warenbegleitpapier",
        titel: "Warenbegleitpapier AU-2026-002",
        datum: "2026-07-31",
        status: "versendet",
        versendetAm: "2026-07-31",
        notiz: "Begleitpapier für die Helm-Lieferung."
    },
    {
        id: 6,
        auftragId: 4,
        angebotId: 5,
        anfrageId: 4,
        vorgangId: "anfrage-4",
        dokumentTyp: "Auftragsbestätigung",
        titel: "Auftragsbestätigung AU-2026-004",
        datum: "2026-08-03",
        status: "versendet",
        versendetAm: "2026-08-03",
        notiz: "Serviceauftrag wurde direkt bestätigt."
    },
    {
        id: 7,
        auftragId: 4,
        angebotId: 5,
        anfrageId: 4,
        vorgangId: "anfrage-4",
        dokumentTyp: "Transportpapier",
        titel: "Transportpapier AU-2026-004",
        datum: "2026-08-04",
        status: "versendet",
        versendetAm: "2026-08-04",
        notiz: "Einsatzunterlagen für das mobile Serviceteam."
    },
    {
        id: 8,
        auftragId: 5,
        angebotId: 6,
        anfrageId: 5,
        vorgangId: "anfrage-5",
        dokumentTyp: "Auftragsbestätigung",
        titel: "Auftragsbestätigung AU-2026-005",
        datum: "2026-08-12",
        status: "erstellt",
        notiz: "Liegt vorbereitet vor und wartet auf den Versand nach Abschluss der Freigabe."
    }
];

export let einkaufsdokumente = [
    {
        id: 1,
        bestellungId: 1,
        dokumentTyp: "Bedarfsmeldung",
        titel: "Bedarfsmeldung Lastenrad Premium",
        datum: "2026-07-18",
        status: "freigegeben",
        notiz: "Lagerbestand unterschreitet den Zielwert."
    },
    {
        id: 2,
        bestellungId: 1,
        dokumentTyp: "Anfrage",
        titel: "Anfrage Lieferzeit und Staffelpreise",
        datum: "2026-07-19",
        status: "versendet",
        notiz: "Lieferant soll Lieferzeit und Preisstaffel bestätigen."
    },
    {
        id: 3,
        bestellungId: 1,
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
        konto: "firma",
        betreff: "Stammkapitaleinzahlung",
        info: "",
        soll: 0,
        haben: 25000,
        saldo: 25000
    },
    {
        id: 2,
        datum: "2026-07-22",
        konto: "verkauf",
        betreff: "Zahlungseingang Rechnung RG-2026-002",
        info: "Verbleibt bis zum Wochenabschluss auf dem Verkaufskonto",
        soll: 0,
        haben: 1799.7,
        saldo: 1799.7
    },
    {
        id: 3,
        datum: "2026-07-24",
        konto: "einkauf",
        betreff: "Materialeinkauf Sicherheitshelme",
        info: "Didaktische Beispielausgabe für das Einkaufskonto",
        soll: 420,
        haben: 0,
        saldo: -420
    }
];

export let unternehmen = [
    {
        id: 1,
        firmenname: "UEF Lin",
        branche: "Gross- & Einzelhandel Sport, Freizeit, Rad",
        steuernummer: "88 888 89480",
        ustIdNr: "DE194227226",
        handelsregisterNr: "HRB 5985",
        betriebsNr: "11129381",
        unternehmerNr: "",
        strasse: "Schwarzer Weg 16",
        plzOrt: "49809 Lingen (Ems)",
        bundesland: "Niedersachsen",
        telefon: "0591-97304-58",
        mail: "de01BTS@zuef-edu.de",
        unternehmensNr: "123456789123 001",
        amtsgericht: "Lingen (EMS)",
        finanzamtNr: "",
        firmaKontoname: "UEF Lin",
        firmaBankName: "Ruhrtal-Bank",
        firmaIban: "DE36360440810021070851",
        firmaKontoNr: "210 708 51",
        firmaBic: "RUHRDEE0",
        firmaBlz: "360 440 81",
        verkaufKontoname: "UEF Lin-VK",
        verkaufBankName: "Ruhrtal-Bank",
        verkaufIban: "DE36360440810021070852",
        verkaufKontoNr: "210 708 52",
        verkaufBic: "RUHRDEE0",
        verkaufBlz: "360 440 81",
        einkaufKontoname: "UEF Lin-EK",
        einkaufBankName: "Ruhrtal-Bank",
        einkaufIban: "DE36360440810021070853",
        einkaufKontoNr: "210 708 53",
        einkaufBic: "RUHRDEE0",
        einkaufBlz: "360 440 81"
    }
];

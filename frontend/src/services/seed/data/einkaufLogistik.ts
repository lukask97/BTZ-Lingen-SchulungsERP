export let lager = [

    {
        id: 1, name: "Hauptlager", standort: "Lingen, IndustriestraÃŸe 3", kapazitaet: 5000
    },

    {
        id: 2, name: "AuÃŸenlager", standort: "Meppen, Gewerbepark Nord", kapazitaet: 2000
    }

];

export let users = [

    {
        id: 1, username: "admin", password: "admin", vorname: "Test", nachname: "Admin", permissions: ["*"]
    },


    {
        id: 2,
        username: "lager",
        password: "lager",
        vorname: "Lager",
        nachname: "Leo",
        permissions: ["artikel.lesen", "lager.buchen", "lager.lesen", "einkauf.lesen", "einkauf.bearbeiten"]
    },


    {
        id: 3,
        username: "buchhaltung",
        password: "buchhaltung",
        vorname: "Bilanz",
        nachname: "Britta",
        permissions: ["kunde.lesen", "kunde.anlegen", "kunde.bearbeiten", "rechnung.lesen", "rechnung.anlegen", "rechnung.bearbeiten", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten", "organisation.lesen", "buchhaltung.lesen", "buchhaltung.bearbeiten"]
    },
    {
        id: 4,
        username: "marketing",
        password: "marketing",
        vorname: "Marketing",
        nachname: "Mara",
        rolle: "Marketing",
        permissions: ["marketing.lesen", "marketing.bearbeiten", "verkauf.lesen"]
    },
    {
        id: 8,
        username: "einkauf",
        password: "einkauf",
        vorname: "Einkauf",
        nachname: "Eva",
        rolle: "Einkauf",
        permissions: ["einkauf.lesen", "einkauf.bearbeiten", "lager.lesen", "lager.bearbeiten", "artikel.lesen", "artikel.bearbeiten"]
    },
    {
        id: 10,
        username: "personalwesen",
        password: "personalwesen",
        vorname: "HR",
        nachname: "Hannah",
        rolle: "Personalwesen",
        permissions: ["personalwesen.lesen", "personalwesen.bearbeiten", "organisation.lesen"]
    },
    {
        id: 5,
        username: "verkauf_azubi",
        password: "verkauf",
        vorname: "Azubi",
        nachname: "Alex",
        rolle: "Verkauf Azubi",
        permissions: ["kunde.lesen", "artikel.lesen", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen"]
    },
    {
        id: 6,
        username: "verkauf_senior",
        password: "verkauf",
        vorname: "Senior",
        nachname: "Sascha",
        rolle: "Verkauf Senior",
        permissions: ["kunde.lesen", "kunde.anlegen", "kunde.bearbeiten", "artikel.lesen", "verkauf.lesen", "verkauf.bearbeiten", "service.lesen", "service.bearbeiten"]
    },
    {
        id: 7,
        username: "gf",
        password: "gf",
        vorname: "Chef",
        nachname: "Carsten",
        rolle: "GeschÃ¤ftsfÃ¼hrung",
        permissions: ["*"]
    }

];

// Lieferanten und Bestellungen bilden den bewusst einfachen Einkaufskreislauf
// ab: Bestellung -> Wareneingang -> erhÃ¶hter Artikelbestand.
export let lieferanten = [
    {
        id: 1,
        lieferantenNr: "KR10001",
        firma: "Weber GmbH",
        anschrift: "Max-Weber Str. 2",
        plz: "49716",
        ort: "Meppen",
        segment: "Fahrradbekleidung, Sicherheitsbekleidung, SonderfahrrÃ¤der, Lastenbikes",
        iban: "DE91500105178640732418",
        fuerBts: "Alternativlieferant fÃ¼r ZubehÃ¶r und Lastenbikes",
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
        segment: "Fahrradwerk, FahrradzubehÃ¶r, Einzelteile, Service",
        iban: "DE68500500001234567890",
        fuerBts: "",
        bewertung: 5,
        abc: "A"
    },
    {
        id: 3,
        lieferantenNr: "KR10003",
        firma: "Meister Handels GmbH",
        anschrift: "IndustriestraÃŸe 9",
        plz: "",
        ort: "",
        segment: "",
        iban: "DE30500105170648489890",
        fuerBts: "",
        bewertung: 3,
        abc: "C"
    },
    {
        id: 4,
        lieferantenNr: "KR10004",
        firma: "Campus Sonderbaumarkt GmbH",
        anschrift: "IndustriestraÃŸe 9",
        plz: "49809",
        ort: "Lingen",
        segment: "Klassischer Baumarkt mit Fahrradabteilung",
        iban: "DE02500105170648489901",
        fuerBts: "Soll Lieferant sein und Kunde",
        bewertung: 3,
        abc: "C"
    }
];

export let lieferantenArtikelStaffeln = [
    { id: 1, artikelId: 1, lieferantId: 2, mindestbestellmenge: 1, stueckpreis: 438, lieferzeitTage: 4 },
    { id: 2, artikelId: 1, lieferantId: 2, mindestbestellmenge: 5, stueckpreis: 424, lieferzeitTage: 7 },
    { id: 3, artikelId: 1, lieferantId: 2, mindestbestellmenge: 10, stueckpreis: 409, lieferzeitTage: 12 },
    { id: 4, artikelId: 3, lieferantId: 1, mindestbestellmenge: 10, stueckpreis: 23.9, lieferzeitTage: 2 },
    { id: 5, artikelId: 3, lieferantId: 1, mindestbestellmenge: 25, stueckpreis: 22.4, lieferzeitTage: 5 },
    { id: 6, artikelId: 3, lieferantId: 3, mindestbestellmenge: 5, stueckpreis: 24.7, lieferzeitTage: 1 },
    { id: 7, artikelId: 3, lieferantId: 3, mindestbestellmenge: 20, stueckpreis: 22.9, lieferzeitTage: 4 },
    { id: 8, artikelId: 5, lieferantId: 2, mindestbestellmenge: 10, stueckpreis: 17.6, lieferzeitTage: 3 },
    { id: 9, artikelId: 5, lieferantId: 2, mindestbestellmenge: 50, stueckpreis: 16.4, lieferzeitTage: 10 },
    { id: 10, artikelId: 6, lieferantId: 2, mindestbestellmenge: 20, stueckpreis: 14.2, lieferzeitTage: 3 },
    { id: 11, artikelId: 6, lieferantId: 2, mindestbestellmenge: 50, stueckpreis: 13.4, lieferzeitTage: 8 },
    { id: 12, artikelId: 6, lieferantId: 4, mindestbestellmenge: 10, stueckpreis: 14.8, lieferzeitTage: 2 },
    { id: 13, artikelId: 6, lieferantId: 4, mindestbestellmenge: 40, stueckpreis: 13.6, lieferzeitTage: 7 },
    { id: 14, artikelId: 10, lieferantId: 2, mindestbestellmenge: 1, stueckpreis: 515, lieferzeitTage: 6 },
    { id: 15, artikelId: 10, lieferantId: 2, mindestbestellmenge: 3, stueckpreis: 498, lieferzeitTage: 10 },
    { id: 16, artikelId: 10, lieferantId: 2, mindestbestellmenge: 8, stueckpreis: 486, lieferzeitTage: 18 },
    { id: 17, artikelId: 14, lieferantId: 4, mindestbestellmenge: 5, stueckpreis: 23.5, lieferzeitTage: 2 },
    { id: 18, artikelId: 14, lieferantId: 4, mindestbestellmenge: 20, stueckpreis: 21.9, lieferzeitTage: 6 },
    { id: 19, artikelId: 16, lieferantId: 1, mindestbestellmenge: 6, stueckpreis: 22.6, lieferzeitTage: 3 },
    { id: 20, artikelId: 16, lieferantId: 1, mindestbestellmenge: 18, stueckpreis: 21.1, lieferzeitTage: 7 }
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
        lehrkraftAngebotText: "Standardangebot fÃ¼r drei Helme aus dem Vergleich."
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
        anfrageNotiz: "Nachbestellung fÃ¼r Citybikes im Zulauf."
    }
];

export let bestellpositionen = [
    { id: 1, bestellungId: 1, artikelId: 3, artikelNr: "ART003", menge: 3, einzelpreis: 24.5 },
    { id: 2, bestellungId: 2, artikelId: 1, artikelNr: "ART001", menge: 5, einzelpreis: 420 }
];

export let kategorien = [
    {
        id: 1,
        name: "FahrrÃ¤der",
        parentId: "",
        beschreibung: "Komplette FahrrÃ¤der und fahrbereite Baugruppen."
    },
    {
        id: 4,
        name: "Citybike",
        parentId: 1,
        beschreibung: "Komplette City- und SchulungsfahrrÃ¤der."
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
        beschreibung: "Warn- und Schutzkleidung fÃ¼r den Einsatz."
    },
    {
        id: 7,
        name: "ZubehÃ¶r",
        parentId: "",
        beschreibung: "Zusatzprodukte rund ums Fahrrad."
    },
    {
        id: 8,
        name: "Helm",
        parentId: 7,
        beschreibung: "Helme und SchutzzubehÃ¶r."
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
        beschreibung: "Antriebskomponenten wie Ketten und KettenrÃ¤der."
    }
];

// Der Verkaufskreislauf bleibt ebenso kompakt: Angebot -> Auftrag.
// Angebots-, Auftrags- und Kommunikationsdaten


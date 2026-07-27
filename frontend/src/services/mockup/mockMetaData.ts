export const feldMetadaten = [

    // ======================
    // Lieferanten
    // ======================
    { tabelle: "lieferanten", feld: "lieferantenNr", anzeigename: "Lieferantennummer", reihenfolge: 1, sichtbar: true },
    { tabelle: "lieferanten", feld: "firma", anzeigename: "Firma", reihenfolge: 2, sichtbar: true },
    { tabelle: "lieferanten", feld: "anschrift", anzeigename: "Anschrift", reihenfolge: 3, sichtbar: true },
    { tabelle: "lieferanten", feld: "plz", anzeigename: "PLZ", reihenfolge: 4, sichtbar: true },
    { tabelle: "lieferanten", feld: "ort", anzeigename: "Ort", reihenfolge: 5, sichtbar: true },
    { tabelle: "lieferanten", feld: "segment", anzeigename: "Segment", reihenfolge: 6, sichtbar: true },
    { tabelle: "lieferanten", feld: "fuerBts", anzeigename: "Für BTS", reihenfolge: 7, sichtbar: true },
    { tabelle: "lieferanten", feld: "bewertung", anzeigename: "Bewertung (1–5)", reihenfolge: 8, sichtbar: true },

    // ======================
    // Kunden
    // ======================

    {
        tabelle: "kunden",
        feld: "kundenNr",
        anzeigename: "Kundennummer",
        beschreibung: "Eindeutige Kundennummer",
        reihenfolge: 1,
        sichtbar: true
    },

    {
        tabelle: "kunden",
        feld: "firma",
        anzeigename: "Firma",
        beschreibung: "Name des Kunden",
        reihenfolge: 2,
        sichtbar: true
    },

    {
        tabelle: "kunden",
        feld: "anschrift",
        anzeigename: "Anschrift",
        beschreibung: "Straße und Hausnummer",
        reihenfolge: 3,
        sichtbar: true
    },

    {
        tabelle: "kunden",
        feld: "plz",
        anzeigename: "PLZ",
        beschreibung: "Postleitzahl",
        reihenfolge: 4,
        sichtbar: true
    },

    {
        tabelle: "kunden", feld: "ort", anzeigename: "Ort", beschreibung: "Kundenort", reihenfolge: 5, sichtbar: true
    },

    {
        tabelle: "kunden",
        feld: "segment",
        anzeigename: "Segment",
        beschreibung: "Kundengruppe",
        reihenfolge: 6,
        sichtbar: true
    },

    {
        tabelle: "kunden",
        feld: "optionen",
        anzeigename: "Unsere Leistungen",
        beschreibung: "Produkte und Dienstleistungen",
        reihenfolge: 7,
        sichtbar: true
    }, {
        tabelle: "kunden",
        feld: "notiz",
        anzeigename: "Notiz",
        beschreibung: "Interne Bemerkungen zum Kunden",
        feldtyp: "textarea",
        zeilen: 6,
        sichtbar: true,
        reihenfolge: 10
    },


    // ======================
    // Artikel später
    // ======================

    {
        tabelle: "artikel",
        feld: "artikelNr",
        anzeigename: "Artikelnummer",
        beschreibung: "Artikelnummer",
        reihenfolge: 1,
        sichtbar: true
    },

    {
        tabelle: "artikel",
        feld: "name",
        anzeigename: "Bezeichnung",
        beschreibung: "Artikelname",
        reihenfolge: 2,
        sichtbar: true
    },

    {
        tabelle: "artikel",
        feld: "artikelTyp",
        anzeigename: "Typ",
        beschreibung: "Einzelartikel, Komponente oder Baugruppe",
        reihenfolge: 3,
        sichtbar: true
    },

    {
        tabelle: "artikel",
        feld: "einkaufspreis",
        anzeigename: "EK-Preis",
        beschreibung: "Einkaufspreis",
        reihenfolge: 4,
        sichtbar: true
    },

    {
        tabelle: "artikel",
        feld: "verkaufspreis",
        anzeigename: "VK-Preis",
        beschreibung: "Verkaufspreis",
        reihenfolge: 5,
        sichtbar: true
    },
    {
        tabelle: "artikel",
        feld: "beschaffungsart",
        anzeigename: "Beschaffung",
        beschreibung: "Zukauf oder Herstellung",
        reihenfolge: 6,
        sichtbar: true
    },
    {
        tabelle: "artikel",
        feld: "verkaufsstatus",
        anzeigename: "Verkauf",
        beschreibung: "Verkaufbar oder nicht verkaufbar",
        reihenfolge: 7,
        sichtbar: true
    },

    {
        tabelle: "artikel",
        feld: "bestand",
        anzeigename: "Bestand",
        beschreibung: "Aktueller Lagerbestand",
        reihenfolge: 8,
        sichtbar: true
    },

    {
        tabelle: "services",
        feld: "serviceNr",
        anzeigename: "Servicenummer",
        beschreibung: "Servicenummer",
        reihenfolge: 1,
        sichtbar: true
    },
    {
        tabelle: "services",
        feld: "name",
        anzeigename: "Bezeichnung",
        beschreibung: "Servicebezeichnung",
        reihenfolge: 2,
        sichtbar: true
    },
    {
        tabelle: "services",
        feld: "kategorie",
        anzeigename: "Kategorie",
        beschreibung: "Servicekategorie",
        reihenfolge: 3,
        sichtbar: true
    },
    {
        tabelle: "services",
        feld: "einkaufspreis",
        anzeigename: "EK-Preis",
        beschreibung: "Interner Einkaufspreis",
        reihenfolge: 4,
        sichtbar: true
    },
    {
        tabelle: "services",
        feld: "verkaufspreis",
        anzeigename: "VK-Preis",
        beschreibung: "Verkaufspreis",
        reihenfolge: 5,
        sichtbar: true
    },

    // ======================
    // Benutzer
    // ======================

    {
        tabelle: "benutzer",
        feld: "username",
        anzeigename: "Benutzername",
        beschreibung: "Eindeutiger Benutzername",
        reihenfolge: 1,
        sichtbar: true
    },

    {
        tabelle: "benutzer",
        feld: "email",
        anzeigename: "Email",
        beschreibung: "E-Mail-Adresse",
        reihenfolge: 2,
        sichtbar: true
    },

    {
        tabelle: "benutzer",
        feld: "rolle",
        anzeigename: "Rolle",
        beschreibung: "Benutzerrolle",
        reihenfolge: 3,
        sichtbar: true
    },

    // ======================
    // Rollen
    // ======================

    {
        tabelle: "rollen",
        feld: "name",
        anzeigename: "Rollenname",
        beschreibung: "Name der Rolle",
        reihenfolge: 1,
        sichtbar: true
    },

    {
        tabelle: "rollen",
        feld: "beschreibung",
        anzeigename: "Beschreibung",
        beschreibung: "Beschreibung der Rolle",
        reihenfolge: 2,
        sichtbar: true
    },

    // ======================
    // Rechte
    // ======================

    {
        tabelle: "rechte",
        feld: "name",
        anzeigename: "Recht",
        beschreibung: "Name des Rechts",
        reihenfolge: 1,
        sichtbar: true
    },

    {
        tabelle: "rechte",
        feld: "beschreibung",
        anzeigename: "Beschreibung",
        beschreibung: "Beschreibung des Rechts",
        reihenfolge: 2,
        sichtbar: true
    },

    // ======================
    // Lager
    // ======================

    {
        tabelle: "lager",
        feld: "name",
        anzeigename: "Lagername",
        beschreibung: "Name des Lagers",
        reihenfolge: 1,
        sichtbar: true
    },

    {
        tabelle: "lager",
        feld: "standort",
        anzeigename: "Standort",
        beschreibung: "Lagerstandort",
        reihenfolge: 2,
        sichtbar: true
    },

    {
        tabelle: "lager",
        feld: "kapazitaet",
        anzeigename: "Kapazität",
        beschreibung: "Lagerkapazität",
        reihenfolge: 3,
        sichtbar: true
    },

    // ======================
    // Rechnungen
    // ======================

    {
        tabelle: "rechnungen",
        feld: "rechnungsnr",
        anzeigename: "Rechnungsnummer",
        beschreibung: "Eindeutige Rechnungsnummer",
        reihenfolge: 1,
        sichtbar: true
    },

    {
        tabelle: "rechnungen",
        feld: "rechnungstyp",
        anzeigename: "Typ",
        beschreibung: "Eingangs- oder Ausgangsrechnung",
        reihenfolge: 2,
        sichtbar: true
    },

    {
        tabelle: "rechnungen",
        feld: "kunde",
        anzeigename: "Geschäftspartner",
        beschreibung: "Kunden- oder Lieferantenname",
        reihenfolge: 3,
        sichtbar: true
    },

    {
        tabelle: "rechnungen",
        feld: "bestellNr",
        anzeigename: "Bestellbezug",
        beschreibung: "Bezug zur Bestellung bei Eingangsrechnungen",
        reihenfolge: 4,
        sichtbar: true
    },

    {
        tabelle: "rechnungen",
        feld: "datum",
        anzeigename: "Datum",
        beschreibung: "Rechnungsdatum",
        reihenfolge: 5,
        sichtbar: true
    },

    {
        tabelle: "rechnungen",
        feld: "faelligAm",
        anzeigename: "Fällig am",
        beschreibung: "Fälligkeitsdatum",
        reihenfolge: 6,
        sichtbar: true
    },

    {
        tabelle: "rechnungen",
        feld: "betrag",
        anzeigename: "Betrag",
        beschreibung: "Rechnungsbetrag",
        reihenfolge: 7,
        sichtbar: true
    },

    {
        tabelle: "rechnungen",
        feld: "status",
        anzeigename: "Status",
        beschreibung: "Rechnungsstatus",
        reihenfolge: 8,
        sichtbar: true
    },

    {
        tabelle: "rechnungen",
        feld: "mahnstufe",
        anzeigename: "Mahnstufe",
        beschreibung: "Didaktisch vereinfachte Mahnstufe",
        reihenfolge: 9,
        sichtbar: true
    }

];


//
// Nutzerbezogene Einstellungen
//

export const benutzerSpalten = [

];

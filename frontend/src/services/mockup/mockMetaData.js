export const feldMetadaten = [

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
        feld: "bezeichnung",
        anzeigename: "Bezeichnung",
        beschreibung: "Artikelname",
        reihenfolge: 2,
        sichtbar: true
    },

    {
        tabelle: "artikel",
        feld: "preis",
        anzeigename: "Preis",
        beschreibung: "Verkaufspreis",
        reihenfolge: 3,
        sichtbar: true
    },

    {
        tabelle: "artikel",
        feld: "lagerbestand",
        anzeigename: "Bestand",
        beschreibung: "Aktueller Lagerbestand",
        reihenfolge: 4,
        sichtbar: false
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

    {
        tabelle: "benutzer",
        feld: "aktiv",
        anzeigename: "Aktiv",
        beschreibung: "Benutzer ist aktiv",
        reihenfolge: 4,
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

    {
        tabelle: "rollen",
        feld: "aktiv",
        anzeigename: "Aktiv",
        beschreibung: "Rolle ist aktiv",
        reihenfolge: 3,
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

    {
        tabelle: "rechte",
        feld: "aktiv",
        anzeigename: "Aktiv",
        beschreibung: "Recht ist aktiv",
        reihenfolge: 3,
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

    {
        tabelle: "lager",
        feld: "aktiv",
        anzeigename: "Aktiv",
        beschreibung: "Lager ist aktiv",
        reihenfolge: 4,
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
        feld: "kunde",
        anzeigename: "Kunde",
        beschreibung: "Kundenname",
        reihenfolge: 2,
        sichtbar: true
    },

    {
        tabelle: "rechnungen",
        feld: "datum",
        anzeigename: "Datum",
        beschreibung: "Rechnungsdatum",
        reihenfolge: 3,
        sichtbar: true
    },

    {
        tabelle: "rechnungen",
        feld: "betrag",
        anzeigename: "Betrag",
        beschreibung: "Rechnungsbetrag",
        reihenfolge: 4,
        sichtbar: true
    },

    {
        tabelle: "rechnungen",
        feld: "status",
        anzeigename: "Status",
        beschreibung: "Rechnungsstatus",
        reihenfolge: 5,
        sichtbar: true
    }

];


//
// Nutzerbezogene Einstellungen
//

export const benutzerSpalten = [

];
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
        sichtbar: false
    },

    {
        tabelle: "kunden",
        feld: "plz",
        anzeigename: "PLZ",
        beschreibung: "Postleitzahl",
        reihenfolge: 4,
        sichtbar: false
    },

    {
        tabelle: "kunden",
        feld: "ort",
        anzeigename: "Ort",
        beschreibung: "Kundenort",
        reihenfolge: 5,
        sichtbar: true
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
        sichtbar: false
    },


    // ======================
    // Artikel später
    // ======================

    {
        tabelle:"artikel",
        feld:"artikelNr",
        anzeigename:"Artikelnummer",
        beschreibung:"Artikelnummer",
        reihenfolge:1,
        sichtbar:true
    },

    {
        tabelle:"artikel",
        feld:"bezeichnung",
        anzeigename:"Bezeichnung",
        beschreibung:"Artikelname",
        reihenfolge:2,
        sichtbar:true
    },

    {
        tabelle:"artikel",
        feld:"preis",
        anzeigename:"Preis",
        beschreibung:"Verkaufspreis",
        reihenfolge:3,
        sichtbar:true
    },

    {
        tabelle:"artikel",
        feld:"lagerbestand",
        anzeigename:"Bestand",
        beschreibung:"Aktueller Lagerbestand",
        reihenfolge:4,
        sichtbar:false
    }

];



//
// Nutzerbezogene Einstellungen
//

export const benutzerSpalten = [

    {
        username:"admin",
        tabelle:"kunden",

        sichtbareFelder:[
            "kundenNr",
            "firma",
            "ort",
            "segment"
        ]
    },


    {
        username:"buchhaltung",
        tabelle:"kunden",

        sichtbareFelder:[
            "kundenNr",
            "firma",
            "ort"
        ]
    },


    {
        username:"lager",
        tabelle:"kunden",

        sichtbareFelder:[
            "kundenNr",
            "firma"
        ]
    }

];
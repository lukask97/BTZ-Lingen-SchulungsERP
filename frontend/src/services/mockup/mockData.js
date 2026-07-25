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

        aktiv: true
    }

];


export let artikel = [

    {
        id: 1, artikelNr: "ART001", name: "Lastenrad Premium", kategorie: "Fahrräder", preis: 3499, bestand: 5
    },


    {
        id: 2, artikelNr: "ART002", name: "Sicherheitsjacke", kategorie: "Bekleidung", preis: 89.90, bestand: 120
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
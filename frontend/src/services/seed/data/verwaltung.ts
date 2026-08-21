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
        info: "Didaktische Beispielausgabe fÃ¼r das Einkaufskonto",
        soll: 420,
        haben: 0,
        saldo: -420
    }
];

export let lehrkraftOptionen = [
    {
        id: 1,
        autoLieferannahmeNach1Tag: false,
        autoDebitorenzahlungNach1Tag: false,
        debitorenzahlungRegeln: [
            { id: "regel-1", startTag: 0, endTag: 0, gewichtung: 1 },
            { id: "regel-2", startTag: 3, endTag: 14, gewichtung: 35 },
            { id: "regel-3", startTag: 15, endTag: 28, gewichtung: 61 },
            { id: "regel-4", startTag: 29, endTag: 42, gewichtung: 2 },
            { id: "regel-5", startTag: 43, endTag: 56, gewichtung: 1 }
        ]
    }
];

export let fristenOptionen = [
    {
        id: 1,
        skontoTage: 7,
        skontoProzent: 2,
        angebotGfFreigabeAbweichungProzent: 10,
        zahlungszielTage: 14,
        zahlungserinnerungTage: 3,
        mahnung1AbTage: 1,
        mahnung2AbTage: 8,
        inkassoAbTage: 22
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



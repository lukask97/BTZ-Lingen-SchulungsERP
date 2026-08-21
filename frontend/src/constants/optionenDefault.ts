const optionenDefault = {
    fristenOptionen: {
        id: 1,
        skontoTage: 7,
        skontoProzent: 2,
        angebotGfFreigabeAbweichungProzent: 10,
        zahlungszielTage: 14,
        zahlungserinnerungTage: 3,
        mahnung1AbTage: 1,
        mahnung2AbTage: 8,
        inkassoAbTage: 22
    },
    lehrkraftOptionen: {
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
    },
    unternehmen: {
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
    },
    nummernkreise: [
        { id: 1, schluessel: "artikel", bezeichnung: "Artikel", kuerzel: "ART" },
        { id: 2, schluessel: "service", bezeichnung: "Service", kuerzel: "SER" },
        { id: 3, schluessel: "angebot", bezeichnung: "Angebot", kuerzel: "ANG" },
        { id: 4, schluessel: "auftrag", bezeichnung: "Auftrag", kuerzel: "AU" },
        { id: 5, schluessel: "rechnung", bezeichnung: "Rechnung", kuerzel: "RG" },
        { id: 6, schluessel: "lieferschein", bezeichnung: "Lieferschein", kuerzel: "LS" },
        { id: 7, schluessel: "bestellung", bezeichnung: "Bestellung", kuerzel: "EK" },
        { id: 8, schluessel: "gutschrift", bezeichnung: "Gutschrift", kuerzel: "GS" },
        { id: 9, schluessel: "mahnung", bezeichnung: "Mahnung", kuerzel: "MH" },
        { id: 10, schluessel: "zahlung", bezeichnung: "Zahlung", kuerzel: "ZA" }
    ]
};

export default optionenDefault;

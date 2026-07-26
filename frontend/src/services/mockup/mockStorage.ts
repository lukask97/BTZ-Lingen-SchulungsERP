export function loadData(key, defaultData){

    const saved =
        sessionStorage.getItem(key);


    if(saved){
        return JSON.parse(saved);
    }


    sessionStorage.setItem(
        key,
        JSON.stringify(defaultData)
    );


    return defaultData;

}



export function saveData(key, data){

    sessionStorage.setItem(
        key,
        JSON.stringify(data)
    );

}

// Ein Reset löscht nur lokale Browser-Testdaten. Beim nächsten Laden werden
// die zentralen Startdaten wieder aus mockData.js übernommen.
const TEST_DATA_KEYS = [
    "kunden", "artikel", "benutzer", "rollen", "rechte", "lager", "rechnungen",
    "services",
    "lieferanten", "bestellungen", "angebote", "auftraege", "reklamationen",
    "marketingaktionen", "abteilungen", "kundenanfragen", "zahlungen", "mahnungen",
    "belege", "freigaben", "berichte", "versandauftraege", "retouren", "bewerber",
    "mitarbeiter", "arbeitszeiten", "urlaubsantraege", "schulungen",
    "firmenkonto",
    "feldMetadaten", "benutzerSpalten"
];

export function resetTestData() {
    TEST_DATA_KEYS.forEach(key => sessionStorage.removeItem(key));
}


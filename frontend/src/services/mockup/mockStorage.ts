const STORAGE_SYNC_KEY = "mock-storage-sync";

export function loadData(key, defaultData){

    const saved =
        localStorage.getItem(key);


    if(saved){
        return JSON.parse(saved);
    }


    localStorage.setItem(
        key,
        JSON.stringify(defaultData)
    );


    return defaultData;

}



export function saveData(key, data){

    localStorage.setItem(
        key,
        JSON.stringify(data)
    );

    localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify({
        key,
        updatedAt: new Date().toISOString()
    }));

}

// Ein Reset löscht nur lokale Browser-Testdaten. Beim nächsten Laden werden
// die zentralen Startdaten wieder aus mockData.js übernommen.
const TEST_DATA_KEYS = [
    "kunden", "artikel", "benutzer", "rollen", "rechte", "lager",
    "services",
    "lieferanten", "bestellungen", "angebote", "auftraege", "reklamationen",
    "marketingaktionen", "abteilungen", "kundenanfragen", "nachrichten", "zahlungen", "mahnungen",
    "belege", "freigaben", "berichte", "versandauftraege", "retouren", "bewerber",
    "mitarbeiter", "arbeitszeiten", "urlaubsantraege", "schulungen",
    "firmenkonto",
    "feldMetadaten", "benutzerSpalten"
];

export function resetTestData() {
    TEST_DATA_KEYS.forEach(key => localStorage.removeItem(key));
}

export function subscribeToStorageSync(keys, callback) {
    const watchedKeys = new Set(keys);

    const handleStorage = (event) => {
        if (event.key !== STORAGE_SYNC_KEY || !event.newValue) return;

        try {
            const payload = JSON.parse(event.newValue);
            if (watchedKeys.has(payload.key)) callback(payload);
        } catch {
            // Ignoriere ungueltige Sync-Payloads aus der Testumgebung.
        }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
}

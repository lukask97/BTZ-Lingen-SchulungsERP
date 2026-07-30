import { isDatabaseModeEnabled, syncApiRequest } from "../core/api";
import { clearTableCache, invalidateTableCaches } from "../core/dataCache";

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

// Ein Reset löscht im Mock-Modus nur lokale Browser-Testdaten.
// Im DB-Modus werden die zentralen Seed-Daten neu in die Datenbank geladen.
export const SYNC_DATA_KEYS = [
    "kunden", "artikel", "benutzer", "rollen", "rechte", "lager",
    "services",
    "lieferanten", "bestellungen", "angebote", "auftraege", "reklamationen",
    "marketingaktionen", "abteilungen", "kundenanfragen", "nachrichten", "zahlungen", "mahnungen",
    "belege", "freigaben", "berichte", "versandauftraege", "retouren", "bewerber",
    "mitarbeiter", "arbeitszeiten", "urlaubsantraege", "schulungen",
    "firmenkonto",
    "benutzerSpalten"
];

export function resetTestData() {
    if (isDatabaseModeEnabled()) {
        clearTableCache();
        syncResetDatabase();
        return;
    }
    SYNC_DATA_KEYS.forEach(key => localStorage.removeItem(key));
}

export function subscribeToStorageSync(keys, callback) {
    if (isDatabaseModeEnabled()) {
        const interval = window.setInterval(() => {
            invalidateTableCaches(keys);
            callback({ key: "poll", updatedAt: new Date().toISOString() });
        }, 3000);
        return () => window.clearInterval(interval);
    }

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

function syncResetDatabase() {
    syncApiRequest("/reset", {
        method: "POST"
    });
}

import { isDatabaseModeEnabled, syncApiRequest } from "../core/api";
import { clearTableCache, invalidateTableCaches } from "../core/dataCache";
import { subscribeToServerResetEvents, subscribeToServerTableEvents } from "../core/serverEvents";

const STORAGE_SYNC_KEY = "mock-storage-sync";

function stripFields(item, fields = []) {
    return fields.reduce((nextItem, field) => {
        if (!(field in nextItem)) return nextItem;
        const { [field]: _removed, ...rest } = nextItem;
        return rest;
    }, item || {});
}

const STORAGE_SANITIZERS = {
    angebote: item => stripFields(item, ["kunde", "positionen"]),
    auftraege: item => stripFields(item, ["kunde", "positionen"]),
    bestellungen: item => stripFields(item, ["lieferant", "positionen"]),
    kundenanfragen: item => stripFields(item, ["kunde"]),
    reklamationen: item => stripFields(item, ["kunde"]),
    retouren: item => stripFields(item, ["kunde", "artikel"]),
    versandauftraege: item => stripFields(item, ["auftrag", "kunde"]),
    vertriebsdokumente: item => stripFields(item, ["auftragNr", "kunde", "kundeId", "positionen"]),
    einkaufsdokumente: item => stripFields(item, ["bestellNr", "lieferant", "lieferantId", "positionen"])
};

function sanitizeTableData(key, data) {
    if (!Array.isArray(data)) return data;
    const sanitizeItem = STORAGE_SANITIZERS[key];
    if (!sanitizeItem) return data;
    return data.map(item => sanitizeItem(item));
}

export function loadData(key, defaultData){

    const saved =
        localStorage.getItem(key);


    if(saved){
        const parsed = JSON.parse(saved);
        const sanitized = sanitizeTableData(key, parsed);
        if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
            localStorage.setItem(key, JSON.stringify(sanitized));
        }
        return sanitized;
    }


    const sanitizedDefaultData = sanitizeTableData(key, defaultData);
    localStorage.setItem(
        key,
        JSON.stringify(sanitizedDefaultData)
    );


    return sanitizedDefaultData;

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
    "kunden", "artikel", "artikelStueckliste", "benutzer", "rollen", "rechte", "lager",
    "rollenRechte",
    "services",
    "lieferanten", "bestellungen", "angebote", "auftraege", "reklamationen",
    "bestellpositionen", "angebotspositionen", "auftragspositionen",
    "marketingaktionen", "abteilungen", "kundenanfragen", "nachrichten", "zahlungen", "mahnungen",
    "belege", "freigaben", "berichte", "versandauftraege", "retouren", "bewerber",
    "mitarbeiter", "arbeitszeiten", "urlaubsantraege", "schulungen",
    "firmenkonto",
    "benutzerSpalten",
    "nummernkreise"
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
        const watchedKeys = new Set(keys);
        const unsubscribeTableEvents = subscribeToServerTableEvents(payload => {
            if (!payload.table || !watchedKeys.has(payload.table)) return;
            callback({
                key: payload.table,
                updatedAt: new Date().toISOString()
            });
        });
        const unsubscribeResetEvents = subscribeToServerResetEvents(payload => {
            const resetTables = payload.tables || keys;
            invalidateTableCaches(resetTables);
            callback({
                key: "reset",
                updatedAt: new Date().toISOString()
            });
        });

        return () => {
            unsubscribeTableEvents();
            unsubscribeResetEvents();
        };
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

import { clearTableCache, invalidateTableCaches } from "../core/dataCache";
import { syncApiRequest } from "../core/api";
import { subscribeToServerResetEvents, subscribeToServerTableEvents } from "../core/serverEvents";

export const SYNC_DATA_KEYS = [
    "kunden", "artikel", "artikelStueckliste", "benutzer", "rollen", "rechte", "lager",
    "rollenRechte",
    "services",
    "lieferanten", "lieferantenArtikelStaffeln", "bestellungen", "angebote", "auftraege", "reklamationen",
    "bestellpositionen", "angebotspositionen", "auftragspositionen",
    "marketingaktionen", "abteilungen", "kundenanfragen", "nachrichten", "zahlungen", "mahnungen",
    "belege", "freigaben", "berichte", "versandauftraege", "retouren", "bewerber",
    "mitarbeiter", "arbeitszeiten", "urlaubsantraege", "schulungen",
    "firmenkonto",
    "unternehmen",
    "benutzerSpalten",
    "nummernkreise",
    "lehrkraftOptionen",
    "fristenOptionen"
];

export function resetSeedData() {
    clearTableCache();
    syncApiRequest("/reset", {
        method: "POST"
    });
}

export function subscribeToDataSync(keys, callback) {
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

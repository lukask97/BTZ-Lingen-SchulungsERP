import optionenDefault from "../../constants/optionenDefault";
import { isPermissionError } from "../core/api";
import { createCRUDService } from "../core/genericService";
import { nummernkreise } from "../mockup/mockData";
import { loadData, saveData } from "../mockup/mockStorage";

export type NummernkreisSchluessel =
    | "artikel"
    | "service"
    | "angebot"
    | "auftrag"
    | "rechnung"
    | "lieferschein"
    | "bestellung"
    | "gutschrift"
    | "mahnung"
    | "zahlung";

export type Nummernkreis = {
    id: number | string;
    schluessel: NummernkreisSchluessel | string;
    bezeichnung: string;
    kuerzel: string;
};

const STORAGE_KEY = "nummernkreise";
const REMOTE_SERVICE = createCRUDService<Nummernkreis>(STORAGE_KEY, nummernkreise);

const DEFAULT_NUMMERNKREISE: Record<NummernkreisSchluessel, { bezeichnung: string; kuerzel: string }> = {
    artikel: { bezeichnung: "Artikel", kuerzel: "ART" },
    service: { bezeichnung: "Service", kuerzel: "SER" },
    angebot: { bezeichnung: "Angebot", kuerzel: "ANG" },
    auftrag: { bezeichnung: "Auftrag", kuerzel: "AU" },
    rechnung: { bezeichnung: "Rechnung", kuerzel: "RG" },
    lieferschein: { bezeichnung: "Lieferschein", kuerzel: "LS" },
    bestellung: { bezeichnung: "Bestellung", kuerzel: "EK" },
    gutschrift: { bezeichnung: "Gutschrift", kuerzel: "GS" },
    mahnung: { bezeichnung: "Mahnung", kuerzel: "MH" },
    zahlung: { bezeichnung: "Zahlung", kuerzel: "ZA" }
};

let nummernkreiseTableAvailable: boolean | null = null;

function isMissingTableError(error: unknown) {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();
    return error.message.includes("Die Tabelle 'nummernkreise' ist im aktuellen Backend-Modus nicht vorbereitet.")
        || error.message.includes("status 404")
        || error.message.includes("404")
        || message.includes("not found")
        || message.includes("backend unter")
        || message.includes("nicht erreichbar")
        || message.includes("cors")
        || message.includes("networkerror")
        || message.includes("xmlhttprequest");
}

function normalizeKuerzel(value: string) {
    return String(value || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "") || "DOC";
}

function normalizeNummernkreis(item: Nummernkreis) {
    const schluessel = String(item.schluessel || "").trim().toLowerCase() as NummernkreisSchluessel;
    const fallback = DEFAULT_NUMMERNKREISE[schluessel] || {
        bezeichnung: item.bezeichnung || schluessel || "Dokument",
        kuerzel: item.kuerzel || "DOC"
    };

    return {
        ...item,
        schluessel,
        bezeichnung: item.bezeichnung || fallback.bezeichnung,
        kuerzel: normalizeKuerzel(item.kuerzel || fallback.kuerzel)
    };
}

function withDefaults(entries: Nummernkreis[]) {
    const normalizedEntries = entries.map(normalizeNummernkreis);

    return (Object.entries(DEFAULT_NUMMERNKREISE) as Array<[NummernkreisSchluessel, { bezeichnung: string; kuerzel: string }]>)
        .map(([schluessel, fallback], index) => {
            const existing = normalizedEntries.find(item => item.schluessel === schluessel);
            return existing || {
                id: index + 1,
                schluessel,
                bezeichnung: fallback.bezeichnung,
                kuerzel: fallback.kuerzel
            };
        });
}

function getResetDefaults() {
    return Array.isArray(optionenDefault.nummernkreise) && optionenDefault.nummernkreise.length > 0
        ? optionenDefault.nummernkreise.map(item => normalizeNummernkreis(item as Nummernkreis))
        : withDefaults([]);
}

function readLocal() {
    return withDefaults(loadData(STORAGE_KEY, nummernkreise) as Nummernkreis[]);
}

function writeLocal(entries: Nummernkreis[]) {
    const normalized = withDefaults(entries);
    saveData(STORAGE_KEY, normalized);
    return normalized;
}

function createLocal(payload: Nummernkreis) {
    const current = readLocal();
    const created = {
        ...normalizeNummernkreis(payload),
        id: payload.id ?? Date.now()
    };
    writeLocal([...current.filter(item => String(item.schluessel) !== String(created.schluessel)), created]);
    return created;
}

function updateLocal(idOrItem: number | string | Nummernkreis, payload?: Partial<Nummernkreis>) {
    const current = readLocal();
    const nextItem = typeof idOrItem === "object"
        ? normalizeNummernkreis(idOrItem)
        : normalizeNummernkreis({ ...(current.find(item => String(item.id) === String(idOrItem)) || {}), ...(payload || {}), id: idOrItem } as Nummernkreis);
    writeLocal(current.map(item => String(item.id) === String(nextItem.id) ? nextItem : item));
    return nextItem;
}

function removeLocal(id: number | string) {
    const current = readLocal();
    writeLocal(current.filter(item => String(item.id) !== String(id)));
}

function listWithFallback() {
    if (nummernkreiseTableAvailable === false) {
        return readLocal();
    }

    try {
        const result = withDefaults(REMOTE_SERVICE.list());
        nummernkreiseTableAvailable = true;
        return result;
    } catch (error) {
        if (isMissingTableError(error) || isPermissionError(error)) {
            nummernkreiseTableAvailable = false;
            return readLocal();
        }
        throw error;
    }
}

function createWithFallback(payload: Nummernkreis) {
    const normalizedPayload = normalizeNummernkreis(payload);

    if (nummernkreiseTableAvailable === false) {
        return createLocal(normalizedPayload);
    }

    try {
        const result = REMOTE_SERVICE.create(normalizedPayload);
        nummernkreiseTableAvailable = true;
        return result;
    } catch (error) {
        if (isMissingTableError(error) || isPermissionError(error)) {
            nummernkreiseTableAvailable = false;
            return createLocal(normalizedPayload);
        }
        throw error;
    }
}

function updateWithFallback(idOrItem: number | string | Nummernkreis, payload?: Partial<Nummernkreis>) {
    if (nummernkreiseTableAvailable === false) {
        return updateLocal(idOrItem, payload);
    }

    try {
        const result = typeof idOrItem === "object"
            ? REMOTE_SERVICE.update(normalizeNummernkreis(idOrItem))
            : REMOTE_SERVICE.update(idOrItem, normalizeNummernkreis({ ...(payload as Nummernkreis), id: idOrItem } as Nummernkreis));
        nummernkreiseTableAvailable = true;
        return result;
    } catch (error) {
        if (isMissingTableError(error) || isPermissionError(error)) {
            nummernkreiseTableAvailable = false;
            return updateLocal(idOrItem, payload);
        }
        throw error;
    }
}

function removeWithFallback(id: number | string) {
    if (nummernkreiseTableAvailable === false) {
        return removeLocal(id);
    }

    try {
        const result = REMOTE_SERVICE.remove(id);
        nummernkreiseTableAvailable = true;
        return result;
    } catch (error) {
        if (isMissingTableError(error) || isPermissionError(error)) {
            nummernkreiseTableAvailable = false;
            return removeLocal(id);
        }
        throw error;
    }
}

const nummernkreiseService = {
    list: () => listWithFallback(),
    getAll: () => listWithFallback(),
    getById: (id: number | string) => listWithFallback().find(item => String(item.id) === String(id)),
    getBySchluessel: (schluessel: NummernkreisSchluessel) => listWithFallback().find(item => item.schluessel === schluessel),
    create: (payload: Nummernkreis) => createWithFallback(payload),
    add: (payload: Nummernkreis) => createWithFallback(payload),
    update: (idOrItem: number | string | Nummernkreis, payload: Partial<Nummernkreis>) => updateWithFallback(idOrItem, payload),
    remove: (id: number | string) => removeWithFallback(id),
    reset: () => {
        const defaults = getResetDefaults();
        writeLocal(defaults);
        nummernkreiseTableAvailable = false;
        return readLocal();
    }
};

export function getDefaultNummernkreise() {
    return getResetDefaults();
}

export default nummernkreiseService;

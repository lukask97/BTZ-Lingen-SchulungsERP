import { nummernkreise } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import { isPermissionError } from "../core/api";

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

const baseService = createCRUDService<Nummernkreis>("nummernkreise", nummernkreise);

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

    return error.message.includes("Die Tabelle 'nummernkreise' ist im aktuellen Backend-Modus nicht vorbereitet.")
        || error.message.includes("status 404")
        || error.message.includes("404")
        || error.message.toLowerCase().includes("not found");
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

function listWithFallback() {
    if (nummernkreiseTableAvailable === false) {
        return withDefaults([]);
    }

    try {
        const result = withDefaults(baseService.list());
        nummernkreiseTableAvailable = true;
        return result;
    } catch (error) {
        if (isMissingTableError(error) || isPermissionError(error)) {
            nummernkreiseTableAvailable = false;
            return withDefaults([]);
        }
        throw error;
    }
}

const nummernkreiseService = {
    list: () => listWithFallback(),
    getAll: () => listWithFallback(),
    getById: (id: number | string) => {
        if (nummernkreiseTableAvailable === false) {
            return listWithFallback().find(item => String(item.id) === String(id));
        }

        try {
            const item = baseService.getById(id);
            nummernkreiseTableAvailable = true;
            return item ? normalizeNummernkreis(item) : undefined;
        } catch (error) {
            if (isMissingTableError(error) || isPermissionError(error)) {
                nummernkreiseTableAvailable = false;
                return listWithFallback().find(item => String(item.id) === String(id));
            }
            throw error;
        }
    },
    getBySchluessel: (schluessel: NummernkreisSchluessel) => listWithFallback().find(item => item.schluessel === schluessel),
    create: (payload: Nummernkreis) => baseService.create(normalizeNummernkreis(payload)),
    add: (payload: Nummernkreis) => baseService.create(normalizeNummernkreis(payload)),
    update: (idOrItem: number | string | Nummernkreis, payload?: Partial<Nummernkreis>) => {
        if (typeof idOrItem === "object") {
            return baseService.update(normalizeNummernkreis(idOrItem));
        }
        return baseService.update(idOrItem, normalizeNummernkreis({ ...(payload as Nummernkreis), id: idOrItem } as Nummernkreis));
    },
    remove: (id: number | string) => baseService.remove(id)
};

export function getDefaultNummernkreise() {
    return withDefaults([]);
}

export default nummernkreiseService;

import optionenDefault from "../../constants/optionenDefault";
import { createCRUDService } from "../core/genericService";

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

const TABLE_NAME = "nummernkreise";
const nummernkreiseCrud = createCRUDService<Nummernkreis>(TABLE_NAME, []);

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

function listNummernkreise() {
    return withDefaults(nummernkreiseCrud.list());
}

function createNummernkreis(payload: Nummernkreis) {
    return nummernkreiseCrud.create(normalizeNummernkreis(payload));
}

function updateNummernkreis(idOrItem: number | string | Nummernkreis, payload?: Partial<Nummernkreis>) {
    if (typeof idOrItem === "object") {
        return nummernkreiseCrud.update(normalizeNummernkreis(idOrItem));
    }
    return nummernkreiseCrud.update(idOrItem, normalizeNummernkreis({ ...(payload as Nummernkreis), id: idOrItem } as Nummernkreis));
}

function removeNummernkreis(id: number | string) {
    return nummernkreiseCrud.remove(id);
}

function resetNummernkreise() {
    const current = nummernkreiseCrud.list();
    current.forEach(item => {
        nummernkreiseCrud.remove(item.id);
    });

    const defaults = getResetDefaults();
    defaults.forEach(item => {
        nummernkreiseCrud.create(item);
    });

    return listNummernkreise();
}

const nummernkreiseService = {
    list: () => listNummernkreise(),
    getAll: () => listNummernkreise(),
    getById: (id: number | string) => listNummernkreise().find(item => String(item.id) === String(id)),
    getBySchluessel: (schluessel: NummernkreisSchluessel) => listNummernkreise().find(item => item.schluessel === schluessel),
    create: (payload: Nummernkreis) => createNummernkreis(payload),
    add: (payload: Nummernkreis) => createNummernkreis(payload),
    update: (idOrItem: number | string | Nummernkreis, payload: Partial<Nummernkreis>) => updateNummernkreis(idOrItem, payload),
    remove: (id: number | string) => removeNummernkreis(id),
    reset: () => resetNummernkreise()
};

export function getDefaultNummernkreise() {
    return getResetDefaults();
}

export default nummernkreiseService;



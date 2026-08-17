import { createCRUDService } from "../core/genericService";
import { unternehmen as initialUnternehmen } from "../mockup/mockData";

const baseService = createCRUDService("unternehmen", initialUnternehmen);

const DEFAULT_UNTERNEHMEN = initialUnternehmen[0] || {};

function normalizeKontonamen(payload: Record<string, unknown>) {
    const firmenname = String(payload.firmenname || DEFAULT_UNTERNEHMEN.firmenname || "").trim();
    const firmaKontoname = String(payload.firmaKontoname || "").trim();
    const verkaufKontoname = String(payload.verkaufKontoname || "").trim();
    const einkaufKontoname = String(payload.einkaufKontoname || "").trim();

    return {
        ...payload,
        firmaKontoname: firmaKontoname || firmenname,
        verkaufKontoname: verkaufKontoname || (firmenname ? `${firmenname}-VK` : ""),
        einkaufKontoname: einkaufKontoname || (firmenname ? `${firmenname}-EK` : "")
    };
}

function fehlenKontonamen(payload: Record<string, unknown>) {
    return !String(payload.firmaKontoname || "").trim()
        || !String(payload.verkaufKontoname || "").trim()
        || !String(payload.einkaufKontoname || "").trim();
}

const unternehmenService = {
    get() {
        const items = baseService.list();
        const item = items[0];

        if (!item) {
            return normalizeKontonamen({
                ...DEFAULT_UNTERNEHMEN,
                id: undefined
            });
        }

        const normalized = normalizeKontonamen(item);

        if (item.id && fehlenKontonamen(item)) {
            try {
                return baseService.update({
                    ...normalized,
                    id: item.id
                });
            } catch {
                return normalized;
            }
        }

        return normalized;
    },
    save(payload: Record<string, unknown>) {
        const current = unternehmenService.get();
        const normalizedPayload = normalizeKontonamen({
            ...current,
            ...payload
        });

        if (current.id) {
            try {
                return baseService.update({
                    ...normalizedPayload,
                    id: current.id
                });
            } catch {
                return baseService.create(normalizeKontonamen({
                    ...DEFAULT_UNTERNEHMEN,
                    ...normalizedPayload,
                    id: undefined
                }));
            }
        }

        return baseService.create(normalizeKontonamen({
            ...DEFAULT_UNTERNEHMEN,
            ...normalizedPayload,
            id: undefined
        }));
    }
};

export default unternehmenService;

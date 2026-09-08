import optionenDefault from "../../constants/optionenDefault";
import { createCRUDService } from "../core/genericService";

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

const DEFAULT_UNTERNEHMEN = clone(optionenDefault.unternehmen);
const INITIAL_UNTERNEHMEN = clone(DEFAULT_UNTERNEHMEN);
const baseService = createCRUDService("unternehmen", []);

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
        try {
            const items = baseService.list();
            const item = items[0];

            if (!item) {
                return normalizeKontonamen({
                    ...clone(INITIAL_UNTERNEHMEN),
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
        } catch {
            return normalizeKontonamen(clone(INITIAL_UNTERNEHMEN));
        }
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
                    ...clone(INITIAL_UNTERNEHMEN),
                    ...normalizedPayload,
                    id: undefined
                }));
            }
        }

        return baseService.create(normalizeKontonamen({
            ...clone(INITIAL_UNTERNEHMEN),
            ...normalizedPayload,
            id: undefined
        }));
    },
    reset() {
        const current = unternehmenService.get();
        const payload = normalizeKontonamen(clone(DEFAULT_UNTERNEHMEN));

        if (current.id) {
            return baseService.update({
                ...payload,
                id: current.id
            });
        }

        return baseService.create({
            ...payload,
            id: undefined
        });
    }
};

export default unternehmenService;



import { createCRUDService } from "../core/genericService";
import rechnungenService from "./rechnungenService";

const baseService = createCRUDService("belege", []);

function resolveInvoice(item: any = {}) {
    if (item.rechnungId) {
        return rechnungenService.getById(item.rechnungId);
    }
    if (item.bezugTyp === "Rechnung" && item.bezug) {
        return rechnungenService.list().find(entry => entry.rechnungsnr === item.bezug) || null;
    }
    return null;
}

function normalizeReceipt(item: any = {}) {
    const rechnung = resolveInvoice(item);
    const bezugTyp = item.bezugTyp || (rechnung ? "Rechnung" : "Sonstiges");

    return {
        ...item,
        bezugTyp,
        rechnungId: rechnung.id || item.rechnungId || "",
        bezug: bezugTyp === "Rechnung"
             ? (rechnung.rechnungsnr || item.bezug || "")
            : (item.bezug || "")
    };
}

function splitPayload(payload: any = {}) {
    const normalized = normalizeReceipt(payload);
    const { bezug, ...basePayload } = normalized;

    if (normalized.bezugTyp === "Rechnung") {
        return {
            ...basePayload,
            bezug: ""
        };
    }

    return {
        ...basePayload,
        rechnungId: "",
        bezug
    };
}

const belegeService = {
    ...baseService,
    list: () => baseService.list().map(normalizeReceipt),
    getAll: () => baseService.list().map(normalizeReceipt),
    getById: (id: any) => {
        const item = baseService.getById(id);
        return item ? normalizeReceipt(item) : undefined;
    },
    create: (payload: any) => normalizeReceipt(baseService.create(splitPayload(payload))),
    add: (payload: any) => normalizeReceipt(baseService.create(splitPayload(payload))),
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") {
            return normalizeReceipt(baseService.update(splitPayload(idOrItem)));
        }
        return normalizeReceipt(baseService.update(idOrItem, splitPayload(payload)));
    }
};

export default belegeService;



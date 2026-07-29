import { zahlungen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

const baseService = createCRUDService("zahlungen", zahlungen);

function normalizePayment(item: any = {}) {
    return {
        ...item,
        ausfuehrenAm: item.ausfuehrenAm || item.datum || "",
        status: item.status || "ausgefuehrt",
        betrag: Number(item.betrag || 0)
    };
}

const zahlungenService = {
    list: () => baseService.list().map(normalizePayment),
    getAll: () => baseService.list().map(normalizePayment),
    getById: (id) => {
        const item = baseService.getById(id);
        return item ? normalizePayment(item) : undefined;
    },
    create: (payload) => baseService.create(normalizePayment(payload)),
    add: (payload) => baseService.create(normalizePayment(payload)),
    update: (idOrItem, payload) => {
        if (typeof idOrItem === "object") return baseService.update(normalizePayment(idOrItem));
        return baseService.update(idOrItem, normalizePayment(payload));
    },
    remove: (id) => baseService.remove(id),
    delete: (id) => baseService.remove(id)
};

export default zahlungenService;

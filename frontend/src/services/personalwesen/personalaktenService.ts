import { createCRUDService } from "../core/genericService";
import mitarbeiterService from "./mitarbeiterService";

const baseService = createCRUDService("personalakten", []);

function hydrateEntry(item: any = {}) {
    const mitarbeiter = item.mitarbeiterId ? mitarbeiterService.getById(item.mitarbeiterId) : null;
    return {
        ...item,
        mitarbeiter: mitarbeiter.name || item.mitarbeiter || ""
    };
}

function splitPayload(payload: any = {}) {
    const { mitarbeiter: _mitarbeiter, ...basePayload } = payload;
    return basePayload;
}

export default {
    ...baseService,
    list: () => baseService.list().map(hydrateEntry),
    getAll: () => baseService.list().map(hydrateEntry),
    getById: (id: any) => {
        const item = baseService.getById(id);
        return item ? hydrateEntry(item) : undefined;
    },
    create: (payload: any) => hydrateEntry(baseService.create(splitPayload(payload))),
    add: (payload: any) => hydrateEntry(baseService.create(splitPayload(payload))),
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") {
            return hydrateEntry(baseService.update(splitPayload(idOrItem)));
        }
        return hydrateEntry(baseService.update(idOrItem, splitPayload(payload)));
    }
};



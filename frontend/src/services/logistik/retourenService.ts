import { retouren } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import artikelService from "./artikelService";
import { getCustomerName } from "../../utils/customerReferences";

const baseService = createCRUDService("retouren", retouren);

function resolveArticle(item: any = {}) {
    if (item.artikelId) {
        return artikelService.getById(item.artikelId);
    }
    if (item.artikel) {
        return artikelService.getAll().find(entry => entry.name === item.artikel) || null;
    }
    return null;
}

function normalizeReturn(item: any = {}) {
    const artikel = resolveArticle(item);

    return {
        ...item,
        kundeId: item.kundeId || "",
        kunde: getCustomerName(item.kundeId, item.kunde || ""),
        artikelId: item.artikelId || artikel?.id || "",
        artikel: artikel?.name || item.artikel || ""
    };
}

function splitPayload(payload: any = {}) {
    const normalized = normalizeReturn(payload);
    const { kunde, artikel, ...basePayload } = normalized;
    return basePayload;
}

const retourenService = {
    ...baseService,
    list: () => baseService.list().map(normalizeReturn),
    getAll: () => baseService.list().map(normalizeReturn),
    getById: (id: any) => {
        const item = baseService.getById(id);
        return item ? normalizeReturn(item) : undefined;
    },
    create: (payload: any) => normalizeReturn(baseService.create(splitPayload(payload))),
    add: (payload: any) => normalizeReturn(baseService.create(splitPayload(payload))),
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") {
            return normalizeReturn(baseService.update(splitPayload(idOrItem)));
        }
        return normalizeReturn(baseService.update(idOrItem, splitPayload(payload)));
    }
};

export default retourenService;

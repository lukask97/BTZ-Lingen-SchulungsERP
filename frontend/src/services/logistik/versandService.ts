import { versandauftraege } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import auftraegeService from "../verkauf/auftraegeService";
import { getCustomerName } from "../../utils/customerReferences";

const baseService = createCRUDService("versandauftraege", versandauftraege);

function hydrateVersand(item: any = {}) {
    const auftrag = item.auftragId ? auftraegeService.getById(item.auftragId) : null;
    return {
        ...item,
        // Shipping records keep only the order reference; labels are derived for display.
        auftrag: item.auftrag || auftrag?.auftragNr || "",
        kunde: getCustomerName(auftrag?.kundeId, item.kunde || auftrag?.kunde || "")
    };
}

function splitPayload(payload: any = {}) {
    const { auftrag, kunde, ...basePayload } = payload;
    return basePayload;
}

export default {
    ...baseService,
    list: () => baseService.list().map(hydrateVersand),
    getAll: () => baseService.list().map(hydrateVersand),
    getById: (id: any) => {
        const item = baseService.getById(id);
        return item ? hydrateVersand(item) : undefined;
    },
    create: (payload: any) => hydrateVersand(baseService.create(splitPayload(payload))),
    add: (payload: any) => hydrateVersand(baseService.create(splitPayload(payload))),
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") {
            return hydrateVersand(baseService.update(splitPayload(idOrItem)));
        }
        return hydrateVersand(baseService.update(idOrItem, splitPayload(payload)));
    }
};

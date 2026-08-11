import { vertriebsdokumente } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import auftraegeService from "./auftraegeService";
import { getCustomerName } from "../../utils/customerReferences";

const baseService = createCRUDService("vertriebsdokumente", vertriebsdokumente);

function resolveProcessReferences(item: any = {}) {
    const auftrag = item.auftragId ? auftraegeService.getById(item.auftragId) : null;
    return {
        auftrag,
        angebotId: item.angebotId || auftrag?.angebotId || "",
        anfrageId: item.anfrageId || auftrag?.anfrageId || "",
        vorgangId: item.vorgangId || auftrag?.vorgangId || ""
    };
}

function hydrateDokument(item: any = {}) {
    const { auftrag, angebotId, anfrageId, vorgangId } = resolveProcessReferences(item);
    return {
        ...item,
        angebotId,
        anfrageId,
        vorgangId,
        // Document titles and numbers may remain as historical snapshots; partner data is derived from the order.
        auftragNr: item.auftragNr || auftrag?.auftragNr || "",
        kundeId: item.kundeId || auftrag?.kundeId || "",
        kunde: getCustomerName(item.kundeId || auftrag?.kundeId, item.kunde || auftrag?.kunde || ""),
        positionen: auftrag?.positionen || item.positionen || []
    };
}

function splitPayload(payload: any = {}) {
    const normalizedPayload = {
        ...payload,
        ...resolveProcessReferences(payload)
    };
    const { auftragNr, kunde, kundeId, positionen, ...basePayload } = normalizedPayload;
    return {
        ...basePayload,
        auftragId: basePayload.auftragId || ""
    };
}

export default {
    ...baseService,
    list: () => baseService.list().map(hydrateDokument),
    getAll: () => baseService.list().map(hydrateDokument),
    getById: (id: any) => {
        const item = baseService.getById(id);
        return item ? hydrateDokument(item) : undefined;
    },
    create: (payload: any) => hydrateDokument(baseService.create(splitPayload(payload))),
    add: (payload: any) => hydrateDokument(baseService.create(splitPayload(payload))),
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") {
            return hydrateDokument(baseService.update(splitPayload(idOrItem)));
        }
        return hydrateDokument(baseService.update(idOrItem, splitPayload(payload)));
    }
};

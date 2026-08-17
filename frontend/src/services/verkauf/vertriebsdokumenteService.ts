import { vertriebsdokumente } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import auftraegeService from "./auftraegeService";
import { getCustomerName } from "../../utils/customerReferences";

const baseService = createCRUDService("vertriebsdokumente", vertriebsdokumente);

function withSafeReferenceFallback<T>(reader: () => T, fallback: T) {
    try {
        return reader();
    } catch (error) {
        if (
            error instanceof Error
            && (
                error.message.startsWith("Keine Berechtigung")
                || error.message.includes("nicht gefunden")
                || error.message.includes("nicht vorbereitet")
                || error.message.toLowerCase().includes("api request failed with status 404")
            )
        ) {
            return fallback;
        }

        throw error;
    }
}

function resolveProcessReferences(item: any = {}) {
    const auftrag = item.auftragId ? withSafeReferenceFallback(() => auftraegeService.getById(item.auftragId), null) : null;
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
    update: (idOrItem: any, payload: any) => {
        if (typeof idOrItem === "object") {
            return hydrateDokument(baseService.update(splitPayload(idOrItem)));
        }
        return hydrateDokument(baseService.update(idOrItem, splitPayload(payload)));
    }
};

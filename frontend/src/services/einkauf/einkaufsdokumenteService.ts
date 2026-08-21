import { createCRUDService } from "../core/genericService";
import bestellungenService from "./bestellungenService";
import { getSupplierName } from "../../utils/supplierReferences";

const baseService = createCRUDService("einkaufsdokumente", []);

function hydrateDokument(item: any = {}) {
    const bestellung = item.bestellungId ? bestellungenService.getById(item.bestellungId) : null;
    return {
        ...item,
        // Document titles and numbers may remain as historical snapshots; supplier data is derived from the order.
        bestellNr: item.bestellNr || bestellung.bestellNr || "",
        lieferantId: item.lieferantId || bestellung.lieferantId || "",
        lieferant: getSupplierName(item.lieferantId || bestellung.lieferantId, item.lieferant || bestellung.lieferant || ""),
        positionen: bestellung.positionen || item.positionen || []
    };
}

function splitPayload(payload: any = {}) {
    const { bestellNr, lieferant, lieferantId, positionen, ...basePayload } = payload;
    return {
        ...basePayload,
        bestellungId: basePayload.bestellungId || ""
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



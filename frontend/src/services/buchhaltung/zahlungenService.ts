import { zahlungen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import rechnungenService from "./rechnungenService";
import bestellungenService from "../einkauf/bestellungenService";
import { getCustomerName } from "../../utils/customerReferences";
import { getSupplierName } from "../../utils/supplierReferences";

const baseService = createCRUDService("zahlungen", zahlungen);

function normalizePayment(item: any = {}) {
    const rechnung = item.rechnungId ? rechnungenService.getById(item.rechnungId) : null;
    const bestellung = item.bestellungId ? bestellungenService.getById(item.bestellungId) : null;
    const referenceInvoice = rechnung || (item.rechnungsnr ? rechnungenService.list().find(entry => entry.rechnungsnr === item.rechnungsnr) : null);

    return {
        ...item,
        rechnungId: item.rechnungId || referenceInvoice?.id || "",
        rechnungsnr: item.rechnungsnr || referenceInvoice?.rechnungsnr || "",
        bestellungId: item.bestellungId || bestellung?.id || "",
        bestellNr: item.bestellNr || bestellung?.bestellNr || "",
        kunde: referenceInvoice
            ? (referenceInvoice.rechnungstyp === "Eingangsrechnung"
                ? getSupplierName(referenceInvoice.lieferantId, referenceInvoice.kunde)
                : getCustomerName(referenceInvoice.kundeId, referenceInvoice.kunde))
            : (bestellung
                ? getSupplierName(bestellung.lieferantId, bestellung.lieferant)
                : (item.kunde || "")),
        ausfuehrenAm: item.ausfuehrenAm || item.datum || "",
        status: item.status || "ausgefuehrt",
        betrag: Number(item.betrag || 0)
    };
}

function splitPayload(payload: any = {}) {
    const { kunde, rechnungsnr, bestellNr, ...basePayload } = payload;
    return {
        ...basePayload,
        rechnungId: basePayload.rechnungId || "",
        bestellungId: basePayload.bestellungId || ""
    };
}

const zahlungenService = {
    list: () => baseService.list().map(normalizePayment),
    getAll: () => baseService.list().map(normalizePayment),
    getById: (id) => {
        const item = baseService.getById(id);
        return item ? normalizePayment(item) : undefined;
    },
    create: (payload) => normalizePayment(baseService.create(splitPayload(payload))),
    add: (payload) => normalizePayment(baseService.create(splitPayload(payload))),
    update: (idOrItem, payload) => {
        if (typeof idOrItem === "object") return normalizePayment(baseService.update(splitPayload(idOrItem)));
        return normalizePayment(baseService.update(idOrItem, splitPayload(payload)));
    },
    remove: (id) => baseService.remove(id),
    delete: (id) => baseService.remove(id)
};

export default zahlungenService;

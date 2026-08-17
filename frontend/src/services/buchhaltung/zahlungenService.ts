import { zahlungen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import rechnungenService from "./rechnungenService";
import bestellungenService from "../einkauf/bestellungenService";
import { getCustomerName } from "../../utils/customerReferences";
import { getSupplierName } from "../../utils/supplierReferences";
import kundenService from "../verkauf/customerService";
import lieferantenService from "../einkauf/lieferantenService";

const baseService = createCRUDService("zahlungen", zahlungen);

function safeGetInvoiceById(rechnungId: number | string) {
    try {
        return rechnungenService.getById(rechnungId) || null;
    } catch {
        return null;
    }
}

function safeFindInvoiceByNumber(rechnungsnr: string) {
    try {
        return rechnungenService.list().find(entry => entry.rechnungsnr === rechnungsnr) || null;
    } catch {
        return null;
    }
}

function normalizePayment(item: any = {}) {
    const rechnung = item.rechnungId ? safeGetInvoiceById(item.rechnungId) : null;
    const bestellung = item.bestellungId ? bestellungenService.getById(item.bestellungId) : null;
    const referenceInvoice = rechnung || (item.rechnungsnr ? safeFindInvoiceByNumber(item.rechnungsnr) : null);
    const supplierIban = referenceInvoice?.lieferantId ? lieferantenService.getById(referenceInvoice.lieferantId)?.iban || "" : "";
    const customerIban = referenceInvoice?.kundeId ? kundenService.getById(referenceInvoice.kundeId)?.iban || "" : "";

    const partnerName = referenceInvoice
        ? (referenceInvoice.rechnungstyp === "Eingangsrechnung"
             ? getSupplierName(referenceInvoice.lieferantId, referenceInvoice.kunde)
            : getCustomerName(referenceInvoice.kundeId, referenceInvoice.kunde))
        : (bestellung
             ? getSupplierName(bestellung.lieferantId, bestellung.lieferant)
            : (item.name || item.kunde || ""));
    const partnerIban = referenceInvoice?.iban
        || (referenceInvoice?.rechnungstyp === "Eingangsrechnung" ? supplierIban : customerIban)
        || item.iban
        || "";

    return {
        ...item,
        rechnungId: item.rechnungId || referenceInvoice?.id || "",
        rechnungsnr: item.rechnungsnr || referenceInvoice?.rechnungsnr || "",
        bestellungId: item.bestellungId || bestellung?.id || "",
        bestellNr: item.bestellNr || bestellung?.bestellNr || "",
        kunde: partnerName,
        name: item.name || partnerName,
        iban: partnerIban,
        ausfuehrenAm: item.ausfuehrenAm || item.datum || "",
        ausfuehrungsdatum: item.ausfuehrungsdatum || item.ausfuehrenAm || item.datum || "",
        verwendungszweck: item.verwendungszweck || "",
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

function updateReferencedInvoiceStatus(payment: any, invoiceStatus = "bezahlt") {
    if (!payment.rechnungId) return;
    const rechnung = safeGetInvoiceById(payment.rechnungId);
    if (!rechnung) return;
    rechnungenService.update({
        ...rechnung,
        status: invoiceStatus
    });
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
    delete: (id) => baseService.remove(id),
    matchToInvoice: (paymentId: number | string, rechnungId: number | string) => {
        const payment = baseService.getById(paymentId);
        const rechnung = safeGetInvoiceById(rechnungId);
        if (!payment || !rechnung) return null;
        const updated = normalizePayment(baseService.update({
            ...payment,
            rechnungId: rechnung.id,
            auftragId: rechnung.auftragId || payment.auftragId || "",
            bestellungId: rechnung.bestellungId || payment.bestellungId || "",
            zahlungsart: rechnung.rechnungstyp === "Eingangsrechnung" ? "Ausgang" : "Eingang",
            name: payment.name || rechnung.kunde,
            iban: payment.iban || rechnung.iban || "",
            status: "zugeordnet"
        }));
        updateReferencedInvoiceStatus(updated, "bezahlt");
        return updated;
    },
    markExecuted: (paymentId: number | string, executionDate: string) => {
        const payment = baseService.getById(paymentId);
        if (!payment) return null;
        const updated = normalizePayment(baseService.update({
            ...payment,
            status: "ausgefuehrt",
            datum: executionDate || payment.datum,
            ausfuehrungsdatum: executionDate || payment.ausfuehrungsdatum || payment.ausfuehrenAm || payment.datum
        }));
        updateReferencedInvoiceStatus(updated, "bezahlt");
        return updated;
    },
    unmatch: (paymentId: number | string) => {
        const payment = baseService.getById(paymentId);
        if (!payment) return null;
        updateReferencedInvoiceStatus(payment, "offen");
        return normalizePayment(baseService.update({
            ...payment,
            rechnungId: "",
            auftragId: "",
            bestellungId: "",
            rechnungsnr: "",
            bestellNr: "",
            status: "offen"
        }));
    }
};

export default zahlungenService;

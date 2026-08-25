import { createCRUDService } from "../core/genericService";
import rechnungenService from "./rechnungenService";
import bestellungenService from "../einkauf/bestellungenService";
import { getCustomerName } from "../../utils/customerReferences";
import { getSupplierName } from "../../utils/supplierReferences";
import kundenService from "../verkauf/customerService";
import lieferantenService from "../einkauf/lieferantenService";
import { getBerlinDate } from "../../utils/dateTime";
import firmenkontoService from "./firmenkontoService";

const baseService = createCRUDService("zahlungen", []);

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

function buildReferencePurpose(item: any = {}) {
    if (item.rechnungsnr) {
        return String(item.rechnungsnr || "").startsWith("ER-")
            ? `Eingangsrechnung ${item.rechnungsnr}`
            : `Rechnung ${item.rechnungsnr}`;
    }
    return item.verwendungszweck || "";
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
        kundeId: item.kundeId || referenceInvoice?.kundeId || "",
        lieferantId: item.lieferantId || referenceInvoice?.lieferantId || "",
        kunde: partnerName,
        name: item.name || partnerName,
        iban: partnerIban,
        ausfuehrenAm: item.ausfuehrenAm || item.datum || "",
        ausfuehrungsdatum: item.ausfuehrungsdatum || item.ausfuehrenAm || item.datum || "",
        verwendungszweck: buildReferencePurpose({
            ...item,
            rechnungsnr: item.rechnungsnr || referenceInvoice?.rechnungsnr || ""
        }),
        status: item.status || "ausgefuehrt",
        betrag: Number(item.betrag || 0),
        bankStatus: item.bankStatus || "unbearbeitet",
        offenerRestbetrag: Number(item.offenerRestbetrag || 0),
        ueberzahlung: Number(item.ueberzahlung || 0),
        ausgleichErgebnis: item.ausgleichErgebnis || ""
    };
}

function splitPayload(payload: any = {}) {
    const { kunde, rechnungsnr, bestellNr, ...basePayload } = payload;
    return {
        ...basePayload,
        rechnungId: basePayload.rechnungId || "",
        bestellungId: basePayload.bestellungId || "",
        status: basePayload.status || "offen",
        datum: basePayload.datum || basePayload.ausfuehrungsdatum || getBerlinDate()
    };
}

function updateReferencedInvoiceStatus(payment: any, invoiceStatus = "bezahlt") {
    if (!payment.rechnungId) return;
    const rechnung = safeGetInvoiceById(payment.rechnungId);
    if (!rechnung) return;
    const remainingAmount = Number(payment.offenerRestbetrag || 0);
    const targetStatus = remainingAmount > 0 ? "offen" : invoiceStatus;
    rechnungenService.update({
        ...rechnung,
        status: targetStatus,
        mahnstufe: targetStatus === "bezahlt" ? "-" : rechnung.mahnstufe
    });
}

const zahlungenService = {
    list: () => baseService.list().map(normalizePayment),
    getAll: () => baseService.list().map(normalizePayment),
    getById: (id) => {
        const item = baseService.getById(id);
        return item ? normalizePayment(item) : undefined;
    },
    create: (payload) => {
        const created = normalizePayment(baseService.create(splitPayload(payload)));
        if (created.rechnungId && ["ausgefuehrt", "zugeordnet", "bezahlt"].includes(String(created.status || "").toLowerCase())) {
            updateReferencedInvoiceStatus(created, "bezahlt");
        }
        firmenkontoService.ensureBookingForPayment(created);
        return created;
    },
    add: (payload) => {
        const created = normalizePayment(baseService.create(splitPayload(payload)));
        if (created.rechnungId && ["ausgefuehrt", "zugeordnet", "bezahlt"].includes(String(created.status || "").toLowerCase())) {
            updateReferencedInvoiceStatus(created, "bezahlt");
        }
        firmenkontoService.ensureBookingForPayment(created);
        return created;
    },
    update: (idOrItem, payload) => {
        const updated = typeof idOrItem === "object"
            ? normalizePayment(baseService.update(splitPayload(idOrItem)))
            : normalizePayment(baseService.update(idOrItem, splitPayload(payload)));

        if (updated.rechnungId) {
            updateReferencedInvoiceStatus(updated, ["ausgefuehrt", "zugeordnet", "bezahlt"].includes(String(updated.status || "").toLowerCase()) ? "bezahlt" : "offen");
        }
        firmenkontoService.ensureBookingForPayment(updated);
        return updated;
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
            kundeId: rechnung.kundeId || payment.kundeId || "",
            lieferantId: rechnung.lieferantId || payment.lieferantId || "",
            zahlungsart: rechnung.rechnungstyp === "Eingangsrechnung" ? "Ausgang" : "Eingang",
            name: payment.name || rechnung.kunde,
            iban: payment.iban || rechnung.iban || "",
            status: "zugeordnet"
        }));
        updateReferencedInvoiceStatus(updated, "bezahlt");
        firmenkontoService.ensureBookingForPayment(updated);
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
        if (updated.rechnungId) updateReferencedInvoiceStatus(updated, "bezahlt");
        firmenkontoService.ensureBookingForPayment(updated);
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



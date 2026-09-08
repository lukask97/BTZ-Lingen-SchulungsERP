import { createCRUDService } from "../core/genericService";
import auftraegeService from "../verkauf/auftraegeService";
import bestellungenService from "../einkauf/bestellungenService";
import kundenService from "../verkauf/customerService";
import lieferantenService from "../einkauf/lieferantenService";
import { getCustomerName } from "../../utils/customerReferences";
import { getSupplierName } from "../../utils/supplierReferences";
import { getInvoiceLifecycle, getInvoiceNextAction, getSuggestedDueDate, getHighestMahnstufe } from "../../utils/accountingWorkflow";
import { getBerlinDate } from "../../utils/dateTime";
import { getRechnungsnummer as buildInvoiceNumber } from "../core/documentNumbering";
import vertriebsdokumenteService from "../verkauf/vertriebsdokumenteService";
import { canCreateOutgoingInvoice } from "../../utils/processFlow";

const baseService = createCRUDService("rechnungen", []);
const reminderBaseService = createCRUDService("mahnungen", []);
const paymentBaseService = createCRUDService("zahlungen", []);

function safeLookup<T>(reader: () => T, fallback: T) {
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

function normalizeInvoice(item: any = {}) {
    const kunde = item.kundeId ? safeLookup(() => kundenService.getById(item.kundeId), null) : null;
    const lieferant = item.lieferantId ? safeLookup(() => lieferantenService.getById(item.lieferantId), null) : null;
    const outgoingInvoice = item.rechnungstyp !== "Eingangsrechnung";
    const partnerName = outgoingInvoice
        ? getCustomerName(item.kundeId, item.kunde || kunde?.firma || "")
        : getSupplierName(item.lieferantId, item.kunde || lieferant?.firma || "");
    const auftrag = item.auftragId ? safeLookup(() => auftraegeService.getById(item.auftragId), null) : null;
    const bestellung = item.bestellungId ? safeLookup(() => bestellungenService.getById(item.bestellungId), null) : null;
    const alleMahnungen = safeLookup(() => reminderBaseService.list(), []);
    const alleZahlungen = safeLookup(() => paymentBaseService.list(), []);
    const invoiceReminders = alleMahnungen.filter(entry => String(entry.rechnungId || "") === String(item.id || ""));
    const invoicePayments = alleZahlungen.filter(entry => String(entry.rechnungId || "") === String(item.id || ""));
    const mahnstufe = item.mahnstufe || getHighestMahnstufe(invoiceReminders);
    const status = getInvoiceLifecycle({ ...item, mahnstufe }, invoicePayments, invoiceReminders);

    return {
        ...item,
        auftragId: item.auftragId || "",
        auftragNr: item.auftragId ? (auftrag?.auftragNr || item.auftragNr || "") : (item.auftragNr || ""),
        bestellungId: item.bestellungId || "",
        bestellNr: item.bestellungId ? (bestellung?.bestellNr || item.bestellNr || "") : (item.bestellNr || ""),
        kundeId: item.kundeId || "",
        lieferantId: item.lieferantId || "",
        kunde: partnerName,
        iban: outgoingInvoice ? (kunde?.iban || item.iban || "") : (lieferant?.iban || item.iban || ""),
        faelligAm: item.faelligAm || bestellung?.faelligAm || auftrag?.faelligAm || getSuggestedDueDate(item.datum || getBerlinDate()),
        betrag: Number(item.betrag || 0),
        mahnstufe,
        status,
        lifecycleStatus: status,
        mahnungen: invoiceReminders,
        zahlungen: invoicePayments,
        nextAction: getInvoiceNextAction({ ...item, rechnungstyp: item.rechnungstyp, mahnstufe, status }, invoicePayments, invoiceReminders),
        inkassoStatus: item.inkassoStatus || "",
        inkassoAm: item.inkassoAm || "",
        inkassoGrund: item.inkassoGrund || ""
    };
}

function splitPayload(payload: any = {}) {
    const {
        kunde: _kunde,
        iban: _iban,
        auftragNr: _auftragNr,
        bestellNr: _bestellNr,
        mahnstufe: _mahnstufe,
        ...basePayload
    } = payload;

    return {
        ...basePayload,
        auftragId: basePayload.auftragId || "",
        bestellungId: basePayload.bestellungId || "",
        kundeId: basePayload.kundeId || "",
        lieferantId: basePayload.lieferantId || "",
        faelligAm: basePayload.faelligAm || ""
    };
}

function syncSourceDocument(invoice: any) {
    if (invoice.rechnungstyp === "Eingangsrechnung" && invoice.bestellungId) {
        const bestellung = safeLookup(() => bestellungenService.getById(invoice.bestellungId), null);
        if (!bestellung) return;
        bestellungenService.update({
            ...bestellung,
            rechnungStatus: invoice.status === "bezahlt" ? "bezahlt" : invoice.status,
            faelligAm: invoice.faelligAm || bestellung.faelligAm || ""
        });
        return;
    }

    if (invoice.auftragId) {
        const auftrag = safeLookup(() => auftraegeService.getById(invoice.auftragId), null);
        if (!auftrag) return;
        auftraegeService.update({
            ...auftrag,
            status: invoice.status === "bezahlt" ? "bezahlt" : "abgerechnet",
            faelligAm: invoice.faelligAm || auftrag.faelligAm || ""
        });
    }
}

const rechnungenService = {
    list() {
        return baseService.list().map(normalizeInvoice);
    },
    getAll() {
        return baseService.list().map(normalizeInvoice);
    },
    getById(id: number | string) {
        const item = baseService.getById(id);
        return item ? normalizeInvoice(item) : undefined;
    },
    create(payload: any) {
        const created = baseService.create(splitPayload(payload));
        const normalized = normalizeInvoice(created);
        syncSourceDocument(normalized);
        return normalized;
    },
    add(payload: any) {
        return this.create(payload);
    },
    update(idOrItem: any, payload?: any) {
        const updated = typeof idOrItem === "object"
             ? baseService.update(splitPayload(idOrItem))
            : baseService.update(idOrItem, splitPayload(payload));
        const normalized = normalizeInvoice(updated);
        syncSourceDocument(normalized);
        return normalized;
    },
    remove(id: number | string) {
        return baseService.remove(id);
    },
    delete(id: number | string) {
        return baseService.remove(id);
    },
    search(query: string) {
        return this.list().filter(item =>
            Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase())
        );
    },
    getByAuftragId(auftragId: number | string) {
        return this.list().find(item => String(item.auftragId || "") === String(auftragId)) || null;
    },
    getByBestellungId(bestellungId: number | string) {
        return this.list().find(item => String(item.bestellungId || "") === String(bestellungId)) || null;
    },
    createFromAuftrag(auftragId: number | string) {
        const bestehend = this.getByAuftragId(auftragId);
        if (bestehend) return bestehend;

        const auftrag = auftraegeService.getById(auftragId);
        if (!auftrag) return null;
        const dokumente = safeLookup(() => vertriebsdokumenteService.list(), []);
        if (!canCreateOutgoingInvoice(auftrag.id, dokumente)) return null;

        return this.create({
            rechnungsnr: buildInvoiceNumber(auftrag.auftragNr || "", auftrag.datum || getBerlinDate()),
            rechnungstyp: "Ausgangsrechnung",
            auftragId: auftrag.id,
            kundeId: auftrag.kundeId || "",
            datum: getBerlinDate(),
            faelligAm: auftrag.faelligAm || getSuggestedDueDate(getBerlinDate()),
            betrag: Number(auftrag.gesamtbetrag || 0),
            status: "offen",
            mahnstufe: "-",
            inkassoStatus: ""
        });
    },
    createFromBestellung(bestellungId: number | string, payload: any = {}) {
        const bestehend = this.getByBestellungId(bestellungId);
        if (bestehend) return bestehend;

        const bestellung = bestellungenService.getById(bestellungId);
        if (!bestellung) return null;
        const betrag = payload.betrag || (bestellung.positionen || []).reduce(
            (summe: number, position: any) => summe + Number(position.menge || 0) * Number(position.einzelpreis || 0),
            0
        );

        return this.create({
            rechnungsnr: payload.rechnungsnr || `ER-${String(bestellung.bestellNr || bestellung.id).replace(/[^A-Za-z0-9-]/g, "")}`,
            rechnungstyp: "Eingangsrechnung",
            bestellungId: bestellung.id,
            lieferantId: bestellung.lieferantId || "",
            datum: payload.datum || getBerlinDate(),
            faelligAm: payload.faelligAm || bestellung.faelligAm || getSuggestedDueDate(getBerlinDate()),
            betrag: Number(betrag || 0),
            status: "offen",
            mahnstufe: "-"
        });
    }
};

export const getRechnungen = () => rechnungenService.getAll();
export const updateRechnung = (rechnung: any) => rechnungenService.update(rechnung);
export const getRechnungsnummer = (auftragNr: string) => {
    const prefix = String(auftragNr || "").trim();
    if (prefix.startsWith("AU-")) return prefix.replace("AU-", "RG-");
    if (prefix.startsWith("VK-")) return prefix.replace("VK-", "RG-");
    return "RG-0000-001";
};

export default rechnungenService;

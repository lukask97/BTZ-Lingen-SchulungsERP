import { createCRUDService } from "../core/genericService";
import auftraegeService from "../verkauf/auftraegeService";
import bestellungenService from "../einkauf/bestellungenService";
import kundenService from "../verkauf/customerService";
import lieferantenService from "../einkauf/lieferantenService";
import { getCustomerName } from "../../utils/customerReferences";
import { getSupplierName } from "../../utils/supplierReferences";

const baseService = createCRUDService("rechnungen", []);

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
        faelligAm: item.faelligAm || "",
        betrag: Number(item.betrag || 0),
        mahnstufe: item.mahnstufe || "-"
    };
}

function splitPayload(payload: any = {}) {
    const {
        kunde,
        iban,
        auftragNr,
        bestellNr,
        mahnstufe,
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
            rechnungStatus: invoice.status === "bezahlt" ? "bezahlt" : "offen",
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
    update(idOrItem: any, payload: any) {
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

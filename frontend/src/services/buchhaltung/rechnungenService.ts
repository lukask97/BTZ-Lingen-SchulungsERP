import auftraegeService from "../verkauf/auftraegeService";
import bestellungenService from "../einkauf/bestellungenService";
import artikelService from "../logistik/artikelService";
import { getCustomerName } from "../../utils/customerReferences";
import { getSupplierName } from "../../utils/supplierReferences";
import kundenService from "../verkauf/customerService";
import lieferantenService from "../einkauf/lieferantenService";
import { getRechnungsnummer as buildInvoiceNumber } from "../core/documentNumbering";

const INVOICE_RELEVANT_STATUSES = ["abgerechnet", "bezahlt", "archiviert"];
const PURCHASE_INVOICE_RELEVANT_STATUSES = ["eingegangen"];

function isPermissionError(error: unknown) {
    return error instanceof Error && error.message.startsWith("Keine Berechtigung");
}

function toInvoiceNumber(auftragNr: string) {
    return buildInvoiceNumber(auftragNr);
}

function normalizeInvoiceStatus(status: string) {
    if (status === "bezahlt" || status === "archiviert") return "bezahlt";
    return "offen";
}

function mapOrderToInvoice(auftrag: any) {
    const kundenname = auftrag.kunde || getCustomerName(auftrag.kundeId, "");
    const kunde = kundenService.getById(auftrag.kundeId);

    return {
        id: auftrag.id,
        auftragId: auftrag.id,
        auftragNr: auftrag.auftragNr,
        rechnungsnr: toInvoiceNumber(auftrag.auftragNr),
        rechnungstyp: "Ausgangsrechnung",
        kundeId: auftrag.kundeId,
        kunde: kundenname,
        iban: kunde?.iban || "",
        bestellungId: "",
        bestellNr: "",
        datum: auftrag.datum,
        faelligAm: auftrag.faelligAm || "",
        betrag: Number(auftrag.gesamtbetrag || 0),
        status: normalizeInvoiceStatus(auftrag.status),
        mahnstufe: "-"
    };
}

function toIncomingInvoiceNumber(bestellNr: string) {
    return String(bestellNr || "").replace("EK-", "ER-");
}

function getPurchaseOrderAmount(bestellung: any) {
    if (bestellung.gesamtbetrag != null) {
        return Number(bestellung.gesamtbetrag || 0);
    }

    try {
        const artikel = artikelService.getAll();
        return (bestellung.positionen || []).reduce((summe: number, position: any) => {
            const artikelEintrag = artikel.find(item => item.id === position.artikelId);
            const einzelpreis = artikelEintrag?.einkaufspreis ?? position.einzelpreis ?? 0;
            return summe + Number(position.menge || 0) * Number(einzelpreis || 0);
        }, 0);
    } catch {
        return (bestellung.positionen || []).reduce((summe: number, position: any) => {
            return summe + Number(position.menge || 0) * Number(position.einzelpreis || 0);
        }, 0);
    }
}

function mapPurchaseOrderToInvoice(bestellung: any) {
    const lieferant = lieferantenService.getById(bestellung.lieferantId);
    return {
        id: `eingang-${bestellung.id}`,
        auftragId: "",
        auftragNr: "",
        bestellungId: bestellung.id,
        bestellNr: bestellung.bestellNr,
        rechnungsnr: toIncomingInvoiceNumber(bestellung.bestellNr),
        rechnungstyp: "Eingangsrechnung",
        kundeId: "",
        kunde: bestellung.lieferant || getSupplierName(bestellung.lieferantId, ""),
        lieferantId: bestellung.lieferantId,
        iban: lieferant?.iban || "",
        datum: bestellung.wareneingangAm || bestellung.datum,
        faelligAm: bestellung.faelligAm || "",
        betrag: getPurchaseOrderAmount(bestellung),
        status: bestellung.rechnungStatus === "bezahlt" ? "bezahlt" : "offen",
        mahnstufe: "-"
    };
}

function getInvoiceOrders() {
    try {
        return auftraegeService.getAll().filter((auftrag: any) => INVOICE_RELEVANT_STATUSES.includes(auftrag.status));
    } catch (error) {
        if (isPermissionError(error)) {
            return [];
        }
        throw error;
    }
}

function getIncomingInvoiceOrders() {
    try {
        return bestellungenService.getAll().filter((bestellung: any) =>
            PURCHASE_INVOICE_RELEVANT_STATUSES.includes(bestellung.status) || bestellung.rechnungStatus === "bezahlt"
        );
    } catch (error) {
        if (isPermissionError(error)) {
            return [];
        }
        throw error;
    }
}

const rechnungenService = {
    list() {
        return [
            ...getInvoiceOrders().map(mapOrderToInvoice),
            ...getIncomingInvoiceOrders().map(mapPurchaseOrderToInvoice)
        ];
    },
    getAll() {
        return this.list();
    },
    getById(id: number | string) {
        return this.list().find(item => String(item.id) === String(id));
    },
    create() {
        return null;
    },
    add() {
        return null;
    },
    update(item: any) {
        if (item.rechnungstyp === "Eingangsrechnung") {
            const bestellung = bestellungenService.getById(item.bestellungId);
            if (!bestellung) return null;
            const nextBestellung = {
                ...bestellung,
                rechnungStatus: item.status === "bezahlt" ? "bezahlt" : "offen",
                faelligAm: item.faelligAm ?? bestellung.faelligAm ?? ""
            };
            bestellungenService.update(nextBestellung);
            return mapPurchaseOrderToInvoice(nextBestellung);
        }
        const auftrag = auftraegeService.getById(item.auftragId ?? item.id);
        if (!auftrag) return null;
        const nextStatus = item.status === "bezahlt" ? "bezahlt" : "abgerechnet";
        auftraegeService.update({ ...auftrag, status: nextStatus, faelligAm: item.faelligAm ?? auftrag.faelligAm ?? "" });
        return mapOrderToInvoice({ ...auftrag, status: nextStatus, faelligAm: item.faelligAm ?? auftrag.faelligAm ?? "" });
    },
    remove() {},
    delete() {},
    search(query: string) {
        return this.list().filter(item =>
            Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase())
        );
    }
};

export const getRechnungen = () => rechnungenService.getAll();
export const updateRechnung = (rechnung: any) => rechnungenService.update(rechnung);
export const getRechnungsnummer = (auftragNr: string) => toInvoiceNumber(auftragNr);

export default rechnungenService;

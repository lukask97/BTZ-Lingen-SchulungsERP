import auftraegeService from "./auftraegeService";
import { getCustomerName } from "../utils/customerReferences";

const INVOICE_RELEVANT_STATUSES = ["abgerechnet", "bezahlt", "archiviert"];

function toInvoiceNumber(auftragNr: string) {
    return String(auftragNr || "").replace("VK-", "RE-");
}

function normalizeInvoiceStatus(status: string) {
    if (status === "bezahlt" || status === "archiviert") return "bezahlt";
    return "offen";
}

function mapOrderToInvoice(auftrag: any) {
    return {
        id: auftrag.id,
        auftragId: auftrag.id,
        auftragNr: auftrag.auftragNr,
        rechnungsnr: toInvoiceNumber(auftrag.auftragNr),
        rechnungstyp: "Ausgangsrechnung",
        kundeId: auftrag.kundeId,
        kunde: getCustomerName(auftrag.kundeId, auftrag.kunde),
        bestellungId: "",
        bestellNr: "",
        datum: auftrag.datum,
        faelligAm: auftrag.faelligAm || "",
        betrag: Number(auftrag.gesamtbetrag || 0),
        status: normalizeInvoiceStatus(auftrag.status),
        mahnstufe: "-"
    };
}

function getInvoiceOrders() {
    return auftraegeService.getAll().filter((auftrag: any) => INVOICE_RELEVANT_STATUSES.includes(auftrag.status));
}

const rechnungenService = {
    list() {
        return getInvoiceOrders().map(mapOrderToInvoice);
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

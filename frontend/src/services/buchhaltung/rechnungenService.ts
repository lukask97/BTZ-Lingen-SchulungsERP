import auftraegeService from "../verkauf/auftraegeService";
import bestellungenService from "../einkauf/bestellungenService";
import artikelService from "../logistik/artikelService";
import { getCustomerName } from "../../utils/customerReferences";

const INVOICE_RELEVANT_STATUSES = ["abgerechnet", "bezahlt", "archiviert"];
const PURCHASE_INVOICE_RELEVANT_STATUSES = ["eingegangen"];

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

function toIncomingInvoiceNumber(bestellNr: string) {
    return String(bestellNr || "").replace("EK-", "ER-");
}

function getPurchaseOrderAmount(bestellung: any) {
    return (bestellung.positionen || []).reduce((summe: number, position: any) => {
        const artikel = artikelService.getAll().find(item => item.id === position.artikelId);
        return summe + Number(position.menge || 0) * Number(artikel?.einkaufspreis || 0);
    }, 0);
}

function mapPurchaseOrderToInvoice(bestellung: any) {
    return {
        id: `eingang-${bestellung.id}`,
        auftragId: "",
        auftragNr: "",
        bestellungId: bestellung.id,
        bestellNr: bestellung.bestellNr,
        rechnungsnr: toIncomingInvoiceNumber(bestellung.bestellNr),
        rechnungstyp: "Eingangsrechnung",
        kundeId: "",
        kunde: bestellung.lieferant,
        lieferantId: bestellung.lieferantId,
        datum: bestellung.wareneingangAm || bestellung.datum,
        faelligAm: bestellung.faelligAm || "",
        betrag: getPurchaseOrderAmount(bestellung),
        status: bestellung.rechnungStatus === "bezahlt" ? "bezahlt" : "offen",
        mahnstufe: "-"
    };
}

function getInvoiceOrders() {
    return auftraegeService.getAll().filter((auftrag: any) => INVOICE_RELEVANT_STATUSES.includes(auftrag.status));
}

function getIncomingInvoiceOrders() {
    return bestellungenService.getAll().filter((bestellung: any) =>
        PURCHASE_INVOICE_RELEVANT_STATUSES.includes(bestellung.status) || bestellung.rechnungStatus === "bezahlt"
    );
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

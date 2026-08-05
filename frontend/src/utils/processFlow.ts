export const SALES_STEPS = {
    ANGEBOT_OFFEN: 1,
    ANGEBOT_WARTET_AUF_ANTWORT: 2,
    ANGEBOT_ANGENOMMEN: 3,
    AUFTRAGSBESTAETIGUNG_ERSTELLT: 4,
    AUFTRAGSBESTAETIGUNG_GESENDET: 5,
    VERSAND_ERSTELLT: 6,
    VERSAND_VERSENDET: 7,
    ANGEBOT_ABGELEHNT: 98
};

export const PURCHASE_STEPS = {
    ANFRAGE_ERFASST: 1,
    DURCH_LEHRKRAFT_BESTAETIGT: 2,
    AN_LIEFERANTEN_VERSENDET: 3,
    WARENEINGANG_GEBUCHT: 4
};

function normalize(value) {
    return String(value ?? "");
}

function isConfirmationDocumentType(value) {
    const normalized = normalize(value).toLowerCase();
    return normalized === "auftragsbestaetigung"
        || normalized === "auftragsbestätigung"
        || normalized === "auftragsbestã¤tigung";
}

export function getVorgangId(item) {
    return normalize(item?.vorgangId || (item?.anfrageId ? `anfrage-${item.anfrageId}` : item?.id ? `anfrage-${item.id}` : ""));
}

export function getOffersForVorgang(vorgangId, angebote = []) {
    return angebote.filter(item => normalize(item.vorgangId) === normalize(vorgangId));
}

export function getOrderForOffer(angebotId, auftraege = []) {
    return auftraege.find(item => normalize(item.angebotId) === normalize(angebotId));
}

export function getOrdersForVorgang(vorgangId, auftraege = [], angebote = []) {
    const angebotIds = new Set(getOffersForVorgang(vorgangId, angebote).map(item => normalize(item.id)));
    return auftraege.filter(item =>
        normalize(item.vorgangId) === normalize(vorgangId)
        || angebotIds.has(normalize(item.angebotId))
    );
}

export function getSalesDocumentsForOrder(auftragId, dokumente = []) {
    return dokumente.filter(item => normalize(item.auftragId) === normalize(auftragId));
}

export function getOfferForOrder(auftrag, angebote = []) {
    if (!auftrag) return null;
    if (auftrag.angebotId) {
        return angebote.find(item => normalize(item.id) === normalize(auftrag.angebotId)) || null;
    }
    if (auftrag.vorgangId) {
        return getOffersForVorgang(auftrag.vorgangId, angebote)
            .slice()
            .sort((a, b) => Number(b.revision || 0) - Number(a.revision || 0))[0] || null;
    }
    return null;
}

export function getInquiryForOffer(angebot, anfragen = []) {
    if (!angebot) return null;
    if (angebot.anfrageId) {
        return anfragen.find(item => normalize(item.id) === normalize(angebot.anfrageId)) || null;
    }
    if (angebot.vorgangId) {
        return anfragen.find(item => normalize(item.vorgangId) === normalize(angebot.vorgangId)) || null;
    }
    return null;
}

export function getInquiryForOrder(auftrag, angebote = [], anfragen = []) {
    if (!auftrag) return null;
    if (auftrag.anfrageId) {
        return anfragen.find(item => normalize(item.id) === normalize(auftrag.anfrageId)) || null;
    }
    const angebot = getOfferForOrder(auftrag, angebote);
    return getInquiryForOffer(angebot, anfragen);
}

export function getProcessContextForDocument(dokument, auftraege = [], angebote = [], anfragen = []) {
    const auftrag = dokument?.auftragId
        ? auftraege.find(item => normalize(item.id) === normalize(dokument.auftragId)) || null
        : null;
    const angebot = getOfferForOrder(auftrag, angebote);
    const anfrage = getInquiryForOrder(auftrag, angebote, anfragen);
    const vorgangId = normalize(dokument?.vorgangId || auftrag?.vorgangId || angebot?.vorgangId || anfrage?.vorgangId);

    return { auftrag, angebot, anfrage, vorgangId };
}

export function getSalesDocumentsForVorgang(vorgangId, dokumente = [], auftraege = [], angebote = []) {
    const auftragIds = new Set(getOrdersForVorgang(vorgangId, auftraege, angebote).map(item => normalize(item.id)));
    return dokumente.filter(item =>
        normalize(item.vorgangId) === normalize(vorgangId)
        || auftragIds.has(normalize(item.auftragId))
    );
}

export function getConfirmationDocument(auftragId, dokumente = []) {
    return getSalesDocumentsForOrder(auftragId, dokumente).find(item => isConfirmationDocumentType(item.dokumentTyp));
}

export function getSalesStepForOrder(auftrag, dokumente = [], versandauftraege = []) {
    if (!auftrag) return SALES_STEPS.ANGEBOT_ANGENOMMEN;
    const bestaetigung = getConfirmationDocument(auftrag.id, dokumente);
    if (!bestaetigung) return SALES_STEPS.ANGEBOT_ANGENOMMEN;
    if (bestaetigung.status !== "versendet") return SALES_STEPS.AUFTRAGSBESTAETIGUNG_ERSTELLT;

    const versand = versandauftraege.find(item => normalize(item.auftragId) === normalize(auftrag.id));
    if (!versand) return SALES_STEPS.AUFTRAGSBESTAETIGUNG_GESENDET;
    if (versand.status !== "versendet") return SALES_STEPS.VERSAND_ERSTELLT;
    return SALES_STEPS.VERSAND_VERSENDET;
}

export function getSalesStep(angebot, auftraege = [], dokumente = [], versandauftraege = []) {
    if (!angebot) return SALES_STEPS.ANGEBOT_ANGENOMMEN;
    if (angebot?.status === "abgelehnt") return SALES_STEPS.ANGEBOT_ABGELEHNT;
    if (angebot?.status === "wartet auf Antwort") return SALES_STEPS.ANGEBOT_WARTET_AUF_ANTWORT;
    if (angebot?.status === "beendet") return SALES_STEPS.ANGEBOT_OFFEN;

    const auftrag = getOrderForOffer(angebot.id, auftraege);
    if (!auftrag) return SALES_STEPS.ANGEBOT_OFFEN;
    return getSalesStepForOrder(auftrag, dokumente, versandauftraege);
}

export function getSalesStepLabel(step) {
    switch (step) {
        case SALES_STEPS.ANGEBOT_OFFEN:
            return "1. Angebot offen";
        case SALES_STEPS.ANGEBOT_WARTET_AUF_ANTWORT:
            return "2. Warte auf Antwort";
        case SALES_STEPS.ANGEBOT_ANGENOMMEN:
            return "3. Angebot angenommen";
        case SALES_STEPS.AUFTRAGSBESTAETIGUNG_ERSTELLT:
            return "4. Auftragsbestaetigung erstellt";
        case SALES_STEPS.AUFTRAGSBESTAETIGUNG_GESENDET:
            return "5. Auftragsbestaetigung gesendet";
        case SALES_STEPS.VERSAND_ERSTELLT:
            return "6. Versand vorbereitet";
        case SALES_STEPS.VERSAND_VERSENDET:
            return "7. Versand versendet";
        case SALES_STEPS.ANGEBOT_ABGELEHNT:
            return "Angebot abgelehnt";
        default:
            return "-";
    }
}

export function canStartShipping(auftragId, dokumente = []) {
    const bestaetigung = getConfirmationDocument(auftragId, dokumente);
    return Boolean(bestaetigung && bestaetigung.status === "versendet");
}

export function getReadyForShippingOrders(auftraege = [], dokumente = []) {
    return auftraege.filter(item => canStartShipping(item.id, dokumente));
}

export function getShipmentForOrder(auftragId, versandauftraege = []) {
    return versandauftraege.find(item => normalize(item.auftragId) === normalize(auftragId)) || null;
}

export function getOrdersWithoutShipment(auftraege = [], dokumente = [], versandauftraege = []) {
    return getReadyForShippingOrders(auftraege, dokumente)
        .filter(item => !getShipmentForOrder(item.id, versandauftraege));
}

export function getPurchaseDocuments(bestellungId, dokumente = []) {
    return dokumente.filter(item => normalize(item.bestellungId) === normalize(bestellungId));
}

export function isPurchaseRequestOpen(bestellung) {
    return normalize(bestellung?.status) === "angefragt";
}

export function isPurchaseConfirmed(bestellung) {
    return normalize(bestellung?.status) === "bestaetigt";
}

export function isPurchaseSent(bestellung) {
    return normalize(bestellung?.status) === "versendet";
}

export function getPurchaseOrdersByStatus(bestellungen = [], status) {
    return bestellungen.filter(item => normalize(item.status) === normalize(status));
}

export function getPurchaseStep(bestellung) {
    if (!bestellung) return PURCHASE_STEPS.ANFRAGE_ERFASST;
    if (normalize(bestellung.status) === "eingegangen") return PURCHASE_STEPS.WARENEINGANG_GEBUCHT;
    if (isPurchaseSent(bestellung)) return PURCHASE_STEPS.AN_LIEFERANTEN_VERSENDET;
    if (isPurchaseConfirmed(bestellung)) return PURCHASE_STEPS.DURCH_LEHRKRAFT_BESTAETIGT;
    return PURCHASE_STEPS.ANFRAGE_ERFASST;
}

export function getPurchaseStepLabel(step) {
    switch (step) {
        case PURCHASE_STEPS.ANFRAGE_ERFASST:
            return "1. Anfrage erfasst";
        case PURCHASE_STEPS.DURCH_LEHRKRAFT_BESTAETIGT:
            return "2. Bestellung bestaetigt";
        case PURCHASE_STEPS.AN_LIEFERANTEN_VERSENDET:
            return "3. Bestellung versendet";
        case PURCHASE_STEPS.WARENEINGANG_GEBUCHT:
            return "4. Wareneingang gebucht";
        default:
            return "-";
    }
}

export function canBookGoodsReceipt(bestellung) {
    return isPurchaseSent(bestellung);
}

export function getOpenGoodsReceiptOrders(bestellungen = []) {
    return bestellungen.filter(item => canBookGoodsReceipt(item));
}

export function canConfirmPurchaseOrder(bestellung) {
    return isPurchaseRequestOpen(bestellung);
}

export function canSendPurchaseOrder(bestellung) {
    return isPurchaseConfirmed(bestellung);
}

export function canCreateIncomingInvoice(bestellung) {
    return normalize(bestellung?.status) === "eingegangen";
}

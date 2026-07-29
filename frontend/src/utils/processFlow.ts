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

export function getOrderForOffer(angebotId, auftraege = []) {
    return auftraege.find(item => normalize(item.angebotId) === normalize(angebotId));
}

export function getSalesDocumentsForOrder(auftragId, dokumente = []) {
    return dokumente.filter(item => normalize(item.auftragId) === normalize(auftragId));
}

export function getConfirmationDocument(auftragId, dokumente = []) {
    return getSalesDocumentsForOrder(auftragId, dokumente).find(item => item.dokumentTyp === "Auftragsbestätigung");
}

export function getSalesStep(angebot, auftraege = [], dokumente = [], versandauftraege = []) {
    if (angebot?.status === "abgelehnt") return SALES_STEPS.ANGEBOT_ABGELEHNT;
    if (angebot?.status === "wartet auf Antwort") return SALES_STEPS.ANGEBOT_WARTET_AUF_ANTWORT;
    if (angebot?.status === "beendet") return SALES_STEPS.ANGEBOT_OFFEN;

    const auftrag = getOrderForOffer(angebot.id, auftraege);
    if (!auftrag) return SALES_STEPS.ANGEBOT_OFFEN;

    const bestaetigung = getConfirmationDocument(auftrag.id, dokumente);
    if (!bestaetigung) return SALES_STEPS.ANGEBOT_ANGENOMMEN;
    if (bestaetigung.status !== "versendet") return SALES_STEPS.AUFTRAGSBESTAETIGUNG_ERSTELLT;

    const versand = versandauftraege.find(item => normalize(item.auftragId) === normalize(auftrag.id));
    if (!versand) return SALES_STEPS.AUFTRAGSBESTAETIGUNG_GESENDET;
    if (versand.status !== "versendet") return SALES_STEPS.VERSAND_ERSTELLT;
    return SALES_STEPS.VERSAND_VERSENDET;
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
            return "4. Auftragsbestätigung erstellt";
        case SALES_STEPS.AUFTRAGSBESTAETIGUNG_GESENDET:
            return "5. Auftragsbestätigung gesendet";
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

export function getPurchaseDocuments(bestellungId, dokumente = []) {
    return dokumente.filter(item => normalize(item.bestellungId) === normalize(bestellungId));
}

export function getPurchaseStep(bestellung) {
    if (!bestellung) return PURCHASE_STEPS.ANFRAGE_ERFASST;
    if (bestellung.status === "eingegangen") return PURCHASE_STEPS.WARENEINGANG_GEBUCHT;
    if (bestellung.status === "versendet") return PURCHASE_STEPS.AN_LIEFERANTEN_VERSENDET;
    if (bestellung.status === "bestaetigt") return PURCHASE_STEPS.DURCH_LEHRKRAFT_BESTAETIGT;
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
    return bestellung?.status === "versendet";
}

export function canCreateIncomingInvoice(bestellung) {
    return bestellung?.status === "eingegangen";
}

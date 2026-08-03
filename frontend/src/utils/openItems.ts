import { getBerlinDate } from "./dateTime";

function getToday() {
    return getBerlinDate();
}

export function getOpenItemStatus(rechnung: any) {
    const today = getToday();
    if (!rechnung) return "offen";
    if (rechnung.status === "bezahlt") return "bezahlt";
    if (rechnung.status === "storniert") return "storniert";
    if (rechnung.faelligAm && rechnung.faelligAm < today) return "ueberfaellig";
    return "offen";
}

export function isOpenItem(rechnung: any) {
    const status = getOpenItemStatus(rechnung);
    return status === "offen" || status === "ueberfaellig";
}

export function isOverdueOpenItem(rechnung: any) {
    return getOpenItemStatus(rechnung) === "ueberfaellig";
}

export function sumOpenItems(rechnungen: any[] = []) {
    return rechnungen
        .filter(isOpenItem)
        .reduce((summe, rechnung) => summe + Number(rechnung.betrag || 0), 0);
}

export function sumPaidItems(rechnungen: any[] = []) {
    return rechnungen
        .filter(rechnung => getOpenItemStatus(rechnung) === "bezahlt")
        .reduce((summe, rechnung) => summe + Number(rechnung.betrag || 0), 0);
}

export function getPaymentOpenItemStatus(zahlung: any) {
    const today = getToday();
    if (!zahlung) return "offen";
    if (zahlung.status === "ausgefuehrt") return "bezahlt";
    if (zahlung.status === "storniert") return "storniert";
    if ((zahlung.ausfuehrenAm || zahlung.datum) && (zahlung.ausfuehrenAm || zahlung.datum) < today) return "ueberfaellig";
    return "offen";
}

export function isPendingPayment(zahlung: any) {
    const status = getPaymentOpenItemStatus(zahlung);
    return status === "offen" || status === "ueberfaellig";
}

export function isOverduePayment(zahlung: any) {
    return getPaymentOpenItemStatus(zahlung) === "ueberfaellig";
}

export function getUnifiedOpenItems(rechnungen: any[] = [], zahlungen: any[] = []) {
    const offeneRechnungen = rechnungen
        .filter(isOpenItem)
        .map(rechnung => ({
            id: `rechnung-${rechnung.id}`,
            quelltyp: "Rechnung",
            referenz: rechnung.rechnungsnr,
            partner: rechnung.kunde,
            fachtyp: rechnung.rechnungstyp,
            datum: rechnung.datum,
            faelligAm: rechnung.faelligAm || "",
            betrag: Number(rechnung.betrag || 0),
            ampel: getOpenItemStatus(rechnung),
            link: `/rechnungen?focus=${rechnung.rechnungsnr}`
        }));

    const offeneZahlungen = zahlungen
        .filter(isPendingPayment)
        .map(zahlung => ({
            id: `zahlung-${zahlung.id}`,
            quelltyp: "Zahlung",
            referenz: zahlung.rechnungsnr,
            partner: zahlung.kunde,
            fachtyp: zahlung.zahlungsart === "Ausgang" ? "geplanter Zahlungsausgang" : "geplanter Zahlungseingang",
            datum: zahlung.datum,
            faelligAm: zahlung.ausfuehrenAm || zahlung.datum || "",
            betrag: Number(zahlung.betrag || 0),
            ampel: getPaymentOpenItemStatus(zahlung),
            link: `/zahlungen?focus=${zahlung.rechnungsnr}`
        }));

    return [...offeneRechnungen, ...offeneZahlungen];
}

export function sumUnifiedOpenItems(rechnungen: any[] = [], zahlungen: any[] = []) {
    return getUnifiedOpenItems(rechnungen, zahlungen)
        .reduce((summe, item) => summe + Number(item.betrag || 0), 0);
}

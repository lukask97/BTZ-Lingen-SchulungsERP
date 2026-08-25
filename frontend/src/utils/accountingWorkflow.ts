import fristenOptionenService from "../services/verwaltung/fristenOptionenService";
import { getBerlinDate, getRelativeBerlinDate } from "./dateTime";

export type Mahnstufe = "-" | "Zahlungserinnerung" | "1. Mahnung" | "2. Mahnung" | "Inkasso";
const REMINDER_FEES: Record<string, number> = {
    "zahlungserinnerung": 0,
    "1. mahnung": 5,
    "2. mahnung": 10,
    "inkasso": 20
};

function normalize(value: unknown) {
    return String(value ?? "").trim().toLowerCase();
}

export function getAccountingDeadlines() {
    return fristenOptionenService.get();
}

export function getDaysUntil(dateValue: string, today = getBerlinDate()) {
    if (!dateValue) return null;
    const start = new Date(`${today}T00:00:00`);
    const end = new Date(`${dateValue}T00:00:00`);
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getDaysSince(dateValue: string, today = getBerlinDate()) {
    const daysUntil = getDaysUntil(dateValue, today);
    return daysUntil === null ? null : -daysUntil;
}

export function getDaysOverdue(dateValue: string, today = getBerlinDate()) {
    const daysUntil = getDaysUntil(dateValue, today);
    if (daysUntil === null) return null;
    return Math.max(0, -daysUntil);
}

export function getMahnstufeRank(stufe: string) {
    const normalized = normalize(stufe);
    if (normalized === "inkasso") return 4;
    if (normalized === "2. mahnung") return 3;
    if (normalized === "1. mahnung") return 2;
    if (normalized === "zahlungserinnerung") return 1;
    return 0;
}

export function getHighestMahnstufe(mahnungen: any[] = []): Mahnstufe {
    const highest = mahnungen.reduce((current, item) => {
        const stufe = item.stufe || item.mahnstufe || "-";
        return getMahnstufeRank(stufe) > getMahnstufeRank(current) ? stufe : current;
    }, "-" as Mahnstufe);

    return (highest || "-") as Mahnstufe;
}

export function getNextMahnstufe(mahnungen: any[] = []): Mahnstufe {
    const highestRank = getMahnstufeRank(getHighestMahnstufe(mahnungen));
    if (highestRank <= 0) return "Zahlungserinnerung";
    if (highestRank === 1) return "1. Mahnung";
    if (highestRank === 2) return "2. Mahnung";
    return "Inkasso";
}

export function getMahnlaufPhase(rechnung: any, today = getBerlinDate()) {
    const fristen = getAccountingDeadlines();
    const overdueDays = getDaysOverdue(rechnung?.faelligAm || "", today);

    if (overdueDays === null) return "offen";
    if (overdueDays >= fristen.inkassoAbTage) return "inkasso";
    if (overdueDays >= fristen.mahnung2AbTage) return "mahnbar2";
    if (overdueDays >= fristen.mahnung1AbTage) return "mahnbar1";

    const daysSinceInvoice = getDaysSince(rechnung?.datum || "", today);
    if (daysSinceInvoice !== null && daysSinceInvoice >= fristen.zahlungserinnerungTage) return "zahlungserinnerung";
    if (daysSinceInvoice !== null && daysSinceInvoice <= fristen.skontoTage) return "skonto";
    if (overdueDays > 0) return "ueberfaellig";
    if (overdueDays === 0) return "faellig";
    return "offen";
}

export function isInvoicePaid(invoice: any, payments: any[] = []) {
    if (normalize(invoice?.status) === "bezahlt") return true;
    return payments.some(payment =>
        String(payment.rechnungId || "") === String(invoice?.id || "")
        && ["ausgefuehrt", "zugeordnet", "bezahlt"].includes(normalize(payment.status))
    );
}

export function getInvoiceLifecycle(invoice: any, payments: any[] = [], mahnungen: any[] = [], today = getBerlinDate()) {
    if (!invoice) return "offen";
    const status = normalize(invoice.status);

    if (status === "storniert") return "storniert";
    if (isInvoicePaid(invoice, payments)) return "bezahlt";
    if (normalize(invoice.inkassoStatus) === "uebergeben" || normalize(invoice.mahnstufe) === "inkasso") return "inkasso";

    const activeMahnstufe = getHighestMahnstufe(
        mahnungen.filter(item => normalize(item.status) !== "storniert")
    );
    if (getMahnstufeRank(activeMahnstufe) > 0) return "gemahnt";

    const overdueDays = getDaysOverdue(invoice.faelligAm || "", today);
    if (overdueDays === null) return "erstellt";
    if (overdueDays > 0) return "ueberfaellig";
    if (overdueDays === 0) return "faellig";
    return status === "erstellt" ? "erstellt" : "offen";
}

export function getInvoiceNextAction(invoice: any, payments: any[] = [], mahnungen: any[] = [], today = getBerlinDate()) {
    const lifecycle = getInvoiceLifecycle(invoice, payments, mahnungen, today);
    const outgoing = invoice?.rechnungstyp !== "Eingangsrechnung";

    if (lifecycle === "storniert") return "Keine Aktion";
    if (lifecycle === "bezahlt") return "Abgeschlossen";

    if (!outgoing) {
        if (lifecycle === "faellig" || lifecycle === "ueberfaellig") return "Zahlungsausgang ausfuehren";
        return "Rechnung pruefen";
    }

    const nextStage = getNextMahnstufe(mahnungen.filter(item => normalize(item.status) !== "storniert"));
    if (lifecycle === "inkasso") return "Inkasso dokumentieren";
    if (lifecycle === "gemahnt" || lifecycle === "ueberfaellig") {
        return nextStage === "Inkasso" ? "An Inkasso uebergeben" : `${nextStage} vorbereiten`;
    }
    if (lifecycle === "faellig") return "Zahlung pruefen";
    return "Offenen Posten beobachten";
}

export function canCreateReminder(invoice: any, payments: any[] = [], mahnungen: any[] = [], today = getBerlinDate()) {
    if (!invoice || invoice.rechnungstyp === "Eingangsrechnung") return false;
    const lifecycle = getInvoiceLifecycle(invoice, payments, mahnungen, today);
    if (["bezahlt", "storniert", "inkasso"].includes(lifecycle)) return false;

    const phase = getMahnlaufPhase(invoice, today);
    const nextStage = getNextMahnstufe(mahnungen.filter(item => normalize(item.status) !== "storniert"));
    if (nextStage === "Zahlungserinnerung") return ["zahlungserinnerung", "mahnbar1", "mahnbar2", "inkasso", "ueberfaellig"].includes(phase);
    if (nextStage === "1. Mahnung") return ["mahnbar1", "mahnbar2", "inkasso"].includes(phase);
    if (nextStage === "2. Mahnung") return ["mahnbar2", "inkasso"].includes(phase);
    return false;
}

export function canTransferToInkasso(invoice: any, payments: any[] = [], mahnungen: any[] = [], today = getBerlinDate()) {
    if (!invoice || invoice.rechnungstyp === "Eingangsrechnung") return false;
    if (["bezahlt", "storniert", "inkasso"].includes(getInvoiceLifecycle(invoice, payments, mahnungen, today))) return false;
    const nextStage = getNextMahnstufe(mahnungen.filter(item => normalize(item.status) !== "storniert"));
    return nextStage === "Inkasso" && getMahnlaufPhase(invoice, today) === "inkasso";
}

export function getSuggestedDueDate(referenceDate = getBerlinDate()) {
    const fristen = getAccountingDeadlines();
    return getRelativeBerlinDate(fristen.zahlungszielTage, referenceDate);
}

export function isWithinSkonto(invoice: any, today = getBerlinDate()) {
    if (!invoice?.datum) return false;
    const fristen = getAccountingDeadlines();
    const daysSinceInvoice = getDaysSince(invoice.datum, today);
    return daysSinceInvoice !== null && daysSinceInvoice <= fristen.skontoTage;
}

export function getSkontoAmount(invoice: any, today = getBerlinDate()) {
    if (!isWithinSkonto(invoice, today)) return 0;
    const fristen = getAccountingDeadlines();
    const amount = Number(invoice?.betrag || 0);
    return Math.round(amount * (Number(fristen.skontoProzent || 0) / 100) * 100) / 100;
}

export function getSkontoSettlementAmount(invoice: any, today = getBerlinDate()) {
    return Math.max(0, Number(invoice?.betrag || 0) - getSkontoAmount(invoice, today));
}

export function getMahngebuehren(invoice: any, mahnungen: any[] = []) {
    const stage = getHighestMahnstufe(mahnungen.filter(item => normalize(item.status) !== "storniert")) || invoice?.mahnstufe || "-";
    return REMINDER_FEES[normalize(stage)] || 0;
}

export function getInvoiceSettlementSummary(invoice: any, payments: any[] = [], mahnungen: any[] = [], today = getBerlinDate()) {
    const fristen = getAccountingDeadlines();
    const invoiceAmount = Number(invoice?.betrag || 0);
    const skontoAmount = getSkontoAmount(invoice, today);
    const amountWithSkonto = skontoAmount > 0 ? Math.max(0, invoiceAmount - skontoAmount) : invoiceAmount;
    const mahngebuehren = getMahngebuehren(invoice, mahnungen);
    const amountWithoutSkonto = invoiceAmount;
    const amountWithMahngebuehren = invoiceAmount + mahngebuehren;
    const settledAmount = payments
        .filter(payment => ["ausgefuehrt", "zugeordnet", "bezahlt", "bearbeitet"].includes(normalize(payment.status)))
        .reduce((sum, payment) => sum + Number(payment.betrag || 0), 0);
    const skontoDeadline = invoice?.datum ? getRelativeBerlinDate(fristen.skontoTage, invoice.datum) : "";
    const mahnDueDate = mahngebuehren > 0
        ? getRelativeBerlinDate(fristen.zahlungszielTage + 1, invoice?.faelligAm || today)
        : "";

    return {
        invoiceAmount,
        skontoAmount,
        amountWithSkonto,
        amountWithoutSkonto,
        mahngebuehren,
        amountWithMahngebuehren,
        settledAmount,
        dueDate: invoice?.faelligAm || "",
        skontoDeadline,
        mahnDueDate,
        skontoAllowed: isWithinSkonto(invoice, today)
    };
}

export function evaluateIncomingPayment({
    invoice,
    paymentAmount,
    payments = [],
    mahnungen = [],
    today = getBerlinDate()
}: {
    invoice: any;
    paymentAmount: number;
    payments?: any[];
    mahnungen?: any[];
    today?: string;
}) {
    const summary = getInvoiceSettlementSummary(invoice, payments, mahnungen, today);
    const totalReceived = Number(paymentAmount || 0) + Number(summary.settledAmount || 0);
    const targetAmount = summary.skontoAllowed ? summary.amountWithSkonto : summary.amountWithMahngebuehren;
    const delta = Math.round((totalReceived - targetAmount) * 100) / 100;

    return {
        ...summary,
        paymentAmount: Number(paymentAmount || 0),
        targetAmount,
        totalReceived,
        delta,
        result: delta === 0 ? "beglichen" : delta < 0 ? "teilzahlung" : "ueberzahlung",
        shortfall: delta < 0 ? Math.abs(delta) : 0,
        overpayment: delta > 0 ? delta : 0
    };
}

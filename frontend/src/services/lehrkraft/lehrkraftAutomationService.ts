import vertriebsdokumenteService from "../verkauf/vertriebsdokumenteService";
import zahlungenService from "../buchhaltung/zahlungenService";
import rechnungenService from "../buchhaltung/rechnungenService";
import lehrkraftOptionenService from "./lehrkraftOptionenService";
import { addDaysToIsoDate, getBerlinDate } from "../../utils/dateTime";

function isOlderThanOneDay(dateValue?: string) {
    if (!dateValue) return false;
    const today = getBerlinDate();
    return addDaysToIsoDate(dateValue, 1) <= today;
}

function istVersanddokument(item: any) {
    const typ = String(item?.dokumentTyp || "").toLowerCase();
    return ["lieferschein", "warenbegleitpapier", "transportpapier"].includes(typ);
}

function getBaseDate(item: any) {
    return String(item?.ausfuehrenAm || item?.ausfuehrungsdatum || item?.datum || "");
}

function createStableNumber(seed: string) {
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
        hash = ((hash * 31) + seed.charCodeAt(index)) >>> 0;
    }
    return hash / 4294967295;
}

function resolveFixedDistributionOffset(seed: string, entries: Array<{ tage: number; gewichtung: number }>) {
    const gesamtgewicht = entries.reduce((sum, entry) => sum + entry.gewichtung, 0);
    if (gesamtgewicht <= 0) return null;

    const wert = createStableNumber(seed) * gesamtgewicht;
    let laufend = 0;
    const treffer = entries.find(entry => {
        laufend += entry.gewichtung;
        return wert < laufend;
    }) || entries[entries.length - 1];

    return treffer?.tage ?? null;
}

function resolveWeightedPaymentTarget(item: any, regeln: any[]) {
    const gueltigeRegeln = regeln
        .filter(regel => Number(regel?.gewichtung) > 0)
        .map(regel => ({
            ...regel,
            startTag: Number(regel.startTag || 0),
            endTag: Number(regel.endTag || 0),
            gewichtung: Number(regel.gewichtung || 0)
        }));

    if (gueltigeRegeln.length === 0) return null;

    const gesamtgewicht = gueltigeRegeln.reduce((sum, regel) => sum + regel.gewichtung, 0);
    if (gesamtgewicht <= 0) return null;

    const seed = `${item.id}|${item.rechnungId || ""}|${item.bestellungId || ""}|${item.rechnungsnr || ""}|${item.bestellNr || ""}`;
    const ruleValue = createStableNumber(`${seed}|rule`) * gesamtgewicht;
    let laufend = 0;
    const regel = gueltigeRegeln.find(eintrag => {
        laufend += eintrag.gewichtung;
        return ruleValue < laufend;
    }) || gueltigeRegeln[gueltigeRegeln.length - 1];

    if (regel.startTag === 0 && regel.endTag === 0) {
        return { keineZahlung: true, offsetTage: null };
    }

    const span = Math.max(0, regel.endTag - regel.startTag);
    const tagValue = createStableNumber(`${seed}|day`);
    const offsetTage = regel.startTag + Math.floor(tagValue * (span + 1));

    return { keineZahlung: false, offsetTage };
}

function ensureScheduledCustomerPayments() {
    const rechnungen = rechnungenService.list()
        .filter(item => item.rechnungstyp === "Ausgangsrechnung")
        .filter(item => String(item.status || "").toLowerCase() !== "bezahlt");
    const bestehendeZahlungen = zahlungenService.list()
        .filter(item => item.zahlungsart !== "Ausgang");

    let changes = 0;

    rechnungen.forEach(rechnung => {
        const gibtEsSchon = bestehendeZahlungen.some(item => String(item.rechnungId || "") === String(rechnung.id));
        if (gibtEsSchon) return;

        zahlungenService.create({
            rechnungId: rechnung.id,
            zahlungsart: "Eingang",
            datum: getBerlinDate(),
            ausfuehrenAm: rechnung.faelligAm || rechnung.datum,
            betrag: Number(rechnung.betrag || 0),
            methode: "Ueberweisung",
            status: "geplant",
            name: rechnung.kunde,
            iban: rechnung.iban,
            verwendungszweck: `Rechnung ${rechnung.rechnungsnr}`
        });
        changes += 1;
    });

    return changes;
}

export function applyLehrkraftAutomationen() {
    const optionen = lehrkraftOptionenService.get();
    let changes = 0;

    if (optionen.autoLieferannahmeNach1Tag) {
        vertriebsdokumenteService.list()
            .filter(istVersanddokument)
            .filter(item => String(item.status || "").toLowerCase() !== "versendet")
            .forEach(item => {
                const offset = resolveFixedDistributionOffset(
                    `${item.id}|${item.auftragId || ""}|lieferannahme`,
                    [
                        { tage: 1, gewichtung: 1 },
                        { tage: 2, gewichtung: 2 },
                        { tage: 3, gewichtung: 1 }
                    ]
                );
                if (offset === null) return;
                if (!isOlderThanOneDay(addDaysToIsoDate(String(item.datum || getBerlinDate()), offset))) return;
                vertriebsdokumenteService.update(item.id, {
                    ...item,
                    status: "versendet",
                    versendetAm: getBerlinDate()
                });
                changes += 1;
            });
    }

    if (optionen.autoDebitorenzahlungNach1Tag) {
        changes += ensureScheduledCustomerPayments();
        zahlungenService.list()
            .filter(item => item.zahlungsart !== "Ausgang")
            .filter(item => String(item.status || "").toLowerCase() !== "ausgefuehrt")
            .forEach(item => {
                const basisdatum = getBaseDate(item);
                const ziel = resolveWeightedPaymentTarget(item, optionen.debitorenzahlungRegeln || []);
                if (!basisdatum || !ziel || ziel.keineZahlung || ziel.offsetTage === null) return;
                if (!isOlderThanOneDay(addDaysToIsoDate(basisdatum, ziel.offsetTage))) return;
                zahlungenService.markExecuted(item.id, getBerlinDate());
                changes += 1;
            });
    }

    return changes;
}

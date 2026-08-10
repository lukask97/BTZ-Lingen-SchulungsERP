import vertriebsdokumenteService from "../verkauf/vertriebsdokumenteService";
import zahlungenService from "../buchhaltung/zahlungenService";
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

export function applyLehrkraftAutomationen() {
    const optionen = lehrkraftOptionenService.get();
    let changes = 0;

    if (optionen.autoLieferannahmeNach1Tag) {
        vertriebsdokumenteService.list()
            .filter(istVersanddokument)
            .filter(item => String(item.status || "").toLowerCase() !== "versendet")
            .filter(item => isOlderThanOneDay(item.datum))
            .forEach(item => {
                vertriebsdokumenteService.update(item.id, {
                    ...item,
                    status: "versendet",
                    versendetAm: getBerlinDate()
                });
                changes += 1;
            });
    }

    if (optionen.autoDebitorenzahlungNach1Tag) {
        zahlungenService.list()
            .filter(item => item.zahlungsart !== "Ausgang")
            .filter(item => String(item.status || "").toLowerCase() !== "ausgefuehrt")
            .filter(item => isOlderThanOneDay(item.ausfuehrenAm || item.ausfuehrungsdatum || item.datum))
            .forEach(item => {
                zahlungenService.markExecuted(item.id, getBerlinDate());
                changes += 1;
            });
    }

    return changes;
}

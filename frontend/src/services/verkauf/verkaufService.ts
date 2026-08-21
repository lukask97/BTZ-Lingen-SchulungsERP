import angeboteService from "./angeboteService";
import auftraegeService from "./auftraegeService";
import customerInquiryService from "./customerInquiryService";
import { getBerlinDate } from "../../utils/dateTime";
import { naechsteAuftragsnummer as createNextOrderNumber } from "../core/documentNumbering";

export function naechsteAuftragsnummer() {
    return createNextOrderNumber(auftraegeService.getAll());
}

export function angebotInAuftragUebernehmen(angebotId: any) {
    const angebot = angeboteService.getAll().find(item => item.id === angebotId);
    if (!angebot || angebot.status !== "wartet auf Antwort") return false;

    const neuerAuftrag = auftraegeService.add({
        auftragNr: naechsteAuftragsnummer(),
        kundeId: angebot.kundeId,
        datum: getBerlinDate(),
        status: "offen",
        positionen: angebot.positionen,
        rabattBetrag: Number(angebot.rabattBetrag || 0),
        verguenstigungsGrund: angebot.verguenstigungsGrund || "",
        gesamtbetrag: Number(angebot.gesamtbetrag || 0),
        angebotId: angebot.id
    });
    angeboteService.update({ ...angebot, status: "angenommen" });
    if (angebot.anfrageId) {
        const anfrage = customerInquiryService.list().find(item => item.id === angebot.anfrageId);
        if (anfrage) {
            customerInquiryService.update({ ...anfrage, status: "erledigt", angebotId: angebot.id, vorgangId: angebot.vorgangId });
        }
    }
    return neuerAuftrag;
}

export function kundenanfrageInAuftragUebernehmen(anfrageId: any, payload: any = {}) {
    const anfrage = customerInquiryService.list().find(item => String(item.id) === String(anfrageId));
    if (!anfrage || !anfrage.kundeId) return false;

    const neuerAuftrag = auftraegeService.add({
        auftragNr: naechsteAuftragsnummer(),
        kundeId: anfrage.kundeId,
        datum: getBerlinDate(),
        status: "offen",
        positionen: payload.positionen || [],
        rabattBetrag: Number(payload.rabattBetrag || 0),
        verguenstigungsGrund: payload.verguenstigungsGrund || "",
        gesamtbetrag: Number(payload.gesamtbetrag || 0),
        faelligAm: payload.faelligAm || "",
        angebotId: "",
        anfrageId: anfrage.id
    });

    customerInquiryService.update({ ...anfrage, status: "erledigt", auftragId: neuerAuftrag.id, vorgangId: anfrage.vorgangId || `anfrage-${anfrage.id}` });
    return neuerAuftrag;
}

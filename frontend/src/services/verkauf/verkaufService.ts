// @ts-nocheck
import angeboteService from "./angeboteService";
import auftraegeService from "./auftraegeService";
import customerInquiryService from "./customerInquiryService";

export function naechsteAuftragsnummer() {
    return `VK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

export function angebotInAuftragUebernehmen(angebotId) {
    const angebot = angeboteService.getAll().find(item => item.id === angebotId);
    if (!angebot || angebot.status !== "wartet auf Antwort") return false;

    const neuerAuftrag = auftraegeService.add({
        auftragNr: naechsteAuftragsnummer(),
        kundeId: angebot.kundeId,
        datum: new Date().toISOString().slice(0, 10),
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

export function kundenanfrageInAuftragUebernehmen(anfrageId, payload = {}) {
    const anfrage = customerInquiryService.list().find(item => String(item.id) === String(anfrageId));
    if (!anfrage || !anfrage.kundeId) return false;

    const neuerAuftrag = auftraegeService.add({
        auftragNr: naechsteAuftragsnummer(),
        kundeId: anfrage.kundeId,
        datum: new Date().toISOString().slice(0, 10),
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

// @ts-nocheck
import angeboteService from "./angeboteService";
import auftraegeService from "./auftraegeService";
import customerInquiryService from "./customerInquiryService";

export function angebotInAuftragUebernehmen(angebotId) {
    const angebot = angeboteService.getAll().find(item => item.id === angebotId);
    if (!angebot || angebot.status !== "wartet auf Antwort") return false;

    const neuerAuftrag = auftraegeService.add({
        auftragNr: `VK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        kundeId: angebot.kundeId,
        kunde: angebot.kunde,
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
            customerInquiryService.update({ ...anfrage, status: "erledigt", angebotId: angebot.id });
        }
    }
    return neuerAuftrag;
}

import angeboteService from "./angeboteService";
import auftraegeService from "./auftraegeService";

export function angebotInAuftragUebernehmen(angebotId) {
    const angebot = angeboteService.getAll().find(item => item.id === angebotId);
    if (!angebot || angebot.status !== "offen") return false;

    auftraegeService.add({
        auftragNr: `VK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        kundeId: angebot.kundeId,
        kunde: angebot.kunde,
        datum: new Date().toISOString().slice(0, 10),
        status: "offen",
        positionen: angebot.positionen,
        angebotId: angebot.id
    });
    angeboteService.update({ ...angebot, status: "beauftragt" });
    return true;
}

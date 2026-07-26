// @ts-nocheck
import bestellungenService from "./bestellungenService";
import artikelService from "./artikelService";

export function bucheWareneingang(bestellungId) {
    const bestellung = bestellungenService.getAll().find(item => item.id === bestellungId);

    if (!bestellung || bestellung.status !== "offen") {
        return false;
    }

    bestellung.positionen.forEach(position => {
        const artikel = artikelService.getAll().find(item => item.id === position.artikelId);
        if (artikel) {
            artikelService.update({ ...artikel, bestand: Number(artikel.bestand) + Number(position.menge) });
        }
    });

    bestellungenService.update({
        ...bestellung,
        status: "eingegangen",
        wareneingangAm: new Date().toISOString().slice(0, 10)
    });

    return true;
}

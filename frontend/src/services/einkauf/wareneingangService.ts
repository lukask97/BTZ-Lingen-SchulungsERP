import bestellungenService from "./bestellungenService";
import artikelService from "../logistik/artikelService";
import { getBerlinDate } from "../../utils/dateTime";

export function bucheWareneingang(bestellungId) {
    const bestellung = bestellungenService.getAll().find(item => item.id === bestellungId);

    if (!bestellung || bestellung.status !== "versendet") {
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
        wareneingangAm: getBerlinDate(),
        rechnungStatus: "offen"
    });

    return true;
}

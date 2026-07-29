import { bestellungen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

const bestellungenService = createCRUDService("bestellungen", bestellungen);

export function naechsteBestellnummer() {
    return `EK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

export default bestellungenService;

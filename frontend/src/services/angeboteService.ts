import { angebote } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

const angeboteService = createCRUDService("angebote", angebote);

export function naechsteAngebotsnummer() {
    return `ANG-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

export default angeboteService;

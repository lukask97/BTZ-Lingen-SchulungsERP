import { reklamationen } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

const reklamationenService = createCRUDService("reklamationen", reklamationen);

export function naechsteReklamationsnummer() {
    return `REK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

export default reklamationenService;

import { benutzer } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

const benutzerService = createCRUDService("benutzer", benutzer);

export const getBenutzer = () => benutzerService.getAll();
export const addBenutzer = (benutzer) => benutzerService.add(benutzer);
export const updateBenutzer = (benutzer) => benutzerService.update(benutzer);
export const deleteBenutzer = (id) => benutzerService.delete(id);

export default benutzerService;

import { rechnungen } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

const rechnungenService = createCRUDService("rechnungen", rechnungen);

export const getRechnungen = () => rechnungenService.getAll();
export const addRechnung = (rechnung) => rechnungenService.add(rechnung);
export const updateRechnung = (rechnung) => rechnungenService.update(rechnung);
export const deleteRechnung = (id) => rechnungenService.delete(id);

export default rechnungenService;

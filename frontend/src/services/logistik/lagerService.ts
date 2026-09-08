import { createCRUDService } from "../core/genericService";

const lagerService = createCRUDService("lager", []);

export const getLager = () => lagerService.getAll();
export const addLager = (lagerItem) => lagerService.add(lagerItem);
export const updateLager = (lagerItem) => lagerService.update(lagerItem);
export const deleteLager = (id) => lagerService.delete(id);

export default lagerService;



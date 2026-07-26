import { lager } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

const lagerService = createCRUDService("lager", lager);

export const getLager = () => lagerService.getAll();
export const addLager = (lagerItem) => lagerService.add(lagerItem);
export const updateLager = (lagerItem) => lagerService.update(lagerItem);
export const deleteLager = (id) => lagerService.delete(id);

export default lagerService;

import { rechte } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

const rechteService = createCRUDService("rechte", rechte);

export const getRechte = () => rechteService.getAll();
export const addRecht = (recht) => rechteService.add(recht);
export const updateRecht = (recht) => rechteService.update(recht);
export const deleteRecht = (id) => rechteService.delete(id);

export default rechteService;

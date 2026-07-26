import { rollen } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

const rollenService = createCRUDService("rollen", rollen);

export const getRollen = () => rollenService.getAll();
export const addRolle = (rolle) => rollenService.add(rolle);
export const updateRolle = (rolle) => rollenService.update(rolle);
export const deleteRolle = (id) => rollenService.delete(id);

export default rollenService;

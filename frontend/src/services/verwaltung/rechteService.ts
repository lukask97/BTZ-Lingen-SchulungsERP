import { rechte } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import rollenRechteService from "./rollenRechteService";

const rechteService = createCRUDService("rechte", rechte);

export const getRechte = () => rechteService.getAll();
export const addRecht = (recht) => rechteService.add(recht);
export const updateRecht = (recht) => rechteService.update(recht);
export const deleteRecht = (id) => {
    const recht = rechteService.getById(id);
    if (recht?.name) {
        rollenRechteService.getAll()
            .filter(item => item.rechtName === recht.name)
            .forEach(item => {
                if (item.id != null) {
                    rollenRechteService.delete(item.id);
                }
            });
    }
    return rechteService.delete(id);
};

export default {
    ...rechteService,
    delete: deleteRecht,
    remove: deleteRecht
};

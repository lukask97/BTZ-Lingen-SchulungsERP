import { kunden } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

// Nutze den generischen Service für Kunden
const kundenService = createCRUDService("kunden", kunden);

// Expose API für Backward-Compatibility
export const getKunden = () => kundenService.getAll();
export const addKunde = (kunde) => kundenService.add(kunde);
export const updateKunde = (kunde) => kundenService.update(kunde);
export const deleteKunde = (id) => kundenService.delete(id);
export const getKundeById = (id) => kundenService.getById(id);
export const searchKunden = (query) => kundenService.search(query);

// Export Service für direkten Zugriff
export default kundenService;
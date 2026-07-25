import { artikel } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

const artikelService = createCRUDService("artikel", artikel);

export const getArtikels = () => artikelService.getAll();
export const addArtikel = (artikel) => artikelService.add(artikel);
export const updateArtikel = (artikel) => artikelService.update(artikel);
export const deleteArtikel = (id) => artikelService.delete(id);

export default artikelService;

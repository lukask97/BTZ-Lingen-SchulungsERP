import { lieferanten } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

const service = createCRUDService("lieferanten", lieferanten);

export default {
    ...service,
    getById: (id) => (id == null || id === "" ? undefined : service.getById(id))
};

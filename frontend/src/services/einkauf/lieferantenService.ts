import { createCRUDService } from "../core/genericService";

const service = createCRUDService("lieferanten", []);

export default {
    ...service,
    getById: (id) => (id == null || id === "" ? undefined : service.getById(id))
};



import { lieferanten } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

export default createCRUDService("lieferanten", lieferanten);

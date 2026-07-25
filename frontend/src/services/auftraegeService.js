import { auftraege } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

export default createCRUDService("auftraege", auftraege);

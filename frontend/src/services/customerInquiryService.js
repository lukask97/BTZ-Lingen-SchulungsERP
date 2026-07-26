import { kundenanfragen } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

export default createCRUDService("kundenanfragen", kundenanfragen);

import { kundenanfragen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

export default createCRUDService("kundenanfragen", kundenanfragen);

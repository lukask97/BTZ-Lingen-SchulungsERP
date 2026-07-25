import { abteilungen } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

export default createCRUDService("abteilungen", abteilungen);

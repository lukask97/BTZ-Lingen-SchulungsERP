import { firmenkonto } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

export default createCRUDService("firmenkonto", firmenkonto);

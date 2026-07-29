import { personalakten } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

export default createCRUDService("personalakten", personalakten);

import { personalakten } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

export default createCRUDService("personalakten", personalakten);

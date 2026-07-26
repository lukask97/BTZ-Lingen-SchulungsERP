import { mitarbeiter } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

export default createCRUDService("mitarbeiter", mitarbeiter);

import { zahlungen } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

export default createCRUDService("zahlungen", zahlungen);

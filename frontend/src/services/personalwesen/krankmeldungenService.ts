import { krankmeldungen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

export default createCRUDService("krankmeldungen", krankmeldungen);

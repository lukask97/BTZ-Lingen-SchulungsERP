import { mahnungen } from "./mockup/mockData";
import { createCRUDService } from "./genericService";

export default createCRUDService("mahnungen", mahnungen);

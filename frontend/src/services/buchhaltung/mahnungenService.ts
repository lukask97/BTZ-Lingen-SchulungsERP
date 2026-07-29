import { mahnungen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

export default createCRUDService("mahnungen", mahnungen);

import { apiRequest } from "../core/api";

const tagesversandService = {
    async list() {
        const result = await apiRequest("/verkauf/tagesversand/protokolle");
        return result.items || [];
    },
    async ausfuehren() {
        return apiRequest("/verkauf/tagesversand/ausfuehren", { method: "POST" });
    }
};

export default tagesversandService;

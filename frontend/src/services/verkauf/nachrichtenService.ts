import { nachrichten } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

const service = createCRUDService("nachrichten", nachrichten);

function normalizeMessage(item: any = {}) {
    const basisZeitpunkt = item.zeitpunkt || (item.datum ? `${item.datum}T00:00:00.000Z` : new Date(0).toISOString());
    return {
        ...item,
        zeitpunkt: basisZeitpunkt
    };
}

export function listNachrichtenZuVorgang(vorgangId) {
    return service
        .list()
        .map(normalizeMessage)
        .filter(item => String(item.vorgangId) === String(vorgangId))
        .sort((a, b) => String(a.zeitpunkt).localeCompare(String(b.zeitpunkt)) || Number(a.id) - Number(b.id));
}

export default {
    ...service,
    list: () => service.list().map(normalizeMessage),
    getAll: () => service.list().map(normalizeMessage),
    getById: (id: any) => {
        const item = service.getById(id);
        return item ? normalizeMessage(item) : undefined;
    },
    create: (payload: any) => service.create(normalizeMessage(payload)),
    add: (payload: any) => service.create(normalizeMessage(payload)),
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") return service.update(normalizeMessage(idOrItem));
        return service.update(idOrItem, normalizeMessage(payload));
    }
};

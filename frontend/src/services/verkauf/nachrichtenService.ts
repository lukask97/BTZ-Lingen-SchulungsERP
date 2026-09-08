import { createCRUDService } from "../core/genericService";
import customerInquiryService from "./customerInquiryService";
import angeboteService from "./angeboteService";
import auftraegeService from "./auftraegeService";
import { getBerlinTimestamp } from "../../utils/dateTime";
import { getCustomerName } from "../../utils/customerReferences";

const service = createCRUDService("nachrichten", []);

function tryRead<T>(reader: () => T, fallback: T) {
    try {
        return reader();
    } catch {
        return fallback;
    }
}

function resolveMessageContext(item: any = {}) {
    const auftrag = item.auftragId ? tryRead(() => auftraegeService.getById(item.auftragId), null) : null;
    const angebot = item.angebotId
        ? tryRead(() => angeboteService.getById(item.angebotId), null)
        : auftrag?.angebotId
            ? tryRead(() => angeboteService.getById(auftrag.angebotId), null)
            : null;
    const anfrage = item.anfrageId
        ? tryRead(() => customerInquiryService.getById(item.anfrageId), null)
        : angebot?.anfrageId
            ? tryRead(() => customerInquiryService.getById(angebot.anfrageId), null)
            : auftrag?.anfrageId
                ? tryRead(() => customerInquiryService.getById(auftrag.anfrageId), null)
                : null;

    return { auftrag, angebot, anfrage };
}

function normalizeMessage(item: any = {}) {
    const { auftrag, angebot, anfrage } = resolveMessageContext(item);
    const basisZeitpunkt = item.zeitpunkt || (item.datum ? `${item.datum}T00:00:00` : getBerlinTimestamp(new Date(0)));
    const kundeId = item.kundeId || anfrage?.kundeId || angebot?.kundeId || auftrag?.kundeId || "";
    const senderName = item.senderName || (item.senderRolle === "Kunde" ? getCustomerName(kundeId, "") : "");

    return {
        ...item,
        vorgangId: item.vorgangId || anfrage?.vorgangId || angebot?.vorgangId || (item.anfrageId ? `anfrage-${item.anfrageId}` : ""),
        anfrageId: item.anfrageId || angebot?.anfrageId || auftrag?.anfrageId || "",
        angebotId: item.angebotId || auftrag?.angebotId || "",
        auftragId: item.auftragId || "",
        kundeId,
        // senderName stays on the record as a communication snapshot, but is backed by stable references where possible.
        senderName,
        zeitpunkt: basisZeitpunkt
    };
}

export function createThreadMessage(payload: any = {}) {
    const now = getBerlinTimestamp();
    return normalizeMessage({
        datum: payload.datum || now.slice(0, 10),
        zeitpunkt: payload.zeitpunkt || now,
        ...payload
    });
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
    create: (payload: any) => service.create(createThreadMessage(payload)),
    add: (payload: any) => service.create(createThreadMessage(payload)),
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") return service.update(normalizeMessage(idOrItem));
        return service.update(idOrItem, normalizeMessage(payload));
    }
};



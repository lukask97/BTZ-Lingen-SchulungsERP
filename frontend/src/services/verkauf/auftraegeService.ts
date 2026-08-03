import { auftraege, auftragspositionen } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import { createPositionTableService } from "../core/positionTableService";
import { getCustomerName } from "../../utils/customerReferences";
import artikelService from "../logistik/artikelService";
import servicesService from "./servicesService";
import angeboteService from "./angeboteService";
import customerInquiryService from "./customerInquiryService";

const baseService = createCRUDService("auftraege", auftraege);
const positionService = createPositionTableService(auftragspositionen, {
    tableName: "auftragspositionen",
    parentField: "auftragId"
});

function resolveProcessReferences(item: any = {}) {
    const angebot = item.angebotId ? angeboteService.getById(item.angebotId) : null;
    const anfrage = item.anfrageId
        ? customerInquiryService.getById(item.anfrageId)
        : angebot?.anfrageId
            ? customerInquiryService.getById(angebot.anfrageId)
            : null;

    return {
        angebot,
        anfrageId: item.anfrageId || angebot?.anfrageId || "",
        vorgangId: item.vorgangId || angebot?.vorgangId || anfrage?.vorgangId || (item.anfrageId ? `anfrage-${item.anfrageId}` : "")
    };
}

function hydrateAuftrag(item = {}) {
    const processRefs = resolveProcessReferences(item as any);
    return {
        ...item,
        ...processRefs,
        kunde: getCustomerName((item as any).kundeId, (item as any).kunde),
        positionen: positionService.listByParent(item.id || "")
            .map(position => {
                const hydrated = hydratePosition(position);
                const { auftragId, ...rest } = hydrated;
                return rest;
            })
    };
}

function splitPayload(payload = {}) {
    const normalizedPayload = {
        ...(payload as any),
        ...resolveProcessReferences(payload as any)
    };
    const { positionen = [], kunde, ...basePayload } = normalizedPayload;
    return {
        basePayload,
        positionen: positionen.map(position => {
            const hydrated = hydratePosition(position);
            return {
                artikelId: hydrated.leistungTyp === "Service" ? "" : hydrated.artikelId,
                serviceId: hydrated.leistungTyp === "Service" ? hydrated.serviceId : "",
                leistungTyp: hydrated.leistungTyp,
                menge: Number(hydrated.menge || 0),
                einzelpreis: Number(hydrated.einzelpreis || 0)
            };
        })
    };
}

function hydratePosition(position: any = {}) {
    const istService = String(position.leistungTyp || "").toLowerCase() === "service" || !!position.serviceId;
    const referenz = istService
        ? servicesService.getById(position.serviceId || position.artikelId)
        : artikelService.getById(position.artikelId);

    return {
        ...position,
        artikelId: istService ? (position.artikelId || position.serviceId || referenz?.id || "") : (position.artikelId || referenz?.id || ""),
        serviceId: istService ? (position.serviceId || position.artikelId || referenz?.id || "") : "",
        artikel: referenz?.name || position.artikel || "",
        artikelTyp: istService ? "Dienstleistung" : (referenz?.artikelTyp || position.artikelTyp || "Einzelartikel"),
        leistungTyp: istService ? "Service" : (position.leistungTyp || "Artikel"),
        einzelpreis: Number(position.einzelpreis ?? referenz?.verkaufspreis ?? referenz?.preis ?? 0)
    };
}

const auftraegeService = {
    ...baseService,
    list: () => baseService.list().map(hydrateAuftrag),
    getAll: () => baseService.list().map(hydrateAuftrag),
    getById: (id: any) => {
        const item = baseService.getById(id);
        return item ? hydrateAuftrag(item) : undefined;
    },
    create: (payload: any) => {
        const { basePayload, positionen } = splitPayload(payload);
        const created = baseService.create(basePayload);
        positionService.replaceForParent(created.id, positionen);
        return hydrateAuftrag(created);
    },
    add: (payload: any) => {
        const { basePayload, positionen } = splitPayload(payload);
        const created = baseService.create(basePayload);
        positionService.replaceForParent(created.id, positionen);
        return hydrateAuftrag(created);
    },
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") {
            const { basePayload, positionen } = splitPayload(idOrItem);
            const updated = baseService.update(basePayload);
            positionService.replaceForParent(updated.id, positionen);
            return hydrateAuftrag(updated);
        }
        const { basePayload, positionen } = splitPayload(payload);
        const updated = baseService.update(idOrItem, basePayload);
        positionService.replaceForParent(updated.id, positionen);
        return hydrateAuftrag(updated);
    },
    remove: (id: any) => {
        positionService.removeByParent(id);
        return baseService.remove(id);
    },
    delete: (id: any) => {
        positionService.removeByParent(id);
        return baseService.remove(id);
    }
};

export default auftraegeService;

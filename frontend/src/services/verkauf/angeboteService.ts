import { angebote } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import { formatOfferNumber, naechsteAngebotsrevision as buildNextAngebotsrevision } from "../core/documentNumbering";
import { angebotspositionen } from "../mockup/mockData";
import { createPositionTableService } from "../core/positionTableService";
import { getCustomerName } from "../../utils/customerReferences";
import artikelService from "../logistik/artikelService";
import servicesService from "./servicesService";

const baseService = createCRUDService("angebote", angebote);
const positionService = createPositionTableService(angebotspositionen, {
    tableName: "angebotspositionen",
    parentField: "angebotId"
});

function splitAngebotsnummer(value: any = "") {
    const text = String(value || "");
    const match = text.match(/^(.*)\.(\d+)$/);
    if (!match) return { basis: text, revision: 0 };
    return { basis: match[1], revision: Number(match[2] || 0) };
}

function normalizeAngebot(item: any = {}) {
    const nummer = String(item.angebotsNr || "");
    const nummerInfo = splitAngebotsnummer(nummer);
    const basis = item.angebotsBasisNr || nummerInfo.basis || nummer;
    const revision = Number(item.revision ?? nummerInfo.revision ?? 0);
    return {
        ...item,
        positionen: item.positionen || [],
        angebotsBasisNr: basis,
        revision,
        angebotsNr: basis ? formatOfferNumber(basis, revision) : nummer,
        vorgangId: item.vorgangId || (item.anfrageId ? `anfrage-${item.anfrageId}` : `angebot-${basis || item.id || "neu"}`)
    };
}

function hydrateAngebot(item: any = {}) {
    const normalized = normalizeAngebot(item);
    return {
        ...normalized,
        kunde: getCustomerName(normalized.kundeId, normalized.kunde),
        positionen: positionService.listByParent(normalized.id || "")
            .map(position => {
                const hydrated = hydratePosition(position);
                const { angebotId, ...rest } = hydrated;
                return rest;
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

function splitPayload(payload: any = {}) {
    const { positionen = [], kunde, ...basePayload } = payload;
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

const angeboteService = {
    list: () => baseService.list().map(hydrateAngebot),
    getAll: () => baseService.list().map(hydrateAngebot),
    getById: (id: any) => {
        const item = baseService.getById(id);
        return item ? hydrateAngebot(item) : undefined;
    },
    create: (payload: any) => {
        const { basePayload, positionen } = splitPayload(normalizeAngebot(payload));
        const created = baseService.create(basePayload);
        positionService.replaceForParent(created.id, positionen);
        return hydrateAngebot(created);
    },
    add: (payload: any) => {
        const { basePayload, positionen } = splitPayload(normalizeAngebot(payload));
        const created = baseService.create(basePayload);
        positionService.replaceForParent(created.id, positionen);
        return hydrateAngebot(created);
    },
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") {
            const normalized = normalizeAngebot(idOrItem);
            const { basePayload, positionen } = splitPayload(normalized);
            const updated = baseService.update(basePayload);
            positionService.replaceForParent(updated.id, positionen);
            return hydrateAngebot(updated);
        }
        const normalized = normalizeAngebot(payload);
        const { basePayload, positionen } = splitPayload(normalized);
        const updated = baseService.update(idOrItem, basePayload);
        positionService.replaceForParent(updated.id, positionen);
        return hydrateAngebot(updated);
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

export function naechsteAngebotsnummer() {
    return buildNextAngebotsrevision(angeboteService.getAll(), `angebot-${Date.now()}`).angebotsNr;
}

export function naechsteAngebotsrevision(vorgangId: any) {
    return buildNextAngebotsrevision(angeboteService.getAll(), String(vorgangId));
}

export default angeboteService;

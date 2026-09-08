import { createCRUDService } from "../core/genericService";
import { formatOfferNumber, naechsteAngebotsrevision as buildNextAngebotsrevision } from "../core/documentNumbering";
import { createPositionTableService } from "../core/positionTableService";
import artikelService from "../logistik/artikelService";
import servicesService from "./servicesService";
import kundenService from "./customerService";

const baseService = createCRUDService("angebote", []);
const positionService = createPositionTableService([], {
    tableName: "angebotspositionen",
    parentField: "angebotId"
});

function withPermissionFallback<T>(reader: () => T, fallback: T) {
    try {
        return reader();
    } catch (error) {
        if (error instanceof Error && error.message.startsWith("Keine Berechtigung")) {
            return fallback;
        }

        throw error;
    }
}

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
        preispositionen: item.preispositionen || [],
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
        kunde: normalized.kunde,
        positionen: positionService.listByParent(normalized.id || "")
            .map(position => {
                const hydrated = hydratePosition(position);
                const { angebotId: _angebotId, ...rest } = hydrated;
                return rest;
            })
    };
}

function hydrateAngebote(items: any[] = []) {
    const kundenById = new Map(
        withPermissionFallback(() => kundenService.list(), []).map(item => [String(item.id), item.firma || ""])
    );
    const artikelById = new Map(
        withPermissionFallback(() => artikelService.getAll(), []).map(item => [String(item.id), item])
    );
    const servicesById = new Map(
        withPermissionFallback(() => servicesService.getAll(), []).map(item => [String(item.id), item])
    );
    const positionenByAngebotId = new Map<string, any[]>();

    positionService.listAll().forEach(position => {
        const key = String(position.angebotId || "");
        const existing = positionenByAngebotId.get(key) || [];
        existing.push(position);
        positionenByAngebotId.set(key, existing);
    });

    return items.map(item => {
        const normalized = normalizeAngebot(item);
        const positionen = (positionenByAngebotId.get(String(normalized.id || "")) || []).map(position => {
            const istService = String(position.leistungTyp || "").toLowerCase() === "service" || !!position.serviceId;
            const referenz = (istService
                 ? servicesById.get(String(position.serviceId || position.artikelId || ""))
                : artikelById.get(String(position.artikelId || ""))) || {};

            const hydrated = {
                ...position,
                artikelId: istService ? (position.artikelId || position.serviceId || referenz.id || "") : (position.artikelId || referenz.id || ""),
                serviceId: istService ? (position.serviceId || position.artikelId || referenz.id || "") : "",
                artikel: referenz.name || position.artikel || "",
                artikelTyp: istService ? "Dienstleistung" : (referenz.artikelTyp || position.artikelTyp || "Einzelartikel"),
                leistungTyp: istService ? "Service" : (position.leistungTyp || "Artikel"),
                einzelpreis: Number(position.einzelpreis ?? referenz.verkaufspreis ?? referenz.preis ?? 0)
            };
            const { angebotId: _angebotId, ...rest } = hydrated;
            return rest;
        });

        return {
            ...normalized,
            kunde: normalized.kunde || kundenById.get(String(normalized.kundeId || "")) || "",
            positionen,
            preispositionen: normalized.preispositionen || []
        };
    });
}

function hydratePosition(position: any = {}) {
    const istService = String(position.leistungTyp || "").toLowerCase() === "service" || !!position.serviceId;
    const referenz = (istService
         ? withPermissionFallback(() => servicesService.getById(position.serviceId || position.artikelId), undefined)
        : withPermissionFallback(() => artikelService.getById(position.artikelId), undefined)) || {};

    return {
        ...position,
        artikelId: istService ? (position.artikelId || position.serviceId || referenz.id || "") : (position.artikelId || referenz.id || ""),
        serviceId: istService ? (position.serviceId || position.artikelId || referenz.id || "") : "",
        artikel: referenz.name || position.artikel || "",
        artikelTyp: istService ? "Dienstleistung" : (referenz.artikelTyp || position.artikelTyp || "Einzelartikel"),
        leistungTyp: istService ? "Service" : (position.leistungTyp || "Artikel"),
        einzelpreis: Number(position.einzelpreis ?? referenz.verkaufspreis ?? referenz.preis ?? 0)
    };
}

function splitPayload(payload: any = {}) {
    const { positionen = [], preispositionen = [], kunde: _kunde, ...basePayload } = payload;
    return {
        basePayload: {
            ...basePayload,
            preispositionen: preispositionen || []
        },
        positionen: positionen.map(position => {
            const hydrated = hydratePosition(position);
            return {
                artikelId: hydrated.leistungTyp === "Service" ? "" : hydrated.artikelId,
                serviceId: hydrated.leistungTyp === "Service" ? hydrated.serviceId : "",
                leistungTyp: hydrated.leistungTyp,
                menge: Number(hydrated.menge || 0),
                einzelpreis: Number(hydrated.einzelpreis || 0),
                vertragsStart: hydrated.vertragsStart || "",
                vertragsEnde: hydrated.vertragsEnde || "",
                mietArtikelId: hydrated.mietArtikelId || "",
                mietArtikelName: hydrated.mietArtikelName || "",
                istMietBaugruppe: Boolean(hydrated.istMietBaugruppe),
                mietvertragServiceRowId: hydrated.mietvertragServiceRowId || "",
                selectedOptionen: hydrated.selectedOptionen || {},
                isOptionForId: hydrated.isOptionForId || "",
                optionKategorieId: hydrated.optionKategorieId || ""
            };
        })
    };
}

const angeboteService = {
    list: () => hydrateAngebote(baseService.list()),
    getAll: () => hydrateAngebote(baseService.list()),
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
    return buildNextAngebotsrevision(angeboteService.getAll(), `angebot-${Date.now()}`, undefined as any).angebotsNr;
}

export function naechsteAngebotsrevision(vorgangId: any) {
    return buildNextAngebotsrevision(angeboteService.getAll(), String(vorgangId), undefined as any);
}

export default angeboteService;


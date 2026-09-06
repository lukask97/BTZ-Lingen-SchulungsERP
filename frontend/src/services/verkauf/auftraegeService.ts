import { createCRUDService } from "../core/genericService";
import { createPositionTableService } from "../core/positionTableService";
import artikelService from "../logistik/artikelService";
import servicesService from "./servicesService";
import angeboteService from "./angeboteService";
import customerInquiryService from "./customerInquiryService";
import kundenService from "./customerService";

const baseService = createCRUDService("auftraege", []);
const positionService = createPositionTableService([], {
    tableName: "auftragspositionen",
    parentField: "auftragId"
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

function withSafeReferenceFallback<T>(reader: () => T, fallback: T) {
    try {
        return reader();
    } catch (error) {
        if (
            error instanceof Error
            && (
                error.message.startsWith("Keine Berechtigung")
                || error.message.includes("nicht gefunden")
                || error.message.includes("nicht vorbereitet")
                || error.message.toLowerCase().includes("api request failed with status 404")
            )
        ) {
            return fallback;
        }

        throw error;
    }
}

function resolveProcessReferences(item: any = {}) {
    const angebot = item.angebotId ? withSafeReferenceFallback(() => angeboteService.getById(item.angebotId), null) : null;
    const anfrage = item.anfrageId
        ? withSafeReferenceFallback(() => customerInquiryService.getById(item.anfrageId), null)
        : angebot?.anfrageId
            ? withSafeReferenceFallback(() => customerInquiryService.getById(angebot.anfrageId), null)
            : null;

    return {
        angebot,
        anfrageId: item.anfrageId || angebot?.anfrageId || "",
        vorgangId: item.vorgangId || angebot?.vorgangId || anfrage?.vorgangId || (item.anfrageId ? `anfrage-${item.anfrageId}` : "")
    };
}

function hydrateAuftrag(item: any = {}) {
    const processRefs = resolveProcessReferences(item);
    return {
        ...item,
        ...processRefs,
        kunde: item.kunde,
        positionen: positionService.listByParent(item.id || "")
            .map(position => {
                const hydrated = hydratePosition(position);
                const { auftragId, ...rest } = hydrated;
                return rest;
            })
    };
}

function hydrateAuftraege(items: any[] = []) {
    const kundenById = new Map(
        withPermissionFallback(() => kundenService.list(), []).map(item => [String(item.id), item.firma || ""])
    );
    const artikelById = new Map(
        withPermissionFallback(() => artikelService.getAll(), []).map(item => [String(item.id), item])
    );
    const servicesById = new Map(
        withPermissionFallback(() => servicesService.getAll(), []).map(item => [String(item.id), item])
    );
    const angeboteById = new Map(
        withPermissionFallback(() => angeboteService.list(), []).map(item => [String(item.id), item])
    );
    const anfragenById = new Map(
        withPermissionFallback(() => customerInquiryService.list(), []).map(item => [String(item.id), item])
    );
    const positionenByAuftragId = new Map<string, any[]>();

    positionService.listAll().forEach(position => {
        const key = String(position.auftragId || "");
        const existing = positionenByAuftragId.get(key) || [];
        existing.push(position);
        positionenByAuftragId.set(key, existing);
    });

    return items.map(item => {
        const angebot = item.angebotId ? angeboteById.get(String(item.angebotId)) || null : null;
        const anfrage = item.anfrageId
            ? anfragenById.get(String(item.anfrageId)) || null
            : angebot?.anfrageId
                ? anfragenById.get(String(angebot.anfrageId)) || null
                : null;

        const positionen = (positionenByAuftragId.get(String(item.id || "")) || []).map(position => {
            const istService = String(position.leistungTyp || "").toLowerCase() === "service" || !!position.serviceId;
            const referenz = istService
                ? servicesById.get(String(position.serviceId || position.artikelId || ""))
                : artikelById.get(String(position.artikelId || ""));

            const hydrated = {
                ...position,
                artikelId: istService ? (position.artikelId || position.serviceId || referenz?.id || "") : (position.artikelId || referenz?.id || ""),
                serviceId: istService ? (position.serviceId || position.artikelId || referenz?.id || "") : "",
                artikel: referenz?.name || position.artikel || "",
                artikelTyp: istService ? "Dienstleistung" : (referenz?.artikelTyp || position.artikelTyp || "Einzelartikel"),
                leistungTyp: istService ? "Service" : (position.leistungTyp || "Artikel"),
                einzelpreis: Number(position.einzelpreis ?? referenz?.verkaufspreis ?? referenz?.preis ?? 0)
            };
            const { auftragId, ...rest } = hydrated;
            return rest;
        });

        return {
            ...item,
            angebot,
            anfrageId: item.anfrageId || angebot?.anfrageId || "",
            vorgangId: item.vorgangId || angebot?.vorgangId || anfrage?.vorgangId || (item.anfrageId ? `anfrage-${item.anfrageId}` : ""),
            kunde: item.kunde || kundenById.get(String(item.kundeId || "")) || "",
            positionen
        };
    });
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

function hydratePosition(position: any = {}) {
    const istService = String(position.leistungTyp || "").toLowerCase() === "service" || !!position.serviceId;
    const referenz = istService
        ? withPermissionFallback(() => servicesService.getById(position.serviceId || position.artikelId), undefined)
        : withPermissionFallback(() => artikelService.getById(position.artikelId), undefined);

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
    list: () => hydrateAuftraege(baseService.list()),
    getAll: () => hydrateAuftraege(baseService.list()),
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

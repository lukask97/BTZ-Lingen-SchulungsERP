import { createCRUDService } from "../core/genericService";

const baseService = createCRUDService("services", []);

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

function normalizeService(item: any = {}) {
    const id = item.id ?? item.serviceId ?? item.serviceNr ?? item.artikelNr ?? "";
    const basisPreis = Number(item.preis || 0);
    return {
        ...item,
        id,
        name: item.name || item.bezeichnung || item.beschreibung || "",
        artikel: item.name || item.bezeichnung || item.beschreibung || "",
        preis: Number(item.verkaufspreis || item.preis || 0),
        artikelNr: item.artikelNr || item.serviceNr || String(id || ""),
        serviceNr: item.serviceNr || item.artikelNr || "",
        berechnungstyp: item.berechnungstyp || "Pauschal",
        zeEinheit: item.berechnungstyp === "ZE" ? (item.zeEinheit || "1 Tag") : "",
        einkaufspreis: Number(item.einkaufspreis || basisPreis),
        verkaufspreis: Number(item.verkaufspreis || basisPreis),
        beschreibung: item.beschreibung || ""
    };
}

const servicesService = {
    list: () => withPermissionFallback(() => baseService.list().map(normalizeService), []),
    getAll: () => withPermissionFallback(() => baseService.list().map(normalizeService), []),
    getById: (id: any) => withPermissionFallback(
        () => baseService.list().map(normalizeService).find(item => String(item.id) === String(id)),
        undefined
    ),
    create: (payload: any) => baseService.create(normalizeService(payload)),
    add: (payload: any) => baseService.create(normalizeService(payload)),
    update: (idOrItem: any, payload?: any) => {
        if (typeof idOrItem === "object") return baseService.update(normalizeService(idOrItem));
        return baseService.update(idOrItem, normalizeService(payload));
    },
    remove: (id: any) => baseService.remove(id),
    delete: (id: any) => baseService.remove(id)
};

export default servicesService;

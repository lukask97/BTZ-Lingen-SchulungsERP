import { services, artikel } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import { isDatabaseModeEnabled } from "../core/api";

const legacyServices = artikel
    .filter(item => item.artikelTyp === "Dienstleistung")
    .map((item, index) => ({
        id: item.id ?? index + 1,
        serviceNr: item.artikelNr || `SER${String(index + 1).padStart(3, "0")}`,
        name: item.name || "",
        kategorie: item.kategorie || "",
        berechnungstyp: item.berechnungstyp || "Pauschal",
        zeEinheit: item.zeEinheit || "",
        einkaufspreis: Number(item.einkaufspreis ?? item.preis ?? 0),
        verkaufspreis: Number(item.verkaufspreis ?? item.preis ?? 0),
        beschreibung: item.beschreibung || ""
    }));

const fallbackServices = services.length > 0 ? services : legacyServices;
const baseService = createCRUDService("services", fallbackServices);

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

function normalizeService(item = {}) {
    const basisPreis = Number(item.preis ?? 0);
    return {
        ...item,
        serviceNr: item.serviceNr || item.artikelNr || "",
        berechnungstyp: item.berechnungstyp || "Pauschal",
        zeEinheit: item.berechnungstyp === "ZE" ? (item.zeEinheit || "1 Tag") : "",
        einkaufspreis: Number(item.einkaufspreis ?? basisPreis),
        verkaufspreis: Number(item.verkaufspreis ?? basisPreis),
        beschreibung: item.beschreibung || ""
    };
}

function withFallback(items = []) {
    const normalized = items.map(normalizeService);
    if (normalized.length > 0) return normalized;
    if (isDatabaseModeEnabled()) return normalized;
    return fallbackServices.map(normalizeService);
}

function getFallbackServices() {
    return fallbackServices.map(normalizeService);
}

const servicesService = {
    list: () => withPermissionFallback(() => withFallback(baseService.list()), getFallbackServices()),
    getAll: () => withPermissionFallback(() => withFallback(baseService.list()), getFallbackServices()),
    getById: (id) => withPermissionFallback(
        () => withFallback(baseService.list()).find(item => String(item.id) === String(id)),
        getFallbackServices().find(item => String(item.id) === String(id))
    ),
    create: (payload) => baseService.create(normalizeService(payload)),
    add: (payload) => baseService.create(normalizeService(payload)),
    update: (idOrItem, payload) => {
        if (typeof idOrItem === "object") return baseService.update(normalizeService(idOrItem));
        return baseService.update(idOrItem, normalizeService(payload));
    },
    remove: (id) => baseService.remove(id),
    delete: (id) => baseService.remove(id)
};

export default servicesService;

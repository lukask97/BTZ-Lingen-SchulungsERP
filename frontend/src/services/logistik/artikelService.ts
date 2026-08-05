import { artikel, artikelStueckliste } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import { getKategoriePfad } from "./kategorienService";
import { createPositionTableService } from "../core/positionTableService";

const baseService = createCRUDService("artikel", artikel);
const stuecklisteService = createPositionTableService(artikelStueckliste, {
    tableName: "artikelStueckliste",
    parentField: "hauptartikelId"
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

function hydrateKomponenten(item = {}) {
    return stuecklisteService.listByParent(item.id || "")
        .map(position => ({
            artikelId: position.komponentenartikelId ?? position.artikelId,
            artikel: withPermissionFallback(
                () => baseService.list().find(entry => String(entry.id) === String(position.komponentenartikelId ?? position.artikelId))?.name || "",
                artikel.find(entry => String(entry.id) === String(position.komponentenartikelId ?? position.artikelId))?.name || ""
            ),
            menge: Number(position.menge || 0)
        }));
}

export function normalizeArtikel(item = {}) {
    const komponenten = Array.isArray(item.komponenten) ? item.komponenten : hydrateKomponenten(item);
    const basisPreis = Number(item.preis ?? 0);
    const einkaufspreis = Number(item.einkaufspreis ?? basisPreis);
    const verkaufspreis = Number(item.verkaufspreis ?? basisPreis);
    const kategoriePfad = getKategoriePfad(item.kategorieId, item.kategoriePfad || item.kategorie || "");
    const kategorie = kategoriePfad.split(" > ")[0] || item.kategorie || "";
    return {
        ...item,
        kategorieId: item.kategorieId ?? "",
        kategorie,
        kategoriePfad,
        artikelTyp: item.artikelTyp || (komponenten.length > 0 ? "Baugruppe" : "Einzelartikel"),
        einkaufspreis,
        verkaufspreis,
        bestand: Number(item.bestand ?? 0),
        komponenten,
        istEinkaufbar: einkaufspreis > 0,
        istVerkaeuflich: verkaufspreis > 0,
        beschaffungsart: einkaufspreis > 0 ? "Zukauf" : "Herstellung",
        verkaufsstatus: verkaufspreis > 0 ? "Verkaufbar" : "Nicht verkaufbar"
    };
}

function splitPayload(payload = {}) {
    const { komponenten = [], ...basePayload } = payload;
    return { basePayload, komponenten };
}

function getFallbackArtikel() {
    return artikel.map(normalizeArtikel).filter(item => item.artikelTyp !== "Dienstleistung");
}

const artikelService = {
    list: () => withPermissionFallback(
        () => baseService.list().map(normalizeArtikel).filter(item => item.artikelTyp !== "Dienstleistung"),
        getFallbackArtikel()
    ),
    getAll: () => withPermissionFallback(
        () => baseService.list().map(normalizeArtikel).filter(item => item.artikelTyp !== "Dienstleistung"),
        getFallbackArtikel()
    ),
    getById: (id) => {
        const item = artikelService.list().find(entry => String(entry.id) === String(id));
        return item ? normalizeArtikel(item) : undefined;
    },
    create: (payload) => {
        const normalized = normalizeArtikel(payload);
        const { basePayload, komponenten } = splitPayload(normalized);
        const created = baseService.create(basePayload);
        stuecklisteService.replaceForParent(created.id, komponenten.map(komponente => ({
            komponentenartikelId: komponente.artikelId,
            menge: Number(komponente.menge || 0)
        })));
        return normalizeArtikel(created);
    },
    add: (payload) => {
        const normalized = normalizeArtikel(payload);
        const { basePayload, komponenten } = splitPayload(normalized);
        const created = baseService.create(basePayload);
        stuecklisteService.replaceForParent(created.id, komponenten.map(komponente => ({
            komponentenartikelId: komponente.artikelId,
            menge: Number(komponente.menge || 0)
        })));
        return normalizeArtikel(created);
    },
    update: (idOrItem, payload) => {
        if (typeof idOrItem === "object") {
            const normalized = normalizeArtikel(idOrItem);
            const { basePayload, komponenten } = splitPayload(normalized);
            const updated = baseService.update(basePayload);
            stuecklisteService.replaceForParent(updated.id, komponenten.map(komponente => ({
                komponentenartikelId: komponente.artikelId,
                menge: Number(komponente.menge || 0)
            })));
            return normalizeArtikel(updated);
        }
        const normalized = normalizeArtikel(payload);
        const { basePayload, komponenten } = splitPayload(normalized);
        const updated = baseService.update(idOrItem, basePayload);
        stuecklisteService.replaceForParent(updated.id, komponenten.map(komponente => ({
            komponentenartikelId: komponente.artikelId,
            menge: Number(komponente.menge || 0)
        })));
        return normalizeArtikel(updated);
    },
    remove: (id) => {
        stuecklisteService.removeByParent(id);
        return baseService.remove(id);
    },
    delete: (id) => {
        stuecklisteService.removeByParent(id);
        return baseService.remove(id);
    },
    removeMany: (ids) => baseService.removeMany(ids),
    deleteMultiple: (ids) => baseService.removeMany(ids),
    search: (query) => withPermissionFallback(
        () => baseService.search(query).map(normalizeArtikel),
        artikelService.list().filter(item => JSON.stringify(item).toLowerCase().includes(String(query || "").toLowerCase()))
    ),
    sortBy: (field, order = "asc") => withPermissionFallback(
        () => baseService.sortBy(field, order).map(normalizeArtikel),
        [...artikelService.list()].sort((a, b) => {
            const aValue = String(a?.[field] ?? "");
            const bValue = String(b?.[field] ?? "");
            return order === "desc" ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
        })
    )
};

export const getArtikels = () => artikelService.getAll();
export const addArtikel = (eintrag) => artikelService.add(eintrag);
export const updateArtikel = (eintrag) => artikelService.update(eintrag);
export const deleteArtikel = (id) => artikelService.delete(id);

export default artikelService;

// @ts-nocheck
import { artikel } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";
import { getKategoriePfad } from "./kategorienService";

const baseService = createCRUDService("artikel", artikel);

export function normalizeArtikel(item = {}) {
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
        artikelTyp: item.artikelTyp || (Array.isArray(item.komponenten) && item.komponenten.length > 0 ? "Baugruppe" : "Einzelartikel"),
        einkaufspreis,
        verkaufspreis,
        bestand: Number(item.bestand ?? 0),
        komponenten: Array.isArray(item.komponenten) ? item.komponenten : [],
        istEinkaufbar: einkaufspreis > 0,
        istVerkaeuflich: verkaufspreis > 0,
        beschaffungsart: einkaufspreis > 0 ? "Zukauf" : "Herstellung",
        verkaufsstatus: verkaufspreis > 0 ? "Verkaufbar" : "Nicht verkaufbar"
    };
}

const artikelService = {
    list: () => baseService.list().map(normalizeArtikel).filter(item => item.artikelTyp !== "Dienstleistung"),
    getAll: () => baseService.list().map(normalizeArtikel).filter(item => item.artikelTyp !== "Dienstleistung"),
    getById: (id) => {
        const item = baseService.list().map(normalizeArtikel).filter(entry => entry.artikelTyp !== "Dienstleistung").find(entry => String(entry.id) === String(id));
        return item ? normalizeArtikel(item) : undefined;
    },
    create: (payload) => baseService.create(normalizeArtikel(payload)),
    add: (payload) => baseService.create(normalizeArtikel(payload)),
    update: (idOrItem, payload) => {
        if (typeof idOrItem === "object") {
            return baseService.update(normalizeArtikel(idOrItem));
        }
        return baseService.update(idOrItem, normalizeArtikel(payload));
    },
    remove: (id) => baseService.remove(id),
    delete: (id) => baseService.remove(id),
    removeMany: (ids) => baseService.removeMany(ids),
    deleteMultiple: (ids) => baseService.removeMany(ids),
    search: (query) => baseService.search(query).map(normalizeArtikel),
    sortBy: (field, order = "asc") => baseService.sortBy(field, order).map(normalizeArtikel)
};

export const getArtikels = () => artikelService.getAll();
export const addArtikel = (eintrag) => artikelService.add(eintrag);
export const updateArtikel = (eintrag) => artikelService.update(eintrag);
export const deleteArtikel = (id) => artikelService.delete(id);

export default artikelService;

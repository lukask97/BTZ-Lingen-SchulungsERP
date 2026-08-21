import { createCRUDService } from "../core/genericService";
import { getKategoriePfad } from "./kategorienService";
import { createPositionTableService } from "../core/positionTableService";

const baseService = createCRUDService("artikel", []);
const stuecklisteService = createPositionTableService([], {
    tableName: "artikelStueckliste",
    parentField: "hauptartikelId"
});
const individualisierungService = createPositionTableService([], {
    tableName: "artikelIndividualisierung",
    parentField: "artikelId"
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

function hydrateKomponenten(item: any = {}) {
    return stuecklisteService.listByParent(item.id || "")
        .map(position => ({
            artikelId: position.komponentenartikelId || position.artikelId,
            artikel: withPermissionFallback(
                () => baseService.list().find(entry => String(entry.id) === String(position.komponentenartikelId || position.artikelId))?.name || "",
                ""
            ),
            menge: Number(position.menge || 0)
        }));
}

function hydrateIndividualisierungen(item: any = {}) {
    return individualisierungService.listByParent(item.id || "")
        .map(position => ({
            individualArtikelId: position.individualArtikelId,
            artikelId: position.artikelId,
            artikel: withPermissionFallback(
                () => baseService.list().find(entry => String(entry.id) === String(position.individualArtikelId))?.name || "",
                ""
            ),
            kategorieId: position.kategorieId,
            anzahl: Number(position.anzahl || 0),
            preisaenderung: Number(position.preisaenderung || 0),
            standard: Boolean(position.standard)
        }));
}

export function normalizeArtikel(item: any = {}) {
    const id = (item as any).id ?? (item as any).artikelId ?? (item as any).artikelNr ?? "";
    const artikelNr = (item as any).artikelNr || String(id || "");
    const name = (item as any).name || (item as any).artikel || (item as any).bezeichnung || "";
    const komponenten = Array.isArray(item.komponenten) ? item.komponenten : hydrateKomponenten(item);
    const individualisierungen = Array.isArray(item.individualisierungen) ? item.individualisierungen : hydrateIndividualisierungen(item);
    const basisPreis = Number(item.preis || 0);
    const einkaufspreis = Number(item.einkaufspreis || basisPreis);
    const verkaufspreis = Number(item.verkaufspreis || basisPreis);
    const kategoriePfad = getKategoriePfad(item.kategorieId, item.kategoriePfad || item.kategorie || "");
    const kategorie = kategoriePfad.split(" > ")[0] || item.kategorie || "";
    return {
        ...item,
        id,
        artikelNr,
        name,
        artikel: name,
        preis: verkaufspreis,
        kategorieId: item.kategorieId || "",
        kategorie,
        kategoriePfad,
        artikelTyp: item.artikelTyp || (komponenten.length > 0 ? "Baugruppe" : "Einzelartikel"),
        einkaufspreis,
        verkaufspreis,
        bestand: Number(item.bestand || 0),
        mindestmenge: Number(item.mindestmenge || 0),
        bedarfsmeldungBei: Number(item.bedarfsmeldungBei || 0),
        komponenten,
        individualisierungen,
        istEinkaufbar: einkaufspreis > 0,
        istVerkaeuflich: verkaufspreis > 0,
        beschaffungsart: einkaufspreis > 0 ? "Zukauf" : "Herstellung",
        verkaufsstatus: verkaufspreis > 0 ? "Verkaufbar" : "Nicht verkaufbar",
        bedarfsmeldungAktiv: Number(item.bedarfsmeldungBei || 0) > 0 && Number(item.bestand || 0) <= Number(item.bedarfsmeldungBei || 0)
    };
}

function splitPayload(payload: any = {}) {
    const { komponenten = [], individualisierungen = [], ...basePayload } = payload;
    return { basePayload, komponenten, individualisierungen };
}

const artikelService = {
    list: () => withPermissionFallback(
        () => baseService.list().map(normalizeArtikel).filter(item => item.artikelTyp !== "Dienstleistung"),
        []
    ),
    getAll: () => withPermissionFallback(
        () => baseService.list().map(normalizeArtikel).filter(item => item.artikelTyp !== "Dienstleistung"),
        []
    ),
    getById: (id: any) => {
        const item = artikelService.list().find(entry => String(entry.id) === String(id));
        return item ? normalizeArtikel(item) : undefined;
    },
    create: (payload: any) => {
        const normalized = normalizeArtikel(payload);
        const { basePayload, komponenten, individualisierungen } = splitPayload(normalized);
        const created = baseService.create(basePayload);
        stuecklisteService.replaceForParent(created.id, komponenten.map(komponente => ({
            komponentenartikelId: komponente.artikelId,
            menge: Number(komponente.menge || 0)
        })));
        individualisierungService.replaceForParent(created.id, individualisierungen.map(ind => ({
            individualArtikelId: ind.individualArtikelId,
            kategorieId: ind.kategorieId,
            anzahl: Number(ind.anzahl || 0),
            preisaenderung: Number(ind.preisaenderung || 0),
            standard: Boolean(ind.standard)
        })));
        return normalizeArtikel(created);
    },
    add: (payload: any) => {
        return artikelService.create(payload);
    },
    update: (idOrItem: any, payload?: any) => {
        let updated;
        if (typeof idOrItem === "object") {
            const normalized = normalizeArtikel(idOrItem);
            const { basePayload, komponenten, individualisierungen } = splitPayload(normalized);
            updated = baseService.update(basePayload);
            stuecklisteService.replaceForParent(updated.id, komponenten.map(komponente => ({
                komponentenartikelId: komponente.artikelId,
                menge: Number(komponente.menge || 0)
            })));
            individualisierungService.replaceForParent(updated.id, individualisierungen.map(ind => ({
                individualArtikelId: ind.individualArtikelId,
                kategorieId: ind.kategorieId,
                anzahl: Number(ind.anzahl || 0),
                preisaenderung: Number(ind.preisaenderung || 0),
                standard: Boolean(ind.standard)
            })));
        } else {
            const normalized = normalizeArtikel(payload);
            const { basePayload, komponenten, individualisierungen } = splitPayload(normalized);
            updated = baseService.update(idOrItem, basePayload);
            stuecklisteService.replaceForParent(updated.id, komponenten.map(komponente => ({
                komponentenartikelId: komponente.artikelId,
                menge: Number(komponente.menge || 0)
            })));
            individualisierungService.replaceForParent(updated.id, individualisierungen.map(ind => ({
                individualArtikelId: ind.individualArtikelId,
                kategorieId: ind.kategorieId,
                anzahl: Number(ind.anzahl || 0),
                preisaenderung: Number(ind.preisaenderung || 0),
                standard: Boolean(ind.standard)
            })));
        }
        return normalizeArtikel(updated);
    },
    remove: (id: any) => {
        stuecklisteService.removeByParent(id);
        individualisierungService.removeByParent(id);
        return baseService.remove(id);
    },
    delete: (id: any) => {
        return artikelService.remove(id);
    },
    removeMany: (ids: any[]) => baseService.removeMany(ids),
    deleteMultiple: (ids: any[]) => baseService.removeMany(ids),
    search: (query: string) => withPermissionFallback(
        () => baseService.search(query).map(normalizeArtikel),
        []
    ),
    sortBy: (field: any, order = "asc") => withPermissionFallback(
        () => baseService.sortBy(field, order).map(normalizeArtikel),
        [...artikelService.list()].sort((a, b) => {
            const aValue = String(a[field] ?? "");
            const bValue = String(b[field] ?? "");
            return order === "desc" ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
        })
    )
};

export const getArtikels = () => artikelService.getAll();
export const addArtikel = (eintrag) => artikelService.add(eintrag);
export const updateArtikel = (eintrag) => artikelService.update(eintrag);
export const deleteArtikel = (id) => artikelService.delete(id);

export default artikelService;

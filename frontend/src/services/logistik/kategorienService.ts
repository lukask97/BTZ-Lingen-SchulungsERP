import { kategorien } from "../mockup/mockData";
import { createCRUDService } from "../core/genericService";

const baseService = createCRUDService("kategorien", kategorien);

function resolvePath(category, allCategories) {
    if (!category) return "";
    const parts = [category.name];
    let currentParentId = category.parentId;

    while (currentParentId) {
        const parent = allCategories.find(item => String(item.id) === String(currentParentId));
        if (!parent) break;
        parts.unshift(parent.name);
        currentParentId = parent.parentId;
    }

    return parts.join(" > ");
}

export function normalizeKategorie(item = {}, allCategories = baseService.list()) {
    const parent = allCategories.find(entry => String(entry.id) === String(item.parentId));
    return {
        ...item,
        parentId: item.parentId ?? "",
        parentName: parent?.name || "",
        pfad: resolvePath(item, allCategories)
    };
}

const kategorienService = {
    list() {
        const allCategories = baseService.list();
        return allCategories.map(item => normalizeKategorie(item, allCategories));
    },
    getAll() {
        return this.list();
    },
    getById(id) {
        const allCategories = baseService.list();
        const item = allCategories.find(entry => String(entry.id) === String(id));
        return item ? normalizeKategorie(item, allCategories) : undefined;
    },
    create(payload) {
        return baseService.create(payload);
    },
    add(payload) {
        return baseService.create(payload);
    },
    update(idOrItem, payload) {
        if (typeof idOrItem === "object") {
            return baseService.update(idOrItem);
        }
        return baseService.update(idOrItem, payload);
    },
    remove(id) {
        return baseService.remove(id);
    },
    delete(id) {
        return baseService.remove(id);
    }
};

export function getKategoriePfad(kategorieId, fallback = "") {
    const kategorie = kategorienService.getById(kategorieId);
    return kategorie?.pfad || fallback;
}

export default kategorienService;

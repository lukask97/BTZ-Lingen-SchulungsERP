import { createCRUDService } from "../core/genericService";

const baseService = createCRUDService("kategorien", []);

function resolvePath(category: any, allCategories: any[]) {
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

function resolveDepth(category: any, allCategories: any[]) {
    let depth = 0;
    let currentParentId = category.parentId;

    while (currentParentId) {
        const parent = allCategories.find(item => String(item.id) === String(currentParentId));
        if (!parent) break;
        depth += 1;
        currentParentId = parent.parentId;
    }

    return depth;
}

function resolveRootCategory(category: any, allCategories: any[]) {
    if (!category) return null;

    let current = category;
    while (current.parentId) {
        const parent = allCategories.find(item => String(item.id) === String(current.parentId));
        if (!parent) break;
        current = parent;
    }

    return current;
}

export function normalizeKategorie(item: any = {}, allCategories: any[] = baseService.list()) {
    const parent = allCategories.find(entry => String(entry.id) === String(item.parentId));
    const root = resolveRootCategory(item, allCategories);
    const depth = resolveDepth(item, allCategories);
    return {
        ...item,
        parentId: item.parentId || "",
        parentName: parent?.name || "",
        pfad: resolvePath(item, allCategories),
        ebene: depth,
        istOberkategorie: depth === 0,
        hauptkategorie: root?.name || item.name || "",
        sortName: `${root?.name || item.name || ""}-${resolvePath(item, allCategories)}`
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
    getById(id: any) {
        const allCategories = baseService.list();
        const item = allCategories.find(entry => String(entry.id) === String(id));
        return item ? normalizeKategorie(item, allCategories) : undefined;
    },
    create(payload: any) {
        return baseService.create(payload);
    },
    add(payload: any) {
        return baseService.create(payload);
    },
    update(idOrItem: any, payload?: any) {
        if (typeof idOrItem === "object") {
            return baseService.update(idOrItem);
        }
        return baseService.update(idOrItem, payload);
    },
    remove(id: any) {
        return baseService.remove(id);
    },
    delete(id: any) {
        return baseService.remove(id);
    }
};

export function getKategoriePfad(kategorieId: any, fallback = "") {
    const kategorie = kategorienService.getById(kategorieId);
    return kategorie?.pfad || fallback;
}

export default kategorienService;

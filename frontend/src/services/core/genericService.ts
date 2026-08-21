import type { CrudService, EntityWithId } from "../../types/crud";
import { buildDatabasePath, syncApiRequest } from "./api";
import { getCachedTableData, invalidateTableCache, setCachedTableData } from "./dataCache";

/**
 * Generischer CRUD-Service für alle Tabellen
 * 
 * @param {string} tableName - Name der Tabelle
 * @param {array} initialData - wird nur noch fuer Rueckwaertskompatibilitaet entgegengenommen
 * @returns {object} CRUD-Funktionen
 */
export function createCRUDService<T extends EntityWithId>(tableName: string, initialData: T[] = []): CrudService<T> {
    void initialData;
    let tableData = [] as T[];

    const reload = (force = false) => {
        if (!force) {
            const cached = getCachedTableData<T>(tableName);
            if (cached) {
                tableData = cached;
                return tableData;
            }
        }

        const result = syncApiRequest(buildDatabasePath(`/${tableName}`));
        tableData = setCachedTableData(tableName, result.items || []);
        return tableData;
    };

    const persist = (nextData: T[]) => {
        tableData = nextData;
        return tableData;
    };

    const api = {
        list: () => reload(),
        getById: (id: number | string) => {
            const cached = getCachedTableData<T>(tableName);
            if (cached) {
                const cachedItem = cached.find(item => String(item.id) === String(id));
                if (cachedItem) {
                    return cachedItem;
                }
            }

            const loadedItems = reload();
            const loadedItem = loadedItems.find(item => String(item.id) === String(id));
            if (loadedItem) {
                return loadedItem;
            }

            const result = syncApiRequest(buildDatabasePath(`/${tableName}/${id}`));
            return result.item;
        },
        create: (item: Partial<T> & Record<string, unknown>) => {
            const result = syncApiRequest(buildDatabasePath(`/${tableName}`), {
                method: "POST",
                body: item
            });
            invalidateTableCache(tableName);
            tableData = reload(true);
            return result.item;
        },
        update: (idOrItem: number | string | (Partial<T> & Record<string, unknown>), payload: Partial<T>) => {
            const current = reload();
            const nextItem = (typeof idOrItem === "object"
                ? idOrItem
                : { ...(current.find(item => item.id === idOrItem) || {}), ...payload, id: idOrItem }) as T;
            const result = syncApiRequest(buildDatabasePath(`/${tableName}/${nextItem.id}`), {
                method: "PATCH",
                body: nextItem
            });
            invalidateTableCache(tableName);
            tableData = reload(true);
            return result.item;
        },
        remove: (id: number | string) => {
            syncApiRequest(buildDatabasePath(`/${tableName}/${id}`), {
                method: "DELETE"
            });
            invalidateTableCache(tableName);
            tableData = reload(true);
        },
        removeMany: (ids: Array<number | string>) => {
            ids.forEach(id => {
                syncApiRequest(buildDatabasePath(`/${tableName}/${id}`), {
                    method: "DELETE"
                });
            });
            invalidateTableCache(tableName);
            tableData = reload(true);
        },
        search: (query: string) => {
            return reload().filter(item =>
                Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase())
            );
        },
        sortBy: (field: keyof T | string, order = "asc") => {
            return [...reload()].sort((a, b) => {
                if (order === "asc") {
                    return (a as Record<string, unknown>)[String(field)] > (b as Record<string, unknown>)[String(field)] ? 1 : -1;
                }
                return (a as Record<string, unknown>)[String(field)] < (b as Record<string, unknown>)[String(field)] ? 1 : -1;
            });
        }
    };

    return {
        ...api,
        getAll: api.list,
        add: api.create,
        delete: api.remove,
        deleteMultiple: api.removeMany
    };
}

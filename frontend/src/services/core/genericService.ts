import { loadData, saveData } from "../mockup/mockStorage";
import type { CrudService, EntityWithId } from "../../types/crud";
import { buildDatabasePath, isDatabaseModeEnabled, syncApiRequest } from "./api";
import { getCachedTableData, invalidateTableCache, setCachedTableData } from "./dataCache";

/**
 * Generischer CRUD-Service für alle Tabellen
 * 
 * @param {string} tableName - Name der Tabelle
 * @param {array} initialData - Initiale Mock-Daten
 * @returns {object} CRUD-Funktionen
 */
export function createCRUDService<T extends EntityWithId>(tableName: string, initialData: T[] = []): CrudService<T> {
    const useBackend = () => isDatabaseModeEnabled();
    let tableData = useBackend() ? [] as T[] : loadData(tableName, initialData);

    const reload = (force = false) => {
        if (useBackend()) {
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
        }
        tableData = loadData(tableName, initialData);
        return tableData;
    };

    const persist = (nextData: T[]) => {
        if (useBackend()) {
            tableData = nextData;
            return tableData;
        }
        tableData = nextData;
        saveData(tableName, tableData);
        return tableData;
    };

    const createId = () => Date.now() + Math.floor(Math.random() * 1000);

    const api = {
        list: () => reload(),
        getById: (id: number | string) => {
            if (useBackend()) {
                const result = syncApiRequest(buildDatabasePath(`/${tableName}/${id}`));
                return result.item;
            }
            return reload().find(item => item.id === id);
        },
        create: (item: Partial<T> & Record<string, unknown>) => {
            if (useBackend()) {
                const result = syncApiRequest(buildDatabasePath(`/${tableName}`), {
                    method: "POST",
                    body: item
                });
                invalidateTableCache(tableName);
                tableData = reload(true);
                return result.item;
            }
            const created = { ...item, id: item.id ?? createId() } as T;
            persist([...reload(), created]);
            return created;
        },
        update: (idOrItem: number | string | (Partial<T> & Record<string, unknown>), payload?: Partial<T>) => {
            if (useBackend()) {
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
            }
            const current = reload();
            const nextItem = (typeof idOrItem === "object"
                ? idOrItem
                : { ...(current.find(item => item.id === idOrItem) || {}), ...payload, id: idOrItem }) as T;
            persist(current.map(item => item.id === nextItem.id ? nextItem : item));
            return nextItem;
        },
        remove: (id: number | string) => {
            if (useBackend()) {
                syncApiRequest(buildDatabasePath(`/${tableName}/${id}`), {
                    method: "DELETE"
                });
                invalidateTableCache(tableName);
                tableData = reload(true);
                return;
            }
            persist(reload().filter(item => item.id !== id));
        },
        removeMany: (ids: Array<number | string>) => {
            if (useBackend()) {
                ids.forEach(id => {
                    syncApiRequest(buildDatabasePath(`/${tableName}/${id}`), {
                        method: "DELETE"
                    });
                });
                invalidateTableCache(tableName);
                tableData = reload(true);
                return;
            }
            persist(reload().filter(item => !ids.includes(item.id)));
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

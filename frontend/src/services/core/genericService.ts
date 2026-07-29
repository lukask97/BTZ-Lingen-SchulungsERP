import { loadData, saveData } from "../mockup/mockStorage";
import type { CrudService, EntityWithId } from "../../types/crud";

/**
 * Generischer CRUD-Service für alle Tabellen
 * 
 * @param {string} tableName - Name der Tabelle
 * @param {array} initialData - Initiale Mock-Daten
 * @returns {object} CRUD-Funktionen
 */
export function createCRUDService<T extends EntityWithId>(tableName: string, initialData: T[] = []): CrudService<T> {
    let tableData = loadData(tableName, initialData);

    const reload = () => {
        tableData = loadData(tableName, initialData);
        return tableData;
    };

    const persist = (nextData: T[]) => {
        tableData = nextData;
        saveData(tableName, tableData);
        return tableData;
    };

    const createId = () => Date.now() + Math.floor(Math.random() * 1000);

    const api = {
        list: () => reload(),
        getById: (id: number | string) => reload().find(item => item.id === id),
        create: (item: Partial<T> & Record<string, unknown>) => {
            const created = { ...item, id: item.id ?? createId() } as T;
            persist([...reload(), created]);
            return created;
        },
        update: (idOrItem: number | string | (Partial<T> & Record<string, unknown>), payload?: Partial<T>) => {
            const current = reload();
            const nextItem = (typeof idOrItem === "object"
                ? idOrItem
                : { ...(current.find(item => item.id === idOrItem) || {}), ...payload, id: idOrItem }) as T;
            persist(current.map(item => item.id === nextItem.id ? nextItem : item));
            return nextItem;
        },
        remove: (id: number | string) => {
            persist(reload().filter(item => item.id !== id));
        },
        removeMany: (ids: Array<number | string>) => {
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

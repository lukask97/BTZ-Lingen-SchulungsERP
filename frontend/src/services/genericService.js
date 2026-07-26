import { loadData, saveData } from "./mockup/mockStorage";

/**
 * Generischer CRUD-Service für alle Tabellen
 * 
 * @param {string} tableName - Name der Tabelle
 * @param {array} initialData - Initiale Mock-Daten
 * @returns {object} CRUD-Funktionen
 */
export function createCRUDService(tableName, initialData = []) {
    let tableData = loadData(tableName, initialData);

    const reload = () => {
        tableData = loadData(tableName, initialData);
        return tableData;
    };

    const persist = (nextData) => {
        tableData = nextData;
        saveData(tableName, tableData);
        return tableData;
    };

    const createId = () => Date.now() + Math.floor(Math.random() * 1000);

    const api = {
        list: () => reload(),
        getById: (id) => reload().find(item => item.id === id),
        create: (item) => {
            const created = { ...item, id: item.id ?? createId() };
            persist([...reload(), created]);
            return created;
        },
        update: (idOrItem, payload) => {
            const current = reload();
            const nextItem = typeof idOrItem === "object" ? idOrItem : { ...(current.find(item => item.id === idOrItem) || {}), ...payload, id: idOrItem };
            persist(current.map(item => item.id === nextItem.id ? nextItem : item));
            return nextItem;
        },
        remove: (id) => {
            persist(reload().filter(item => item.id !== id));
        },
        removeMany: (ids) => {
            persist(reload().filter(item => !ids.includes(item.id)));
        },
        search: (query) => {
            return reload().filter(item =>
                Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase())
            );
        },
        sortBy: (field, order = "asc") => {
            return [...reload()].sort((a, b) => {
                if (order === "asc") {
                    return a[field] > b[field] ? 1 : -1;
                }
                return a[field] < b[field] ? 1 : -1;
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

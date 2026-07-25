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

    return {
        /**
         * Alle Daten abrufen
         */
        getAll: () => {
            tableData = loadData(tableName, initialData);
            return tableData;
        },

        /**
         * Ein Element nach ID abrufen
         */
        getById: (id) => {
            return tableData.find(item => item.id === id);
        },

        /**
         * Neues Element hinzufügen
         */
        add: (item) => {
            item.id = Date.now();
            tableData.push(item);
            saveData(tableName, tableData);
            return item;
        },

        /**
         * Element aktualisieren
         */
        update: (item) => {
            tableData = tableData.map(d => d.id === item.id ? item : d);
            saveData(tableName, tableData);
            return item;
        },

        /**
         * Element löschen
         */
        delete: (id) => {
            tableData = tableData.filter(d => d.id !== id);
            saveData(tableName, tableData);
        },

        /**
         * Mehrere Elemente löschen
         */
        deleteMultiple: (ids) => {
            tableData = tableData.filter(d => !ids.includes(d.id));
            saveData(tableName, tableData);
        },

        /**
         * Suchen in Daten
         */
        search: (query) => {
            return tableData.filter(item =>
                Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase())
            );
        },

        /**
         * Daten nach Feld sortieren
         */
        sortBy: (field, order = "asc") => {
            return [...tableData].sort((a, b) => {
                if (order === "asc") {
                    return a[field] > b[field] ? 1 : -1;
                } else {
                    return a[field] < b[field] ? 1 : -1;
                }
            });
        }
    };
}

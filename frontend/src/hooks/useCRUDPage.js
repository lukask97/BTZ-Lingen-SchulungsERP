import { useState } from "react";
import { getColumns, getAllColumns } from "../services/metadataService";

/**
 * Generischer Hook für alle CRUD-Seiten
 * 
 * @param {string} tableName - Name der Tabelle (z.B. "kunden", "artikel")
 * @param {object} initialData - Initialdaten für ein leeres Objekt
 * @param {object} services - CRUD-Services {getAll, add, update, delete}
 * @returns {object} Alle notwendigen States und Funktionen
 */
export function useCRUDPage(tableName, initialData, services) {
    // States
    const [data, setData] = useState(services.getAll());
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [currentItem, setCurrentItem] = useState(initialData);

    // Filterung nach Suchtext
    const filteredData = data.filter(item =>
        Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    // Neue Aktion
    const neu = () => {
        setEditMode(false);
        setCurrentItem(JSON.parse(JSON.stringify(initialData)));
        setOpen(true);
    };

    // Bearbeiten-Aktion
    const bearbeiten = (item) => {
        setEditMode(true);
        setCurrentItem(JSON.parse(JSON.stringify(item)));
        setOpen(true);
    };

    // Löschen-Aktion
    const loeschen = (item) => {
        if (confirm(`Möchten Sie diesen Eintrag wirklich löschen?`)) {
            services.delete(item.id);
            setData(services.getAll());
        }
    };

    // Speichern-Aktion
    const speichern = () => {
        if (editMode) {
            services.update(currentItem);
        } else {
            services.add(currentItem);
        }
        setData(services.getAll());
        setOpen(false);
    };

    // Schließen Dialog
    const handleClose = () => {
        setOpen(false);
    };

    return {
        // States
        data: filteredData,
        allData: data,
        open,
        editMode,
        pageSize,
        search,
        currentItem,
        
        // Setter
        setOpen,
        setPageSize,
        setSearch,
        setCurrentItem,
        
        // Actions
        neu,
        bearbeiten,
        loeschen,
        speichern,
        handleClose
    };
}

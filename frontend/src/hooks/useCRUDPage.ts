import { useEffect, useState } from "react";
import type { CrudService, EntityWithId, UseCrudPageResult } from "../types/crud";
import { subscribeToStorageSync } from "../services/mockup/mockStorage";

/**
 * Generischer Hook für alle CRUD-Seiten
 */
export function useCRUDPage<T extends EntityWithId>(
    tableName: string,
    initialData: T,
    services: CrudService<T>
): UseCrudPageResult<T> {
    // States
    const [data, setData] = useState(services.list());
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [currentItem, setCurrentItem] = useState(initialData);

    useEffect(() => {
        setData(services.list());

        return subscribeToStorageSync([tableName], () => {
            setData(services.list());
        });
    }, [services, tableName]);

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
        setCurrentItem(structuredClone(initialData));
        setOpen(true);
    };

    // Bearbeiten-Aktion
    const bearbeiten = (item: T) => {
        setEditMode(true);
        setCurrentItem(structuredClone(item));
        setOpen(true);
    };

    // Löschen-Aktion
    const loeschen = (item: T) => {
        if (confirm(`Möchten Sie diesen Eintrag wirklich löschen?`)) {
            services.remove(item.id ?? "");
            setData(services.list());
        }
    };

    // Speichern-Aktion
    const speichern = () => {
        if (editMode) {
            services.update(currentItem);
        } else {
            services.create(currentItem);
        }
        setData(services.list());
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

import { useEffect, useState } from "react";
import type { CrudService, EntityWithId, UseCrudPageOptions, UseCrudPageResult } from "../types/crud";
import { subscribeToStorageSync } from "../services/mockup/mockStorage";

/**
 * Generischer Hook für alle CRUD-Seiten
 */
export function useCRUDPage<T extends EntityWithId>(
    tableName: string,
    initialData: T,
    services: CrudService<T>,
    options: UseCrudPageOptions<T> = {}
): UseCrudPageResult<T> {
    // States
    const [data, setData] = useState(services.list());
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [currentItem, setCurrentItem] = useState(initialData);
    const [error, setError] = useState("");

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
        setCurrentItem(structuredClone(options.createNewItem ? options.createNewItem() : initialData));
        setError("");
        setOpen(true);
    };

    // Bearbeiten-Aktion
    const bearbeiten = (item: T) => {
        setEditMode(true);
        setCurrentItem(structuredClone(item));
        setError("");
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
        const fehlendeFelder = (options.requiredFields || []).filter(({ field }) => {
            const value = currentItem?.[field];
            if (Array.isArray(value)) return value.length === 0;
            return value === null || value === undefined || String(value).trim() === "";
        });

        if (fehlendeFelder.length > 0) {
            setError(`Bitte folgende Pflichtfelder ausfuellen: ${fehlendeFelder.map(item => item.label).join(", ")}.`);
            return;
        }

        if (editMode) {
            services.update(currentItem);
        } else {
            services.create(currentItem);
        }
        setData(services.list());
        setError("");
        setOpen(false);
    };

    // Schließen Dialog
    const handleClose = () => {
        setOpen(false);
        setError("");
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
        error,
        
        // Setter
        setOpen,
        setPageSize,
        setSearch,
        setCurrentItem: (value: T) => {
            setCurrentItem(value);
            if (error) setError("");
        },
        
        // Actions
        neu,
        bearbeiten,
        loeschen,
        speichern,
        handleClose
    };
}

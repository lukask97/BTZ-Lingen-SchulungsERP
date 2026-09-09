import { useCallback, useEffect, useState } from "react";
import type { CrudService, EntityWithId, UseCrudPageOptions, UseCrudPageResult } from "../types/crud";
import { subscribeToDataSync } from "../services/seed/dataSync";

function isRecoverableFetchError(error: unknown) {
    return error instanceof Error && (
        error.message.toLowerCase().includes("failed to fetch")
        || error.message.toLowerCase().includes("backend nicht erreichbar")
        || error.message.toLowerCase().includes("networkerror")
    );
}

export function useCRUDPage<T extends EntityWithId>(
    tableName: string,
    initialData: T,
    services: CrudService<T>,
    options: UseCrudPageOptions<T> = {}
): UseCrudPageResult<T> {
    const [data, setData] = useState<T[]>(() => {
        try {
            return services.list();
        } catch (error) {
            if (isRecoverableFetchError(error)) {
                return [];
            }
            throw error;
        }
    });
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState("");
    const [currentItem, setCurrentItem] = useState(initialData);
    const [error, setError] = useState("");

    const refreshData = useCallback(() => {
        try {
            setData(services.list());
        } catch (error) {
            if (isRecoverableFetchError(error)) {
                setData([]);
                return;
            }
            throw error;
        }
    }, [services]);

    useEffect(() => {
        refreshData();

        return subscribeToDataSync([tableName], () => {
            refreshData();
        });
    }, [refreshData, tableName]);

    const filteredData = data.filter(item =>
        Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const neu = () => {
        setEditMode(false);
        setCurrentItem(structuredClone(options.createNewItem ? options.createNewItem() : initialData));
        setError("");
        setOpen(true);
    };

    const bearbeiten = (item: T) => {
        setEditMode(true);
        setCurrentItem(structuredClone(item));
        setError("");
        setOpen(true);
    };

    const loeschen = (item: T) => {
        if (confirm("Moechten Sie diesen Eintrag wirklich loeschen")) {
            services.remove(item.id ?? "");
            refreshData();
        }
    };

    const speichern = () => {
        const fehlendeFelder = (options.requiredFields || []).filter(({ field }) => {
            const value = currentItem[field];
            if (Array.isArray(value)) return value.length === 0;
            return value === null || value === undefined || String(value).trim() === "";
        });

        if (fehlendeFelder.length > 0) {
            setError(`Bitte folgende Pflichtfelder ausfuellen: ${fehlendeFelder.map(item => item.label).join(", ")}.`);
            return false;
        }

        if (editMode) {
            services.update(currentItem);
        } else {
            services.create(currentItem);
        }
        refreshData();
        setError("");
        return true;
    };

    const handleClose = () => {
        setOpen(false);
        setError("");
    };

    return {
        data: filteredData,
        allData: data,
        open,
        editMode,
        pageSize,
        search,
        currentItem,
        error,
        setOpen,
        setPageSize,
        setSearch,
        setCurrentItem: (value: T) => {
            setCurrentItem(value);
            if (error) setError("");
        },
        neu,
        bearbeiten,
        loeschen,
        speichern,
        refreshData,
        handleClose
    };
}

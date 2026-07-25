import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import TextField from "../components/form/TextField";
import TextArea from "../components/form/TextArea";
import Label from "../components/form/Label";

import { getColumns, getAllColumns } from "../services/metadataService";
import useAuth from "../auth/AuthContext";
import { useCRUDPage } from "../hooks/useCRUDPage";
import artikelService from "../services/artikelService";
import { INITIAL_DATA, PAGE_CONFIG } from "../constants/schemas";
import { useState, useMemo } from "react";

export default function Artikel() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.artikel;
    
    const {
        data,
        allData,
        open,
        editMode,
        pageSize,
        search,
        currentItem,
        setOpen,
        setPageSize,
        setSearch,
        setCurrentItem,
        neu,
        bearbeiten,
        loeschen,
        speichern,
        handleClose
    } = useCRUDPage(config.tableName, INITIAL_DATA.artikel, artikelService);

    const columns = getColumns(config.tableName, user.username);
    const allColumns = getAllColumns(config.tableName);

    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    const handleFilterChange = (filters) => {
        setCategoryFilter(filters.kategorie || "");
        setStatusFilter(filters.aktiv || "");
    };

    const filteredDisplayData = useMemo(() => {
        // Filter auf ungefilterte Daten anwenden
        let filtered = allData;
        if (categoryFilter) {
            filtered = filtered.filter(item => item.kategorie === categoryFilter);
        }
        if (statusFilter) {
            filtered = filtered.filter(item => statusFilter === "aktiv" ? item.aktiv : !item.aktiv);
        }
        // Dann Suche anwenden
        if (search) {
            filtered = filtered.filter(item =>
                Object.values(item)
                    .join(" ")
                    .toLowerCase()
                    .includes(search.toLowerCase())
            );
        }
        return filtered;
    }, [allData, categoryFilter, statusFilter, search]);

    const artikelFilters = useMemo(() => [
        {
            name: "kategorie",
            label: "Kategorie",
            options: [
                { value: "Fahrräder", label: "Fahrräder" },
                { value: "Bekleidung", label: "Bekleidung" },
                { value: "Zubehör", label: "Zubehör" }
            ]
        },
        {
            name: "aktiv",
            label: "Status",
            options: [
                { value: "aktiv", label: "Aktiv" },
                { value: "inaktiv", label: "Inaktiv" }
            ]
        }
    ], []);

    return (
        <>
            <DataTable
                title={config.title}
                tableName={config.tableName}
                username={user.username}
                columns={columns}
                allColumns={allColumns}
                data={filteredDisplayData}
                filters={artikelFilters}
                onFilter={handleFilterChange}
                searchable={true}
                pageSize={pageSize}
                onSearch={setSearch}
                onPageSizeChange={setPageSize}
                toolbarActions={[
                    { name: "new", label: "Neuer Artikel", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Artikel bearbeiten" : "Neuer Artikel"}
                onClose={handleClose}
            >
                <Label required>Artikelnummer</Label>
                <TextField value={currentItem.artikelNr} onChange={v => handleFieldChange("artikelNr", v)} />

                <Label required>Name</Label>
                <TextField value={currentItem.name} onChange={v => handleFieldChange("name", v)} />

                <Label>Kategorie</Label>
                <TextField value={currentItem.kategorie} onChange={v => handleFieldChange("kategorie", v)} />

                <Label>Preis</Label>
                <TextField value={currentItem.preis} onChange={v => handleFieldChange("preis", v)} />

                <Label>Bestand</Label>
                <TextField value={currentItem.bestand} onChange={v => handleFieldChange("bestand", v)} />

                <div className="form-row">
                    <Label>Beschreibung</Label>
                    <TextArea
                        rows={2}
                        placeholder="Beschreibung des Artikels..."
                        value={currentItem.beschreibung}
                        onChange={v => handleFieldChange("beschreibung", v)}
                    />
                </div>

                <div className="form-row">
                    <button onClick={speichern}>Speichern</button>
                </div>
            </Dialog>
        </>
    );
}

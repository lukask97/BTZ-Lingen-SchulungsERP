import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import TextField from "../components/form/TextField";
import TextArea from "../components/form/TextArea";
import Label from "../components/form/Label";

import { getColumns, getAllColumns } from "../services/metadataService";
import useAuth from "../auth/useAuth";
import { useCRUDPage } from "../hooks/useCRUDPage";
import rechteService from "../services/rechteService";
import { INITIAL_DATA, PAGE_CONFIG } from "../constants/schemas";
import { useState, useMemo } from "react";

export default function Rechte() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.rechte;
    
    const {
        allData,
        open,
        editMode,
        pageSize,
        search,
        currentItem,
        setPageSize,
        setSearch,
        setCurrentItem,
        neu,
        bearbeiten,
        loeschen,
        speichern,
        handleClose
    } = useCRUDPage(config.tableName, INITIAL_DATA.rechte, rechteService);

    const columns = getColumns(config.tableName, user.username);
    const allColumns = getAllColumns(config.tableName);

    const [statusFilter, setStatusFilter] = useState("");

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    const handleFilterChange = (filters) => {
        setStatusFilter(filters.aktiv || "");
    };

    const filteredDisplayData = useMemo(() => {
        // Filter auf ungefilterte Daten anwenden
        let filtered = allData;
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
    }, [allData, statusFilter, search]);

    const rechteFilters = useMemo(() => [
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
                filters={rechteFilters}
                onFilter={handleFilterChange}
                searchable={true}
                pageSize={pageSize}
                onSearch={setSearch}
                onPageSizeChange={setPageSize}
                toolbarActions={[
                    { name: "new", label: "Neues Recht", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Recht bearbeiten" : "Neues Recht"}
                onClose={handleClose}
            >
                <Label required>Name</Label>
                <TextField value={currentItem.name} onChange={v => handleFieldChange("name", v)} />

                <div className="form-row">
                    <Label>Beschreibung</Label>
                    <TextArea
                        rows={2}
                        placeholder="Beschreibung des Rechts..."
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

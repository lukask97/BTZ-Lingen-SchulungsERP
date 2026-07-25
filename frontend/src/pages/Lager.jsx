import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import TextField from "../components/form/TextField";
import Label from "../components/form/Label";

import { getColumns, getAllColumns } from "../services/metadataService";
import useAuth from "../auth/AuthContext";
import { useCRUDPage } from "../hooks/useCRUDPage";
import lagerService from "../services/lagerService";
import { INITIAL_DATA, PAGE_CONFIG } from "../constants/schemas";
import { useState, useMemo } from "react";
import OverviewCards from "../components/OverviewCards";

export default function Lager() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.lager;
    
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
    } = useCRUDPage(config.tableName, INITIAL_DATA.lager, lagerService);

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

    const lagerFilters = useMemo(() => [
        {
            name: "aktiv",
            label: "Status",
            options: [
                { value: "aktiv", label: "Aktiv" },
                { value: "inaktiv", label: "Inaktiv" }
            ]
        }
    ], []);

    const aktiveLager = allData.filter(item => item.aktiv).length;
    const kapazitaet = allData.reduce((summe, item) => summe + Number(item.kapazitaet || 0), 0);

    return (
        <>
            <OverviewCards cards={[
                { label: "Lager gesamt", value: allData.length },
                { label: "Aktive Lager", value: aktiveLager },
                { label: "Gesamtkapazität", value: kapazitaet }
            ]}/>
            <DataTable
                title={config.title}
                tableName={config.tableName}
                username={user.username}
                columns={columns}
                allColumns={allColumns}
                data={filteredDisplayData}
                filters={lagerFilters}
                onFilter={handleFilterChange}
                searchable={true}
                pageSize={pageSize}
                onSearch={setSearch}
                onPageSizeChange={setPageSize}
                toolbarActions={[
                    { name: "new", label: "Neues Lager", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Lager bearbeiten" : "Neues Lager"}
                onClose={handleClose}
            >
                <Label required>Name</Label>
                <TextField value={currentItem.name} onChange={v => handleFieldChange("name", v)} />

                <Label>Standort</Label>
                <TextField value={currentItem.standort} onChange={v => handleFieldChange("standort", v)} />

                <Label>Kapazität</Label>
                <TextField value={currentItem.kapazitaet} onChange={v => handleFieldChange("kapazitaet", v)} />

                <div className="form-row">
                    <button onClick={speichern}>Speichern</button>
                </div>
            </Dialog>
        </>
    );
}

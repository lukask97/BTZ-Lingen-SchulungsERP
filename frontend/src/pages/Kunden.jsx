import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import TextField from "../components/form/TextField";
import Checkbox from "../components/form/Checkbox";
import Label from "../components/form/Label";
import TextArea from "../components/form/TextArea";

import { getColumns, getAllColumns } from "../services/metadataService";
import useAuth from "../auth/AuthContext";
import { useCRUDPage } from "../hooks/useCRUDPage";
import kundenService from "../services/customerService";
import { INITIAL_DATA, PERMISSIONS, PAGE_CONFIG } from "../constants/schemas";
import { useState, useMemo } from "react";
import OverviewCards from "../components/OverviewCards";

export default function Kunden() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.kunden;
    
    // Verwende den generischen Hook
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
    } = useCRUDPage(config.tableName, INITIAL_DATA.kunden, kundenService);

    const columns = getColumns(config.tableName, user.username);
    const allColumns = getAllColumns(config.tableName);

    const [segmentFilter, setSegmentFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    const handleFilterChange = (filters) => {
        setSegmentFilter(filters.segment || "");
        setStatusFilter(filters.aktiv || "");
    };

    const filteredDisplayData = useMemo(() => {
        // Filter auf ungefilterte Daten anwenden
        let filtered = allData;
        if (segmentFilter) filtered = filtered.filter(item => item.segment === segmentFilter);
        if (statusFilter) filtered = filtered.filter(item => statusFilter === "aktiv" ? item.aktiv : !item.aktiv);
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
    }, [allData, segmentFilter, statusFilter, search]);

    const kundenFilters = useMemo(() => [
        {
            name: "segment",
            label: "Segment",
            options: [
                { value: "Einzelhandel", label: "Einzelhandel" },
                { value: "Groß", label: "Großhandel" },
                { value: "Öffentlich", label: "Öffentliche Institutionen" }
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

    const aktiveKunden = allData.filter(item => item.aktiv).length;

    return (
        <>
            <OverviewCards cards={[
                { label: "Kunden gesamt", value: allData.length },
                { label: "Aktive Kunden", value: aktiveKunden },
                { label: "Inaktive Kunden", value: allData.length - aktiveKunden }
            ]}/>
            <DataTable
                title={config.title}
                tableName={config.tableName}
                username={user.username}
                columns={columns}
                allColumns={allColumns}
                data={filteredDisplayData}
                filters={kundenFilters}
                onFilter={handleFilterChange}
                searchable={true}
                pageSize={pageSize}
                onSearch={setSearch}
                onPageSizeChange={setPageSize}
                toolbarActions={[
                    { name: "new", label: "Neuer Kunde", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Kunde bearbeiten" : "Neuer Kunde"}
                onClose={handleClose}
            >
                <Label required>Kundennummer</Label>
                <TextField value={currentItem.kundenNr} onChange={v => handleFieldChange("kundenNr", v)} />

                <Label required>Firma</Label>
                <TextField value={currentItem.firma} onChange={v => handleFieldChange("firma", v)} />

                <Label>Anschrift</Label>
                <TextField value={currentItem.anschrift} onChange={v => handleFieldChange("anschrift", v)} />

                <Label>PLZ</Label>
                <TextField value={currentItem.plz} onChange={v => handleFieldChange("plz", v)} />

                <Label>Ort</Label>
                <TextField value={currentItem.ort} onChange={v => handleFieldChange("ort", v)} />

                <Label>Segment</Label>
                <TextField value={currentItem.segment} onChange={v => handleFieldChange("segment", v)} />

                <Label>Website</Label>
                <TextField value={currentItem.website || ""} onChange={v => handleFieldChange("website", v)} />

                <Label>Optionen</Label>
                <TextField
                    value={currentItem.optionen?.join(", ") || ""}
                    onChange={v => handleFieldChange("optionen", v.split(",").map(x => x.trim()).filter(Boolean))}
                />

                <Checkbox checked={currentItem.aktiv} onChange={v => handleFieldChange("aktiv", v)}>
                    Aktiv
                </Checkbox>

                <div className="form-row">
                    <Label>Notiz</Label>
                    <TextArea
                        rows={2}
                        placeholder="Interne Notiz zum Kunden..."
                        value={currentItem.notiz}
                        onChange={v => handleFieldChange("notiz", v)}
                    />
                </div>

                <div className="form-row">
                    <button onClick={speichern}>Speichern</button>
                </div>
            </Dialog>
        </>
    );
}

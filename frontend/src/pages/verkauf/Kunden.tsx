import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import TextField from "../../components/form/TextField";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/TextArea";

import useAuth from "../../auth/useAuth";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import kundenService from "../../services/verkauf/customerService";
import { getAllTableColumns, getVisibleTableColumns, INITIAL_DATA, PAGE_CONFIG } from "../../constants/schemas";
import { useState, useMemo } from "react";
import OverviewCards from "../../components/OverviewCards";
import { useSearchParams } from "react-router-dom";

export default function Kunden() {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const config = PAGE_CONFIG.kunden;
    
    // Verwende den generischen Hook
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
    } = useCRUDPage(config.tableName, INITIAL_DATA.kunden, kundenService);

    const columns = getVisibleTableColumns(config.tableName);
    const allColumns = getAllTableColumns(config.tableName);

    const [segmentFilter, setSegmentFilter] = useState("");

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    const handleFilterChange = (filters) => {
        setSegmentFilter(filters.segment || "");
    };

    const filteredDisplayData = useMemo(() => {
        // Filter auf ungefilterte Daten anwenden
        let filtered = allData;
        if (segmentFilter) filtered = filtered.filter(item => item.segment === segmentFilter);
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
    }, [allData, segmentFilter, search]);

    const kundenFilters = useMemo(() => [
        {
            name: "segment",
            label: "Segment",
            options: [
                { value: "Einzelhandel", label: "Einzelhandel" },
                { value: "Groß", label: "Großhandel" },
                { value: "Öffentlich", label: "Öffentliche Institutionen" }
            ]
        }
    ], []);

    return (
        <>
            <OverviewCards cards={[
                { label: "Kunden gesamt", value: allData.length },
                { label: "Mit Website", value: allData.filter(item => item.website).length },
                { label: "Mit Leistungen", value: allData.filter(item => item.optionen?.length).length }
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
                focusRowId={searchParams.get("focus") || ""}
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

                <Label>ABC</Label>
                <TextField value={currentItem.abc || ""} onChange={v => handleFieldChange("abc", v.toUpperCase().slice(0, 1))} />

                <Label>Website</Label>
                <TextField value={currentItem.website || ""} onChange={v => handleFieldChange("website", v)} />

                <Label>Optionen</Label>
                <TextField
                    value={currentItem.optionen?.join(", ") || ""}
                    onChange={v => handleFieldChange("optionen", v.split(",").map(x => x.trim()).filter(Boolean))}
                />

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

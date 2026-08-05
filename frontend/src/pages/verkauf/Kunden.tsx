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

function naechsteKundennummer(kunden = []) {
    const basis = kunden.reduce((maxWert, item) => {
        const match = String(item.kundenNr || "").match(/(\d+)$/);
        return Math.max(maxWert, Number(match?.[1] || 0));
    }, 10000);
    return `DB${String(basis + 1).padStart(5, "0")}`;
}

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
        handleClose,
        error
    } = useCRUDPage(config.tableName, INITIAL_DATA.kunden, kundenService, {
        requiredFields: [
            { field: "kundenNr", label: "Kundennummer" },
            { field: "firma", label: "Firma" }
        ],
        createNewItem: () => ({
            ...structuredClone(INITIAL_DATA.kunden),
            kundenNr: naechsteKundennummer(kundenService.getAll())
        })
    });

    const columns = getVisibleTableColumns(config.tableName);
    const allColumns = getAllTableColumns(config.tableName);

    const [abcFilter, setAbcFilter] = useState("");
    const [websiteFilter, setWebsiteFilter] = useState("");

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    const handleFilterChange = (filters) => {
        setAbcFilter(filters.abc || "");
        setWebsiteFilter(filters.website || "");
    };

    const filteredDisplayData = useMemo(() => {
        let filtered = allData;
        if (abcFilter) filtered = filtered.filter(item => item.abc === abcFilter);
        if (websiteFilter === "mitWebsite") filtered = filtered.filter(item => !!item.website);
        if (websiteFilter === "ohneWebsite") filtered = filtered.filter(item => !item.website);
        if (search) {
            filtered = filtered.filter(item =>
                Object.values(item)
                    .join(" ")
                    .toLowerCase()
                    .includes(search.toLowerCase())
            );
        }
        return filtered;
    }, [abcFilter, allData, search, websiteFilter]);

    const kundenFilters = useMemo(() => [
        {
            name: "abc",
            label: "ABC",
            options: [
                { value: "A", label: "A-Kunden" },
                { value: "B", label: "B-Kunden" },
                { value: "C", label: "C-Kunden" },
                { value: "Unbestimmt", label: "Unbestimmt" }
            ]
        },
        {
            name: "website",
            label: "Website",
            options: [
                { value: "mitWebsite", label: "Mit Website" },
                { value: "ohneWebsite", label: "Ohne Website" }
            ]
        }
    ], []);

    return (
        <>
            <OverviewCards cards={[
                { label: "Kunden gesamt", value: allData.length },
                { label: "Mit Website", value: allData.filter(item => item.website).length },
                { label: "A-Kunden", value: allData.filter(item => item.abc === "A").length }
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
                <Label required glossaryKey="kundennummer">Kundennummer</Label>
                <TextField value={currentItem.kundenNr} onChange={v => handleFieldChange("kundenNr", v)} />

                <Label required>Firma</Label>
                <TextField value={currentItem.firma} onChange={v => handleFieldChange("firma", v)} />

                <Label>Anschrift</Label>
                <TextField value={currentItem.anschrift} onChange={v => handleFieldChange("anschrift", v)} />

                <Label>PLZ</Label>
                <TextField value={currentItem.plz} onChange={v => handleFieldChange("plz", v)} />

                <Label>Ort</Label>
                <TextField value={currentItem.ort} onChange={v => handleFieldChange("ort", v)} />

                <Label glossaryKey="kategorie">Kategorie</Label>
                <TextField value={currentItem.segment} onChange={v => handleFieldChange("segment", v)} />

                <Label glossaryKey="abc">ABC</Label>
                <select value={currentItem.abc || "Unbestimmt"} onChange={event => handleFieldChange("abc", event.target.value)}>
                    <option value="Unbestimmt">Unbestimmt</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                </select>

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
                    {error && <p className="form-error">{error}</p>}
                    <button type="button" onClick={speichern}>Speichern</button>
                </div>
            </Dialog>
        </>
    );
}

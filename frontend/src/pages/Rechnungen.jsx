import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import TextField from "../components/form/TextField";
import LookupField from "../components/form/LookupField";
import Label from "../components/form/Label";

import { getColumns, getAllColumns } from "../services/metadataService";
import useAuth from "../auth/useAuth";
import { useCRUDPage } from "../hooks/useCRUDPage";
import rechnungenService from "../services/rechnungenService";
import kundenService from "../services/customerService";
import { INITIAL_DATA, PAGE_CONFIG } from "../constants/schemas";
import { useState, useMemo } from "react";

export default function Rechnungen() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.rechnungen;
    
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
    } = useCRUDPage(config.tableName, INITIAL_DATA.rechnungen, rechnungenService);

    const columns = getColumns(config.tableName, user.username);
    const allColumns = getAllColumns(config.tableName);
    const kunden = kundenService.list().filter(item => item.aktiv);
    const kundenOptionen = kunden.map(item => ({ value: String(item.id), label: `${item.kundenNr} - ${item.firma}` }));

    const [statusFilter, setStatusFilter] = useState("");

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    const handleKundeChange = (value) => {
        const kunde = kunden.find(item => String(item.id) === String(value));
        setCurrentItem({
            ...currentItem,
            kundeId: value,
            kunde: kunde?.firma || ""
        });
    };

    const handleFilterChange = (filters) => {
        setStatusFilter(filters.status || "");
    };

    const filteredDisplayData = useMemo(() => {
        // Filter auf ungefilterte Daten anwenden
        let filtered = allData;
        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter);
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

    const rechnungFilters = useMemo(() => [
        {
            name: "status",
            label: "Status",
            options: [
                { value: "offen", label: "Offen" },
                { value: "bezahlt", label: "Bezahlt" },
                { value: "storniert", label: "Storniert" }
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
                filters={rechnungFilters}
                onFilter={handleFilterChange}
                searchable={true}
                pageSize={pageSize}
                onSearch={setSearch}
                onPageSizeChange={setPageSize}
                toolbarActions={[
                    { name: "new", label: "Neue Rechnung", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Rechnung bearbeiten" : "Neue Rechnung"}
                onClose={handleClose}
            >
                <Label required>Rechnungsnummer</Label>
                <TextField value={currentItem.rechnungsnr} onChange={v => handleFieldChange("rechnungsnr", v)} />

                <Label required>Kunde</Label>
                <LookupField
                    value={currentItem.kundeId || String(kunden.find(item => item.firma === currentItem.kunde)?.id || "")}
                    options={kundenOptionen}
                    onChange={handleKundeChange}
                    placeholder="Kunde suchen..."
                />

                <Label>Datum</Label>
                <TextField value={currentItem.datum} onChange={v => handleFieldChange("datum", v)} type="date" />

                <Label>Betrag</Label>
                <TextField value={currentItem.betrag} onChange={v => handleFieldChange("betrag", v)} type="number" />

                <Label>Status</Label>
                <select value={currentItem.status} onChange={event => handleFieldChange("status", event.target.value)}>
                    <option value="offen">Offen</option>
                    <option value="bezahlt">Bezahlt</option>
                    <option value="storniert">Storniert</option>
                </select>

                <div className="form-row">
                    <button onClick={speichern}>Speichern</button>
                </div>
            </Dialog>
        </>
    );
}

// @ts-nocheck
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import HelpHint from "../../components/HelpHint";
import TextField from "../../components/form/TextField";
import TextArea from "../../components/form/TextArea";
import Label from "../../components/form/Label";
import NumberField from "../../components/form/NumberField";
import useAuth from "../../auth/useAuth";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import servicesService from "../../services/verkauf/servicesService";
import { getAllTableColumns, getVisibleTableColumns, INITIAL_DATA, PAGE_CONFIG } from "../../constants/schemas";
import { useMemo, useState } from "react";

export default function Services() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.services;
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
    } = useCRUDPage(config.tableName, INITIAL_DATA.services, servicesService);

    const columns = getVisibleTableColumns(config.tableName);
    const allColumns = getAllTableColumns(config.tableName);
    const [categoryFilter, setCategoryFilter] = useState("");

    const filteredDisplayData = useMemo(() => {
        let filtered = allData;
        if (categoryFilter) filtered = filtered.filter(item => item.kategorie === categoryFilter);
        if (search) {
            filtered = filtered.filter(item =>
                Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
            );
        }
        return filtered;
    }, [allData, categoryFilter, search]);

    const filters = useMemo(() => [{
        name: "kategorie",
        label: "Kategorie",
        options: [
            { value: "Werkstatt", label: "Werkstatt" },
            { value: "Vertrag", label: "Vertrag" },
            { value: "Logistik", label: "Logistik" }
        ]
    }], []);

    const change = (field, value) => setCurrentItem({ ...currentItem, [field]: value });

    return <>
        <DataTable
            title={config.title}
            tableName={config.tableName}
            username={user.username}
            columns={columns}
            allColumns={allColumns}
            data={filteredDisplayData}
            filters={filters}
            onFilter={active => setCategoryFilter(active.kategorie || "")}
            searchable
            pageSize={pageSize}
            onSearch={setSearch}
            onPageSizeChange={setPageSize}
            toolbarActions={[{ name: "new", label: "Neuer Service", permission: config.permissionCreate, onClick: neu }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
            ]}
        />
        <Dialog open={open} title={editMode ? "Service bearbeiten" : "Neuer Service"} onClose={handleClose}>
            <Label required>Servicenummer</Label>
            <TextField value={currentItem.serviceNr} onChange={v => change("serviceNr", v)} />
            <Label required>Name</Label>
            <TextField value={currentItem.name} onChange={v => change("name", v)} />
            <Label>Kategorie</Label>
            <TextField value={currentItem.kategorie} onChange={v => change("kategorie", v)} />
            <div className="label-with-hint">
                <Label>Berechnungstyp</Label>
                <HelpHint text="Pauschal bedeutet ein fester Gesamtpreis. ZE bedeutet, dass der Preis pro Zeiteinheit wie Tag oder Stunde gilt." />
            </div>
            <select value={currentItem.berechnungstyp || "Pauschal"} onChange={event => change("berechnungstyp", event.target.value)}>
                <option value="Pauschal">Pauschal</option>
                <option value="ZE">Zeiteinheit (ZE)</option>
            </select>
            {String(currentItem.berechnungstyp || "Pauschal") === "ZE" && <>
                <div className="label-with-hint">
                    <Label>ZE</Label>
                    <HelpHint text="Hier steht die Einheit, auf die sich der Preis bezieht, zum Beispiel 1 Tag oder 1 Stunde." />
                </div>
                <TextField value={currentItem.zeEinheit || ""} onChange={v => change("zeEinheit", v)} placeholder="z. B. 1 Tag" />
            </>}
            <div className="form-row">
                <p>`Pauschal` bedeutet ein fester Preis pro Service. `ZE` bedeutet, dass der Preis pro Zeiteinheit gilt, zum Beispiel `1 Tag` oder `1 Stunde`.</p>
            </div>
            <Label>Einkaufspreis</Label>
            <NumberField value={currentItem.einkaufspreis} min="0" step="0.01" format="currency" onChange={v => change("einkaufspreis", Number(v || 0))} />
            <Label>Verkaufspreis</Label>
            <NumberField value={currentItem.verkaufspreis} min="0" step="0.01" format="currency" onChange={v => change("verkaufspreis", Number(v || 0))} />
            <div className="form-row">
                <Label>Beschreibung</Label>
                <TextArea rows={2} value={currentItem.beschreibung} onChange={v => change("beschreibung", v)} />
            </div>
            <div className="form-row">
                <button onClick={speichern}>Speichern</button>
            </div>
        </Dialog>
    </>;
}

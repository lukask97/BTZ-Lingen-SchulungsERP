import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import TextField from "../../components/form/TextField";
import NumberField from "../../components/form/NumberField";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/TextArea";
import lieferantenService from "../../services/einkauf/lieferantenService";
import { getAllTableColumns, getVisibleTableColumns, INITIAL_DATA, PAGE_CONFIG } from "../../constants/schemas";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import useAuth from "../../auth/useAuth";
import OverviewCards from "../../components/OverviewCards";
import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";

export default function Lieferanten() {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const config = PAGE_CONFIG.lieferanten;
    const crud = useCRUDPage(config.tableName, INITIAL_DATA.lieferanten, lieferantenService, {
        requiredFields: [
            { field: "lieferantenNr", label: "Lieferantennummer" },
            { field: "firma", label: "Firma" }
        ]
    });
    const [abcFilter, setAbcFilter] = useState("");
    const [btsFilter, setBtsFilter] = useState("");

    const feldAendern = (feld, wert) => crud.setCurrentItem({ ...crud.currentItem, [feld]: wert });
    const durchschnitt = crud.allData.length
        ? (crud.allData.reduce((summe, item) => summe + Number(item.bewertung || 0), 0) / crud.allData.length).toFixed(1)
        : "–";
    const gefilterteDaten = useMemo(() => crud.data.filter(item => {
        if (abcFilter && item.abc !== abcFilter) return false;
        if (btsFilter === "mitBts" && !item.fuerBts) return false;
        if (btsFilter === "ohneBts" && item.fuerBts) return false;
        return true;
    }), [abcFilter, btsFilter, crud.data]);

    return <>
        <OverviewCards cards={[
            { label: "Lieferanten gesamt", value: crud.allData.length },
            { label: "Mit BTS-Bezug", value: crud.allData.filter(item => item.fuerBts).length },
            { label: "Ø Bewertung", value: durchschnitt, note: "von 5" }
        ]}/>
        <DataTable
            title={config.title}
            tableName={config.tableName}
            username={user.username}
            columns={getVisibleTableColumns(config.tableName)}
            allColumns={getAllTableColumns(config.tableName)}
            data={gefilterteDaten}
            searchable
            onSearch={crud.setSearch}
            filters={[
                {
                    name: "abc",
                    label: "ABC",
                    options: [
                        { value: "A", label: "A-Lieferanten" },
                        { value: "B", label: "B-Lieferanten" },
                        { value: "C", label: "C-Lieferanten" },
                        { value: "Unbestimmt", label: "Unbestimmt" }
                    ]
                },
                {
                    name: "bts",
                    label: "BTS-Bezug",
                    options: [
                        { value: "mitBts", label: "Mit BTS-Bezug" },
                        { value: "ohneBts", label: "Ohne BTS-Bezug" }
                    ]
                }
            ]}
            onFilter={filters => {
                setAbcFilter(filters.abc || "");
                setBtsFilter(filters.bts || "");
            }}
            pageSize={crud.pageSize}
            onPageSizeChange={crud.setPageSize}
            toolbarActions={[{ name: "new", label: "Neuer Lieferant", permission: config.permissionCreate, onClick: crud.neu }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: crud.bearbeiten },
                { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: crud.loeschen }
            ]}
            focusRowId={searchParams.get("focus") || ""}
        />
        <Dialog open={crud.open} title={crud.editMode ? "Lieferant bearbeiten" : "Neuer Lieferant"} onClose={crud.handleClose}>
            <div><Label required glossaryKey="lieferantennummer">Lieferantennummer</Label><TextField value={crud.currentItem.lieferantenNr} onChange={wert => feldAendern("lieferantenNr", wert)}/></div>
            <div><Label required>Firma</Label><TextField value={crud.currentItem.firma} onChange={wert => feldAendern("firma", wert)}/></div>
            <div><Label>Anschrift</Label><TextField value={crud.currentItem.anschrift || ""} onChange={wert => feldAendern("anschrift", wert)}/></div>
            <div><Label>PLZ</Label><TextField value={crud.currentItem.plz || ""} onChange={wert => feldAendern("plz", wert)}/></div>
            <div><Label>Ort</Label><TextField value={crud.currentItem.ort || ""} onChange={wert => feldAendern("ort", wert)}/></div>
            <div><Label>Bewertung (1–5)</Label><NumberField value={crud.currentItem.bewertung} min="1" max="5" onChange={wert => feldAendern("bewertung", Number(wert))}/></div>
            <div><Label glossaryKey="abc">ABC</Label><select value={crud.currentItem.abc || "Unbestimmt"} onChange={event => feldAendern("abc", event.target.value)}>
                <option value="Unbestimmt">Unbestimmt</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
            </select></div>
            <div className="form-row"><Label glossaryKey="segment">Segment</Label><TextArea rows={2} value={crud.currentItem.segment || ""} onChange={wert => feldAendern("segment", wert)}/></div>
            <div className="form-row"><Label>Für BTS</Label><TextArea rows={2} value={crud.currentItem.fuerBts || ""} onChange={wert => feldAendern("fuerBts", wert)}/></div>
            <div className="form-row">
                {crud.error && <p className="form-error">{crud.error}</p>}
                <button type="button" onClick={crud.speichern}>Speichern</button>
            </div>
        </Dialog>
    </>;
}

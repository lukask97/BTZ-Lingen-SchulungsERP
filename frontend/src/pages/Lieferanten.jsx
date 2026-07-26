import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import TextField from "../components/form/TextField";
import NumberField from "../components/form/NumberField";
import Checkbox from "../components/form/Checkbox";
import Label from "../components/form/Label";
import TextArea from "../components/form/TextArea";
import { getAllColumns, getColumns } from "../services/metadataService";
import lieferantenService from "../services/lieferantenService";
import { INITIAL_DATA, PAGE_CONFIG } from "../constants/schemas";
import { useCRUDPage } from "../hooks/useCRUDPage";
import useAuth from "../auth/useAuth";
import OverviewCards from "../components/OverviewCards";
import { useState } from "react";

export default function Lieferanten() {
    const { user } = useAuth();
    const config = PAGE_CONFIG.lieferanten;
    const crud = useCRUDPage(config.tableName, INITIAL_DATA.lieferanten, lieferantenService);
    const [statusFilter, setStatusFilter] = useState("");

    const feldAendern = (feld, wert) => crud.setCurrentItem({ ...crud.currentItem, [feld]: wert });
    const aktiveLieferanten = crud.allData.filter(item => item.aktiv);
    const durchschnitt = aktiveLieferanten.length
        ? (aktiveLieferanten.reduce((summe, item) => summe + Number(item.bewertung || 0), 0) / aktiveLieferanten.length).toFixed(1)
        : "–";

    return <>
        <OverviewCards cards={[
            { label: "Lieferanten gesamt", value: crud.allData.length },
            { label: "Aktive Lieferanten", value: aktiveLieferanten.length },
            { label: "Ø Bewertung", value: durchschnitt, note: "von 5" }
        ]}/>
        <DataTable
            title={config.title}
            tableName={config.tableName}
            username={user.username}
            columns={getColumns(config.tableName, user.username)}
            allColumns={getAllColumns(config.tableName)}
            data={crud.data.filter(item => !statusFilter || (statusFilter === "aktiv" ? item.aktiv : !item.aktiv))}
            filters={[{ name: "aktiv", label: "Status", options: [{ value: "aktiv", label: "Aktiv" }, { value: "inaktiv", label: "Inaktiv" }] }]}
            onFilter={filters => setStatusFilter(filters.aktiv || "")}
            searchable
            onSearch={crud.setSearch}
            pageSize={crud.pageSize}
            onPageSizeChange={crud.setPageSize}
            toolbarActions={[{ name: "new", label: "Neuer Lieferant", permission: config.permissionCreate, onClick: crud.neu }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: crud.bearbeiten },
                { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: crud.loeschen }
            ]}
        />
        <Dialog open={crud.open} title={crud.editMode ? "Lieferant bearbeiten" : "Neuer Lieferant"} onClose={crud.handleClose}>
            <div><Label required>Lieferantennummer</Label><TextField value={crud.currentItem.lieferantenNr} onChange={wert => feldAendern("lieferantenNr", wert)}/></div>
            <div><Label required>Firma</Label><TextField value={crud.currentItem.firma} onChange={wert => feldAendern("firma", wert)}/></div>
            <div><Label>Anschrift</Label><TextField value={crud.currentItem.anschrift || ""} onChange={wert => feldAendern("anschrift", wert)}/></div>
            <div><Label>PLZ</Label><TextField value={crud.currentItem.plz || ""} onChange={wert => feldAendern("plz", wert)}/></div>
            <div><Label>Ort</Label><TextField value={crud.currentItem.ort || ""} onChange={wert => feldAendern("ort", wert)}/></div>
            <div><Label>Bewertung (1–5)</Label><NumberField value={crud.currentItem.bewertung} min="1" max="5" onChange={wert => feldAendern("bewertung", Number(wert))}/></div>
            <div className="form-row"><Label>Segment</Label><TextArea rows={2} value={crud.currentItem.segment || ""} onChange={wert => feldAendern("segment", wert)}/></div>
            <div className="form-row"><Label>Für BTS</Label><TextArea rows={2} value={crud.currentItem.fuerBts || ""} onChange={wert => feldAendern("fuerBts", wert)}/></div>
            <div><Checkbox checked={crud.currentItem.aktiv} onChange={wert => feldAendern("aktiv", wert)}>Aktiv</Checkbox></div>
            <div className="form-row"><button onClick={crud.speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

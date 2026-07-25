import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import TextField from "../components/form/TextField";
import TextArea from "../components/form/TextArea";
import OverviewCards from "../components/OverviewCards";
import marketingService from "../services/marketingService";

const heute = () => new Date().toISOString().slice(0, 10);
const leer = { typ: "Kampagne", titel: "", datum: "", status: "geplant", beschreibung: "" };

export default function Marketing() {
    const [aktionen, setAktionen] = useState(marketingService.getAll());
    const [offen, setOffen] = useState(false);
    const [bearbeiten, setBearbeiten] = useState(false);
    const [aktion, setAktion] = useState(leer);
    const [statusFilter, setStatusFilter] = useState("");
    const [typFilter, setTypFilter] = useState("");

    const neu = () => { setAktion({ ...leer, datum: heute() }); setBearbeiten(false); setOffen(true); };
    const editieren = item => { setAktion({ ...item }); setBearbeiten(true); setOffen(true); };
    const speichern = () => {
        if (!aktion.titel.trim()) return;
        if (bearbeiten) marketingService.update(aktion);
        else marketingService.add({ ...aktion, titel: aktion.titel.trim() });
        setAktionen(marketingService.getAll());
        setOffen(false);
    };
    const aendern = (feld, wert) => setAktion(vorherige => ({ ...vorherige, [feld]: wert }));
    const geplant = aktionen.filter(item => item.status === "geplant").length;
    const feedback = aktionen.filter(item => item.typ === "Kundenfeedback").length;

    return <>
        <OverviewCards cards={[{ label: "Marketingaktionen", value: aktionen.length }, { label: "Geplant", value: geplant }, { label: "Kundenfeedback", value: feedback }]}/>
        <DataTable title="Marketing" selectableColumns={false}
            data={aktionen.filter(item => (!statusFilter || item.status === statusFilter) && (!typFilter || item.typ === typFilter))}
            columns={[{ field: "typ", title: "Art" }, { field: "titel", title: "Titel" }, { field: "datum", title: "Datum" }, { field: "status", title: "Status" }, { field: "beschreibung", title: "Beschreibung" }]}
            toolbarActions={[{ name: "new", label: "Neue Aktion", permission: "marketing.bearbeiten", onClick: neu }]}
            rowActions={[{ name: "edit", label: "Bearbeiten", permission: "marketing.bearbeiten", onClick: editieren }]}
            filters={[
                { name: "status", label: "Status", options: [{ value: "Entwurf", label: "Entwurf" }, { value: "geplant", label: "Geplant" }, { value: "läuft", label: "Läuft" }, { value: "durchgeführt", label: "Durchgeführt" }] },
                { name: "typ", label: "Art", options: ["Kampagne", "Kundenaktion", "Newsletter", "Event", "Kundenfeedback"].map(value => ({ value, label: value })) }
            ]}
            onFilter={filters => { setStatusFilter(filters.status || ""); setTypFilter(filters.typ || ""); }}
        />
        <Dialog open={offen} title={bearbeiten ? "Marketingaktion bearbeiten" : "Neue Marketingaktion"} onClose={() => setOffen(false)}>
            <div><Label>Art</Label><select value={aktion.typ} onChange={event => aendern("typ", event.target.value)}><option>Kampagne</option><option>Kundenaktion</option><option>Newsletter</option><option>Event</option><option>Kundenfeedback</option></select></div>
            <div><Label required>Titel</Label><TextField value={aktion.titel} onChange={wert => aendern("titel", wert)}/></div>
            <div><Label>Datum</Label><input type="date" value={aktion.datum} onChange={event => aendern("datum", event.target.value)}/></div>
            <div><Label>Status</Label><select value={aktion.status} onChange={event => aendern("status", event.target.value)}><option>Entwurf</option><option>geplant</option><option>läuft</option><option>durchgeführt</option></select></div>
            <div className="form-row"><Label>Beschreibung</Label><TextArea rows={3} value={aktion.beschreibung} onChange={wert => aendern("beschreibung", wert)}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

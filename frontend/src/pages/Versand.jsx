import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import TextField from "../components/form/TextField";
import OverviewCards from "../components/OverviewCards";
import versandService from "../services/versandService";

const today = "2026-07-26";

export default function Versand() {
    const [versand, setVersand] = useState(versandService.list());
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState({ versandNr: "", auftrag: "", kunde: "", datum: today, status: "in Vorbereitung", transport: "" });

    const speichern = () => {
        if (!current.auftrag.trim() || !current.kunde.trim()) return;
        versandService.create(current);
        setVersand(versandService.list());
        setOpen(false);
    };

    const versenden = (item) => {
        versandService.update({ ...item, status: "versendet" });
        setVersand(versandService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Versandaufträge", value: versand.length },
            { label: "In Vorbereitung", value: versand.filter(item => item.status === "in Vorbereitung").length },
            { label: "Versendet", value: versand.filter(item => item.status === "versendet").length }
        ]}/>
        <DataTable
            title="Versand"
            selectableColumns={false}
            data={versand}
            columns={[
                { field: "versandNr", title: "Versandnummer" },
                { field: "auftrag", title: "Auftrag" },
                { field: "kunde", title: "Kunde" },
                { field: "datum", title: "Datum" },
                { field: "transport", title: "Transport" },
                { field: "status", title: "Status" }
            ]}
            toolbarActions={[{ name: "new", label: "Versand anlegen", permission: "logistik.bearbeiten", onClick: () => setOpen(true), variant: "secondary" }]}
            rowActions={[{ name: "ship", label: "Als versendet markieren", permission: "logistik.bearbeiten", onClick: versenden, variant: "success", isVisible: row => row.status !== "versendet" }]}
        />
        <Dialog open={open} title="Versand anlegen" onClose={() => setOpen(false)}>
            <div><Label>Versandnummer</Label><TextField value={current.versandNr} onChange={value => setCurrent(item => ({ ...item, versandNr: value }))}/></div>
            <div><Label>Auftrag</Label><TextField value={current.auftrag} onChange={value => setCurrent(item => ({ ...item, auftrag: value }))}/></div>
            <div><Label>Kunde</Label><TextField value={current.kunde} onChange={value => setCurrent(item => ({ ...item, kunde: value }))}/></div>
            <div><Label>Transport</Label><TextField value={current.transport} onChange={value => setCurrent(item => ({ ...item, transport: value }))}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

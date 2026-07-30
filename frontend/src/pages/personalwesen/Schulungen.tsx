import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import schulungenService from "../../services/personalwesen/schulungenService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";

export default function Schulungen() {
    const [schulungen, setSchulungen] = useSyncedServiceData(["schulungen"], () => schulungenService.list());
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState({ titel: "", zielgruppe: "", datum: "2026-08-20", status: "geplant", ort: "" });

    const speichern = () => {
        if (!current.titel.trim()) return;
        schulungenService.create(current);
        setSchulungen(schulungenService.list());
        setOpen(false);
    };

    const starten = (schulung) => {
        schulungenService.update({ ...schulung, status: "läuft" });
        setSchulungen(schulungenService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Schulungen", value: schulungen.length },
            { label: "Geplant", value: schulungen.filter(item => item.status === "geplant").length },
            { label: "Läuft", value: schulungen.filter(item => item.status === "läuft").length }
        ]}/>
        <DataTable
            title="Schulungen"
            selectableColumns={false}
            data={schulungen}
            columns={[
                { field: "titel", title: "Titel" },
                { field: "zielgruppe", title: "Zielgruppe" },
                { field: "datum", title: "Datum" },
                { field: "ort", title: "Ort" },
                { field: "status", title: "Status" }
            ]}
            toolbarActions={[{ name: "new", label: "Schulung planen", permission: "personalwesen.bearbeiten", onClick: () => setOpen(true), variant: "secondary" }]}
            rowActions={[{ name: "start", label: "Als laufend markieren", permission: "personalwesen.bearbeiten", onClick: starten, variant: "success", isVisible: row => row.status === "geplant" }]}
        />
        <Dialog open={open} title="Schulung planen" onClose={() => setOpen(false)}>
            <div><Label>Titel</Label><TextField value={current.titel} onChange={value => setCurrent(item => ({ ...item, titel: value }))}/></div>
            <div><Label>Zielgruppe</Label><TextField value={current.zielgruppe} onChange={value => setCurrent(item => ({ ...item, zielgruppe: value }))}/></div>
            <div><Label>Ort</Label><TextField value={current.ort} onChange={value => setCurrent(item => ({ ...item, ort: value }))}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

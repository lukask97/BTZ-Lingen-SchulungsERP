import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import TextField from "../components/form/TextField";
import OverviewCards from "../components/OverviewCards";
import arbeitszeitenService from "../services/arbeitszeitenService";

const today = "2026-07-26";

export default function Arbeitszeiten() {
    const [eintraege, setEintraege] = useState(arbeitszeitenService.list());
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState({ mitarbeiter: "", datum: today, von: "08:00", bis: "16:00", status: "erfasst" });

    const speichern = () => {
        if (!current.mitarbeiter.trim()) return;
        arbeitszeitenService.create(current);
        setEintraege(arbeitszeitenService.list());
        setOpen(false);
    };

    const freigeben = (eintrag) => {
        arbeitszeitenService.update({ ...eintrag, status: "freigegeben" });
        setEintraege(arbeitszeitenService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Zeitbuchungen", value: eintraege.length },
            { label: "Erfasst", value: eintraege.filter(item => item.status === "erfasst").length },
            { label: "Freigegeben", value: eintraege.filter(item => item.status === "freigegeben").length }
        ]}/>
        <DataTable
            title="Arbeitszeiten"
            selectableColumns={false}
            data={eintraege}
            columns={[
                { field: "mitarbeiter", title: "Mitarbeiter" },
                { field: "datum", title: "Datum" },
                { field: "von", title: "Von" },
                { field: "bis", title: "Bis" },
                { field: "status", title: "Status" }
            ]}
            toolbarActions={[{ name: "new", label: "Zeit buchen", permission: "personalwesen.bearbeiten", onClick: () => setOpen(true), variant: "secondary" }]}
            rowActions={[{ name: "approve", label: "Freigeben", permission: "personalwesen.bearbeiten", onClick: freigeben, variant: "success", isVisible: row => row.status !== "freigegeben" }]}
        />
        <Dialog open={open} title="Arbeitszeit erfassen" onClose={() => setOpen(false)}>
            <div><Label>Mitarbeiter</Label><TextField value={current.mitarbeiter} onChange={value => setCurrent(item => ({ ...item, mitarbeiter: value }))}/></div>
            <div><Label>Von</Label><TextField type="time" value={current.von} onChange={value => setCurrent(item => ({ ...item, von: value }))}/></div>
            <div><Label>Bis</Label><TextField type="time" value={current.bis} onChange={value => setCurrent(item => ({ ...item, bis: value }))}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

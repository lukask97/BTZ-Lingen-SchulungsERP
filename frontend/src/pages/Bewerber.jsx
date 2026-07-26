import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import TextArea from "../components/form/TextArea";
import TextField from "../components/form/TextField";
import OverviewCards from "../components/OverviewCards";
import bewerberService from "../services/bewerberService";

const today = "2026-07-26";

export default function Bewerber() {
    const [bewerber, setBewerber] = useState(bewerberService.list());
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState({ name: "", stelle: "", datum: today, status: "eingegangen", notiz: "" });

    const speichern = () => {
        if (!current.name.trim()) return;
        bewerberService.create(current);
        setBewerber(bewerberService.list());
        setOpen(false);
    };

    const einladen = (item) => {
        bewerberService.update({ ...item, status: "eingeladen" });
        setBewerber(bewerberService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Bewerber", value: bewerber.length },
            { label: "Eingegangen", value: bewerber.filter(item => item.status === "eingegangen").length },
            { label: "Eingeladen", value: bewerber.filter(item => item.status === "eingeladen").length }
        ]}/>
        <DataTable
            title="Bewerber"
            selectableColumns={false}
            data={bewerber}
            columns={[
                { field: "name", title: "Name" },
                { field: "stelle", title: "Stelle" },
                { field: "datum", title: "Datum" },
                { field: "status", title: "Status" },
                { field: "notiz", title: "Notiz" }
            ]}
            toolbarActions={[{ name: "new", label: "Bewerber anlegen", permission: "personalwesen.bearbeiten", onClick: () => setOpen(true), variant: "secondary" }]}
            rowActions={[{ name: "invite", label: "Zum Gespräch einladen", permission: "personalwesen.bearbeiten", onClick: einladen, variant: "success", isVisible: row => row.status !== "eingeladen" }]}
        />
        <Dialog open={open} title="Bewerber anlegen" onClose={() => setOpen(false)}>
            <div><Label>Name</Label><TextField value={current.name} onChange={value => setCurrent(item => ({ ...item, name: value }))}/></div>
            <div><Label>Stelle</Label><TextField value={current.stelle} onChange={value => setCurrent(item => ({ ...item, stelle: value }))}/></div>
            <div className="form-row"><Label>Notiz</Label><TextArea rows={3} value={current.notiz} onChange={value => setCurrent(item => ({ ...item, notiz: value }))}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

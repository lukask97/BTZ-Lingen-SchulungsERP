import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import NumberField from "../components/form/NumberField";
import TextField from "../components/form/TextField";
import OverviewCards from "../components/OverviewCards";
import urlaubsantraegeService from "../services/urlaubsantraegeService";

export default function Urlaubsantraege() {
    const [antraege, setAntraege] = useState(urlaubsantraegeService.list());
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState({ mitarbeiter: "", von: "2026-08-17", bis: "2026-08-21", tage: 5, status: "offen" });

    const speichern = () => {
        if (!current.mitarbeiter.trim()) return;
        urlaubsantraegeService.create(current);
        setAntraege(urlaubsantraegeService.list());
        setOpen(false);
    };

    const genehmigen = (antrag) => {
        urlaubsantraegeService.update({ ...antrag, status: "genehmigt" });
        setAntraege(urlaubsantraegeService.list());
    };

    const ablehnen = (antrag) => {
        urlaubsantraegeService.update({ ...antrag, status: "abgelehnt" });
        setAntraege(urlaubsantraegeService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Urlaubsanträge", value: antraege.length },
            { label: "Offen", value: antraege.filter(item => item.status === "offen").length },
            { label: "Genehmigt", value: antraege.filter(item => item.status === "genehmigt").length }
        ]}/>
        <DataTable
            title="Urlaubsanträge"
            selectableColumns={false}
            data={antraege}
            columns={[
                { field: "mitarbeiter", title: "Mitarbeiter" },
                { field: "von", title: "Von" },
                { field: "bis", title: "Bis" },
                { field: "tage", title: "Tage" },
                { field: "status", title: "Status" }
            ]}
            toolbarActions={[{ name: "new", label: "Antrag anlegen", permission: "personalwesen.bearbeiten", onClick: () => setOpen(true), variant: "secondary" }]}
            rowActions={[
                { name: "approve", label: "Genehmigen", permission: "personalwesen.bearbeiten", onClick: genehmigen, variant: "success", isVisible: row => row.status === "offen" },
                { name: "reject", label: "Ablehnen", permission: "personalwesen.bearbeiten", onClick: ablehnen, variant: "danger", isVisible: row => row.status === "offen" }
            ]}
        />
        <Dialog open={open} title="Urlaubsantrag anlegen" onClose={() => setOpen(false)}>
            <div><Label>Mitarbeiter</Label><TextField value={current.mitarbeiter} onChange={value => setCurrent(item => ({ ...item, mitarbeiter: value }))}/></div>
            <div><Label>Von</Label><TextField type="date" value={current.von} onChange={value => setCurrent(item => ({ ...item, von: value }))}/></div>
            <div><Label>Bis</Label><TextField type="date" value={current.bis} onChange={value => setCurrent(item => ({ ...item, bis: value }))}/></div>
            <div><Label>Tage</Label><NumberField value={current.tage} min="1" onChange={value => setCurrent(item => ({ ...item, tage: Number(value) }))}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

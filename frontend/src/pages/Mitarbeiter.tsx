import { useNavigate } from "react-router-dom";
import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import TextField from "../components/form/TextField";
import OverviewCards from "../components/OverviewCards";
import mitarbeiterService from "../services/mitarbeiterService";

const today = "2026-07-26";

export default function Mitarbeiter() {
    const navigate = useNavigate();
    const [mitarbeiter, setMitarbeiter] = useState(mitarbeiterService.list());
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState({ name: "", abteilung: "", rolle: "", eintritt: today, status: "im Einsatz" });

    const speichern = () => {
        if (!current.name.trim()) return;
        mitarbeiterService.create(current);
        setMitarbeiter(mitarbeiterService.list());
        setOpen(false);
    };

    return <>
        <OverviewCards cards={[
            { label: "Mitarbeiter", value: mitarbeiter.length },
            { label: "Im Einsatz", value: mitarbeiter.filter(item => item.status === "im Einsatz").length },
            { label: "Abteilungen", value: new Set(mitarbeiter.map(item => item.abteilung)).size }
        ]}/>
        <DataTable
            title="Mitarbeiter"
            selectableColumns={false}
            data={mitarbeiter}
            columns={[
                { field: "name", title: "Name" },
                { field: "abteilung", title: "Abteilung" },
                { field: "rolle", title: "Rolle" },
                { field: "eintritt", title: "Eintritt" },
                { field: "status", title: "Status" }
            ]}
            toolbarActions={[{ name: "new", label: "Mitarbeiter anlegen", permission: "personalwesen.bearbeiten", onClick: () => setOpen(true), variant: "secondary" }]}
            rowActions={[{ name: "details", label: "Akte öffnen", permission: "personalwesen.bearbeiten", onClick: item => navigate(`/personalakte?mitarbeiter=${item.id}`), variant: "secondary" }]}
        />
        <Dialog open={open} title="Mitarbeiter anlegen" onClose={() => setOpen(false)}>
            <div><Label>Name</Label><TextField value={current.name} onChange={value => setCurrent(item => ({ ...item, name: value }))}/></div>
            <div><Label>Abteilung</Label><TextField value={current.abteilung} onChange={value => setCurrent(item => ({ ...item, abteilung: value }))}/></div>
            <div><Label>Rolle</Label><TextField value={current.rolle} onChange={value => setCurrent(item => ({ ...item, rolle: value }))}/></div>
            <div><Label>Eintritt</Label><TextField type="date" value={current.eintritt} onChange={value => setCurrent(item => ({ ...item, eintritt: value }))}/></div>
            <div><Label>Status</Label><select value={current.status} onChange={event => setCurrent(item => ({ ...item, status: event.target.value }))}>
                <option value="im Einsatz">Im Einsatz</option>
                <option value="in Einarbeitung">In Einarbeitung</option>
                <option value="beurlaubt">Beurlaubt</option>
            </select></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

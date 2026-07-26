import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import TextArea from "../components/form/TextArea";
import TextField from "../components/form/TextField";
import belegeService from "../services/belegeService";

const today = "2026-07-26";

export default function Belege() {
    const [belege, setBelege] = useState(belegeService.list());
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState({ typ: "Beleg", bezug: "", beschreibung: "" });
    const [editMode, setEditMode] = useState(false);

    const speichern = () => {
        if (!current.bezug.trim()) return;
        if (editMode) {
            belegeService.update({ ...current });
        } else {
            belegeService.create({ ...current, datum: today, status: "archiviert" });
        }
        setBelege(belegeService.list());
        setOpen(false);
        setEditMode(false);
        setCurrent({ typ: "Beleg", bezug: "", beschreibung: "" });
    };

    const bearbeiten = (beleg) => {
        setCurrent({ ...beleg });
        setEditMode(true);
        setOpen(true);
    };

    const loeschen = (beleg) => {
        belegeService.remove(beleg.id);
        setBelege(belegeService.list());
    };

    return <>
        <DataTable
            title="Belegarchiv"
            selectableColumns={false}
            data={belege}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "typ", title: "Typ" },
                { field: "bezug", title: "Bezug" },
                { field: "status", title: "Status" },
                { field: "beschreibung", title: "Beschreibung" }
            ]}
            toolbarActions={[{ name: "new", label: "Beleg archivieren", permission: "buchhaltung.bearbeiten", onClick: () => { setCurrent({ typ: "Beleg", bezug: "", beschreibung: "" }); setEditMode(false); setOpen(true); }, variant: "secondary" }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: "buchhaltung.bearbeiten", onClick: bearbeiten, variant: "secondary" },
                { name: "delete", label: "Löschen", permission: "buchhaltung.bearbeiten", onClick: loeschen, variant: "danger" }
            ]}
        />
        <Dialog open={open} title={editMode ? "Beleg bearbeiten" : "Beleg archivieren"} onClose={() => setOpen(false)}>
            <div><Label>Typ</Label><TextField value={current.typ} onChange={value => setCurrent(item => ({ ...item, typ: value }))}/></div>
            <div><Label>Bezug</Label><TextField value={current.bezug} onChange={value => setCurrent(item => ({ ...item, bezug: value }))}/></div>
            <div className="form-row"><Label>Beschreibung</Label><TextArea rows={3} value={current.beschreibung} onChange={value => setCurrent(item => ({ ...item, beschreibung: value }))}/></div>
            <div className="form-row"><button className={editMode ? "button-secondary" : ""} onClick={speichern}>{editMode ? "Änderungen speichern" : "Speichern"}</button></div>
        </Dialog>
    </>;
}

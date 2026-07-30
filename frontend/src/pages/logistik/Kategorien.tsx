// @ts-nocheck
import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import kategorienService from "../../services/logistik/kategorienService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

const INITIAL = { id: null, name: "", parentId: "", beschreibung: "" };

export default function Kategorien() {
    const syncTick = useStorageSyncRefresh(["kategorien"]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [search, setSearch] = useState("");
    const [currentItem, setCurrentItem] = useState(INITIAL);

    const kategorien = useMemo(() => kategorienService.list(), [refreshKey, syncTick]);
    const oberkategorien = kategorien.filter(item => String(item.id) !== String(currentItem.id));
    const parentOptions = oberkategorien.map(item => ({
        value: String(item.id),
        label: item.pfad
    }));

    const data = kategorien.filter(item =>
        !search || Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
    );

    const neu = () => {
        setCurrentItem(INITIAL);
        setEditMode(false);
        setOpen(true);
    };

    const bearbeiten = (row) => {
        setCurrentItem({
            id: row.id,
            name: row.name,
            parentId: row.parentId || "",
            beschreibung: row.beschreibung || ""
        });
        setEditMode(true);
        setOpen(true);
    };

    const loeschen = (row) => {
        if (kategorien.some(item => String(item.parentId) === String(row.id))) {
            alert("Diese Kategorie hat Unterkategorien und kann erst danach geloescht werden.");
            return;
        }
        kategorienService.remove(row.id);
        setRefreshKey(value => value + 1);
    };

    const speichern = () => {
        if (!currentItem.name.trim()) return;
        const payload = {
            ...currentItem,
            name: currentItem.name.trim(),
            parentId: currentItem.parentId || "",
            beschreibung: currentItem.beschreibung || ""
        };

        if (editMode) kategorienService.update(currentItem.id, payload);
        else kategorienService.create(payload);

        setRefreshKey(value => value + 1);
        setOpen(false);
    };

    return <>
        <h1>Kategorien</h1>
        <p>Hier lassen sich Oberkategorien und Unterkategorien fuer Artikel pflegen. So kann zum Beispiel `Fahrradkette` als Unterkategorie von `Mechanik` angelegt werden.</p>
        <DataTable
            title="Kategorien"
            data={data}
            searchable
            onSearch={setSearch}
            selectableColumns={false}
            columns={[
                { field: "name", title: "Kategorie" },
                { field: "parentName", title: "Oberkategorie" },
                { field: "pfad", title: "Pfad" }
            ]}
            toolbarActions={[{ name: "new", label: "Neue Kategorie", permission: "artikel.bearbeiten", onClick: neu }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: "artikel.bearbeiten", onClick: bearbeiten },
                { name: "delete", label: "Loeschen", permission: "artikel.bearbeiten", onClick: loeschen }
            ]}
        />
        <Dialog open={open} title={editMode ? "Kategorie bearbeiten" : "Neue Kategorie"} onClose={() => setOpen(false)}>
            <div><Label required>Name</Label><TextField value={currentItem.name} onChange={value => setCurrentItem(item => ({ ...item, name: value }))}/></div>
            <div><Label>Oberkategorie</Label><LookupField value={currentItem.parentId} options={parentOptions} onChange={value => setCurrentItem(item => ({ ...item, parentId: value }))} placeholder="Optional Oberkategorie waehlen..."/></div>
            <div className="form-row"><Label>Beschreibung</Label><TextArea rows={3} value={currentItem.beschreibung} onChange={value => setCurrentItem(item => ({ ...item, beschreibung: value }))}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import kategorienService from "../../services/logistik/kategorienService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";
import { PERMISSIONS } from "../../constants/permissions";
import useAuth from "../../auth/useAuth";
import { getAllTableColumns, getVisibleTableColumns } from "../../constants/schemas";

function createEmptyKategorie() {
    return { id: null, name: "", parentId: "", beschreibung: "" };
}

export default function Kategorien() {
    const { user } = useAuth();
    const syncTick = useStorageSyncRefresh(["kategorien"]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [search, setSearch] = useState("");
    const [currentItem, setCurrentItem] = useState(createEmptyKategorie());
    const [fehler, setFehler] = useState("");

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
        setFehler("");
        setCurrentItem(createEmptyKategorie());
        setEditMode(false);
        setOpen(true);
    };

    const bearbeiten = (row) => {
        setFehler("");
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
        if (!currentItem.name.trim()) {
            setFehler("Bitte das Pflichtfeld Name ausfuellen.");
            return;
        }
        const payload = {
            ...currentItem,
            name: currentItem.name.trim(),
            parentId: currentItem.parentId || "",
            beschreibung: currentItem.beschreibung || ""
        };

        if (editMode) kategorienService.update(currentItem.id, payload);
        else kategorienService.create(payload);

        setFehler("");
        setRefreshKey(value => value + 1);
        setOpen(false);
    };

    return <>
        <h1>Kategorien</h1>
        <p>Hier lassen sich Oberkategorien und Unterkategorien fuer Artikel pflegen. So kann zum Beispiel `Fahrradkette` als Unterkategorie von `Mechanik` angelegt werden.</p>
        <DataTable
            title="Kategorien"
            tableName="kategorien"
            username={user.username}
            data={data}
            searchable
            onSearch={setSearch}
            columns={getVisibleTableColumns("kategorien")}
            allColumns={getAllTableColumns("kategorien")}
            toolbarActions={[{ name: "new", label: "Neue Kategorie", permission: PERMISSIONS.ARTIKEL_BEARBEITEN, onClick: neu }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: PERMISSIONS.ARTIKEL_BEARBEITEN, onClick: bearbeiten },
                { name: "delete", label: "Loeschen", permission: PERMISSIONS.ARTIKEL_BEARBEITEN, onClick: loeschen }
            ]}
        />
        <Dialog open={open} title={editMode ? "Kategorie bearbeiten" : "Neue Kategorie"} onClose={() => {
            setFehler("");
            setOpen(false);
        }}>
            <div><Label required>Name</Label><TextField value={currentItem.name} onChange={value => {
                setFehler("");
                setCurrentItem(item => ({ ...item, name: value }));
            }}/></div>
            <div><Label>Oberkategorie</Label><LookupField value={currentItem.parentId} options={parentOptions} onChange={value => {
                setFehler("");
                setCurrentItem(item => ({ ...item, parentId: value }));
            }} placeholder="Optional Oberkategorie waehlen..."/></div>
            <div className="form-row"><Label>Beschreibung</Label><TextArea rows={3} value={currentItem.beschreibung} onChange={value => {
                setFehler("");
                setCurrentItem(item => ({ ...item, beschreibung: value }));
            }}/></div>
            <div className="form-row">
                {fehler && <p className="form-error">{fehler}</p>}
                <button onClick={speichern}>Speichern</button>
            </div>
        </Dialog>
    </>;
}

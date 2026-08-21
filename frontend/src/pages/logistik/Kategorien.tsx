import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import SaveButton from "../../components/SaveButton";
import kategorienService from "../../services/logistik/kategorienService";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";
import { PERMISSIONS } from "../../constants/permissions";
import useAuth from "../../auth/useAuth";
import { getAllTableColumns, getVisibleTableColumns } from "../../constants/schemas";

function createEmptyKategorie() {
    return { id: null, name: "", parentId: "", beschreibung: "" };
}

function buildCategoryTree(kategorien) {
    const byParent = new Map();

    kategorien.forEach(item => {
        const key = String(item.parentId || "");
        const list = byParent.get(key) || [];
        list.push(item);
        byParent.set(key, list);
    });

    const sortItems = (items = []) => [...items].sort((a, b) => a.name.localeCompare(b.name, "de"));

    const buildNode = item => ({
        ...item,
        children: sortItems(byParent.get(String(item.id))).map(buildNode)
    });

    return sortItems(byParent.get("")).map(buildNode);
}

function KategorienTreeList({ nodes }) {
    if (!nodes.length) {
        return null;
    }

    return <ul className="kategorien-simple-tree">
        {nodes.map(node => <li key={node.id}>
            {node.children.length > 0 ? <details className="kategorien-tree-node">
                <summary>
                    <span>{node.name}</span>
                    <small>{node.children.length} Unterkategorien</small>
                </summary>
                <KategorienTreeList nodes={node.children}/>
            </details> : <div className="kategorien-tree-leaf">
                <span>{node.name}</span>
                {node.beschreibung ? <small>{node.beschreibung}</small> : null}
            </div>}
        </li>)}
    </ul>;
}

export default function Kategorien() {
    const { user } = useAuth();
    const syncTick = useDataSyncRefresh(["kategorien"]);
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

    const data = kategorien
        .filter(item => !search || Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.sortName.localeCompare(b.sortName, "de"));

    const kategorienBaum = useMemo(() => buildCategoryTree(data), [data]);
    const oberkategorieCount = kategorien.filter(item => item.istOberkategorie).length;
    const unterkategorieCount = kategorien.length - oberkategorieCount;

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
            alert("Diese Kategorie hat Unterkategorien und kann erst danach gelöscht werden.");
            return;
        }
        kategorienService.remove(row.id);
        setRefreshKey(value => value + 1);
    };

    const speichern = () => {
        if (!currentItem.name.trim()) {
            setFehler("Bitte das Pflichtfeld Name ausfllen.");
            return false;
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
        return true;
    };

    return <>
        <h1>Kategorien</h1>
        <p>Die Kategorien sind jetzt klarer nach Hauptbereichen gruppiert. So sieht man schneller, welche Unterkategorien zu Fahrrädern, Bekleidung, Zubehör oder Mechanik gehören.</p>

        <div className="kennzahlen">
            <div className="kennzahl"><span>Hauptkategorien</span><strong>{oberkategorieCount}</strong></div>
            <div className="kennzahl"><span>Unterkategorien</span><strong>{unterkategorieCount}</strong></div>
            <div className="kennzahl"><span>Kategorien gesamt</span><strong>{kategorien.length}</strong></div>
        </div>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Kategorienbaum</h2>
                <span>Bei Bedarf aufklappen</span>
            </div>
            <details className="kategorien-tree-panel">
                <summary>Kategorienbaum anzeigen</summary>
                <div className="kategorien-tree">
                    {kategorienBaum.length === 0 ? <p>Keine Kategorien gefunden.</p> : <KategorienTreeList nodes={kategorienBaum}/>}
                </div>
            </details>
        </section>

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
                { name: "delete", label: "Löschen", permission: PERMISSIONS.ARTIKEL_BEARBEITEN, onClick: loeschen }
            ]}
        />
        <Dialog
            open={open}
            title={editMode ? "Kategorie bearbeiten" : "Neue Kategorie"}
            onClose={() => {
                setFehler("");
                setOpen(false);
            }}
            footer={<SaveButton onSave={speichern} onSuccess={() => setOpen(false)}>Speichern</SaveButton>}
        >
            <div><Label required>Name</Label><TextField value={currentItem.name} onChange={value => {
                setFehler("");
                setCurrentItem(item => ({ ...item, name: value }));
            }}/></div>
            <div><Label>Oberkategorie</Label><LookupField value={currentItem.parentId} options={parentOptions} onChange={value => {
                setFehler("");
                setCurrentItem(item => ({ ...item, parentId: value }));
            }} placeholder="Optional Oberkategorie wählen..."/></div>
            <div className="form-row"><Label>Beschreibung</Label><TextArea rows={3} value={currentItem.beschreibung} onChange={value => {
                setFehler("");
                setCurrentItem(item => ({ ...item, beschreibung: value }));
            }}/></div>
            <div className="form-row">{fehler && <p className="form-error">{fehler}</p>}</div>
        </Dialog>
    </>;
}

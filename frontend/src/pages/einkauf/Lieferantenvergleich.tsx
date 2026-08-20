import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import OverviewCards from "../../components/OverviewCards";
import SaveButton from "../../components/SaveButton";
import { PERMISSIONS } from "../../constants/permissions";
import { INITIAL_DATA } from "../../constants/schemas";
import artikelService from "../../services/logistik/artikelService";
import lieferantenService from "../../services/einkauf/lieferantenService";
import lieferantenArtikelStaffelnService from "../../services/einkauf/lieferantenArtikelStaffelnService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

function createDraft() {
    return {
        artikelId: "",
        lieferantId: "",
        staffeln: [{ ...INITIAL_DATA.lieferantenArtikelStaffeln }],
        fehler: ""
    };
}

export default function Lieferantenvergleich() {
    const navigate = useNavigate();
    const syncTick = useStorageSyncRefresh(["lieferanten", "artikel", "lieferantenArtikelStaffeln"]);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [draft, setDraft] = useState(createDraft());
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);

    const lieferanten = useMemo(() => lieferantenService.list(), [syncTick]);
    const artikel = useMemo(() => artikelService.getAll(), [syncTick]);
    const staffelGruppen = useMemo(
        () => lieferantenArtikelStaffelnService.listGrouped(artikel, lieferanten),
        [artikel, lieferanten, syncTick]
    );

    const artikelOptionen = artikel
        .filter(item => item.istEinkaufbar !== false)
        .map(item => ({ value: String(item.id), label: `${item.artikelNr} - ${item.name}` }));
    const lieferantenOptionen = lieferanten.map(item => ({ value: String(item.id), label: `${item.lieferantenNr} - ${item.firma}` }));

    const sichtbareDaten = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return staffelGruppen;
        return staffelGruppen.filter(item =>
            [item.artikelNr, item.artikel, item.lieferantenNr, item.lieferant, item.staffeltext]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [search, staffelGruppen]);

    const besterPreis = staffelGruppen.reduce((min, gruppe) => {
        const lokalesMin = gruppe.staffeln.reduce((innerMin, staffel) => Math.min(innerMin, Number(staffel.stueckpreis || 0)), Number.POSITIVE_INFINITY);
        return Math.min(min, lokalesMin);
    }, Number.POSITIVE_INFINITY);

    const dialogZuruecksetzen = () => {
        setDraft(createDraft());
        setEditMode(false);
        setOpen(false);
    };

    const neu = () => {
        setDraft(createDraft());
        setEditMode(false);
        setOpen(true);
    };

    const bearbeiten = gruppe => {
        setDraft({
            artikelId: String(gruppe.artikelId || ""),
            lieferantId: String(gruppe.lieferantId || ""),
            staffeln: gruppe.staffeln.map(item => ({
                id: item.id,
                artikelId: item.artikelId,
                lieferantId: item.lieferantId,
                mindestbestellmenge: Number(item.mindestbestellmenge || 1),
                stueckpreis: Number(item.stueckpreis || 0)
            })),
            fehler: ""
        });
        setEditMode(true);
        setOpen(true);
    };

    const loeschen = gruppe => {
        if (!confirm(`Möchten Sie alle Staffelungen für ${gruppe.artikel} bei ${gruppe.lieferant} wirklich löschen?`)) {
            return;
        }
        gruppe.staffeln.forEach(item => {
            if (item.id != null) {
                lieferantenArtikelStaffelnService.remove(item.id);
            }
        });
    };

    const addStaffel = () => {
        setDraft(current => ({
            ...current,
            staffeln: [...current.staffeln, { ...INITIAL_DATA.lieferantenArtikelStaffeln }]
        }));
    };

    const updateStaffel = (index, feld, wert) => {
        setDraft(current => ({
            ...current,
            staffeln: current.staffeln.map((item, staffelIndex) => staffelIndex === index ? { ...item, [feld]: wert } : item),
            fehler: ""
        }));
    };

    const removeStaffel = index => {
        setDraft(current => ({
            ...current,
            staffeln: current.staffeln.filter((_, staffelIndex) => staffelIndex !== index),
            fehler: ""
        }));
    };

    const speichern = () => {
        const staffeln = draft.staffeln
            .map(item => ({
                ...item,
                mindestbestellmenge: Number(item.mindestbestellmenge || 0),
                stueckpreis: Number(item.stueckpreis || 0)
            }))
            .filter(item => item.mindestbestellmenge > 0 || item.stueckpreis > 0);

        if (!draft.artikelId || !draft.lieferantId) {
            setDraft(current => ({ ...current, fehler: "Bitte einen Artikel und einen Lieferanten auswählen." }));
            return false;
        }

        if (staffeln.length === 0) {
            setDraft(current => ({ ...current, fehler: "Bitte mindestens eine gültige Staffelung hinterlegen." }));
            return false;
        }

        if (staffeln.some(item => Number(item.mindestbestellmenge || 0) <= 0)) {
            setDraft(current => ({ ...current, fehler: "Die Mindestbestellmenge muss größer als 0 sein." }));
            return false;
        }

        if (staffeln.some(item => Number(item.stueckpreis || 0) < 0)) {
            setDraft(current => ({ ...current, fehler: "Der Stückpreis darf nicht negativ sein." }));
            return false;
        }

        const sortierteStaffeln = [...staffeln].sort((a, b) => Number(a.mindestbestellmenge || 0) - Number(b.mindestbestellmenge || 0));
        lieferantenArtikelStaffelnService.replaceForPair(draft.artikelId, draft.lieferantId, sortierteStaffeln);
        dialogZuruecksetzen();
        return true;
    };

    return <>
        <OverviewCards cards={[
            { label: "Artikel-Lieferanten-Kombinationen", value: staffelGruppen.length },
            { label: "Hinterlegte Staffelzeilen", value: staffelGruppen.reduce((summe, item) => summe + item.staffeln.length, 0) },
            { label: "Bester Staffelpreis", value: Number.isFinite(besterPreis) ? `${besterPreis.toFixed(2)} EUR` : "-" }
        ]}/>
        <DataTable
            title="Lieferantenvergleich"
            selectableColumns={false}
            data={sichtbareDaten}
            searchable
            onSearch={setSearch}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            columns={[
                { field: "artikelNr", title: "Artikel-Nr." },
                { field: "artikel", title: "Artikel" },
                { field: "lieferant", title: "Lieferant" },
                { field: "staffeltext", title: "Staffelungen" }
            ]}
            toolbarActions={[
                { name: "new", label: "Neue Staffelung", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: neu }
            ]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: bearbeiten },
                { name: "new", label: "Anfrage starten", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: row => navigate(`/bestellungen?new=lieferantenvergleich&lieferantId=${row.lieferantId}`), variant: "secondary" },
                { name: "delete", label: "Löschen", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: loeschen, variant: "danger" }
            ]}
        />
        <Dialog
            open={open}
            title={editMode ? "Staffelungen bearbeiten" : "Neue Lieferantenstaffelung"}
            onClose={dialogZuruecksetzen}
            footer={<SaveButton onSave={speichern} onSuccess={dialogZuruecksetzen}>Speichern</SaveButton>}
        >
            <div>
                <Label required>Artikel</Label>
                <LookupField value={draft.artikelId} options={artikelOptionen} onChange={value => setDraft(current => ({ ...current, artikelId: value, fehler: "" }))} placeholder="Artikel suchen..."/>
            </div>
            <div>
                <Label required>Lieferant</Label>
                <LookupField value={draft.lieferantId} options={lieferantenOptionen} onChange={value => setDraft(current => ({ ...current, lieferantId: value, fehler: "" }))} placeholder="Lieferant suchen..."/>
            </div>
            <div className="form-row">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                    <Label>Staffelungen</Label>
                    <button type="button" onClick={addStaffel}>Staffel hinzufügen</button>
                </div>
                <div className="position-table-wrapper">
                    <table className="position-table">
                        <thead>
                            <tr>
                                <th>Mindestbestellmenge</th>
                                <th>Preis pro Stück</th>
                                <th>Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {draft.staffeln.map((staffel, index) => (
                                <tr key={staffel.id || `staffel-${index}`}>
                                    <td>
                                        <NumberField value={staffel.mindestbestellmenge} min="1" step="1" onChange={value => updateStaffel(index, "mindestbestellmenge", Number(value || 0))}/>
                                    </td>
                                    <td>
                                        <NumberField value={staffel.stueckpreis} min="0" step="0.01" onChange={value => updateStaffel(index, "stueckpreis", Number(value || 0))}/>
                                    </td>
                                    <td>
                                        <button type="button" className="link-button" onClick={() => removeStaffel(index)} disabled={draft.staffeln.length === 1}>
                                            Entfernen
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {draft.error && <p className="form-error">{draft.error}</p>}
        </Dialog>
    </>;
}

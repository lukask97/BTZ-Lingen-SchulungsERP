import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import TextField from "../../components/form/TextField";
import useAuth from "../../auth/useAuth";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import nummernkreiseService from "../../services/verwaltung/nummernkreiseService";
import { INITIAL_DATA } from "../../constants/schemas";
import { formatDocumentNumber, formatOfferNumber } from "../../services/core/documentNumbering";

function createBeispiel(row: any) {
    if (row.schluessel === "angebot") {
        return formatOfferNumber(formatDocumentNumber("angebot", 1, "2026-08-02"), 0);
    }
    if (row.schluessel === "auftrag") {
        return formatDocumentNumber("auftrag", 1, "2026-08-02");
    }
    if (row.schluessel === "rechnung") {
        return formatDocumentNumber("rechnung", 1, "2026-08-02");
    }
    if (row.schluessel === "lieferschein") {
        return formatDocumentNumber("lieferschein", 1, "2026-08-02");
    }
    if (row.schluessel === "bestellung") {
        return formatDocumentNumber("bestellung", 1, "2026-08-02");
    }
    if (row.schluessel === "gutschrift") {
        return formatDocumentNumber("gutschrift", 1, "2026-08-02");
    }
    if (row.schluessel === "mahnung") {
        return formatDocumentNumber("mahnung", 1, "2026-08-02");
    }
    if (row.schluessel === "zahlung") {
        return formatDocumentNumber("zahlung", 1, "2026-08-02");
    }
    return row.kuerzel || "-";
}

export default function Nummernkreise() {
    const { user } = useAuth();
    const [suchbegriff, setSuchbegriff] = useState("");
    const {
        data,
        open,
        editMode,
        currentItem,
        setCurrentItem,
        bearbeiten,
        speichern,
        handleClose,
        error
    } = useCRUDPage("nummernkreise", INITIAL_DATA.nummernkreise, nummernkreiseService as any, {
        requiredFields: [
            { field: "bezeichnung", label: "Bereich" },
            { field: "kuerzel", label: "Kuerzel" }
        ]
    });

    const columns = useMemo(() => [
        { field: "bezeichnung", title: "Bereich" },
        { field: "schluessel", title: "Schluessel" },
        { field: "kuerzel", title: "Kuerzel" },
        { field: "beispiel", title: "Beispiel", visible: false }
    ], []);
    const rows = useMemo(
        () => data
            .map(item => ({ ...item, beispiel: createBeispiel(item) }))
            .filter(item => !suchbegriff || Object.values(item).join(" ").toLowerCase().includes(suchbegriff.toLowerCase())),
        [data, suchbegriff]
    );

    return <>
        <DataTable
            title="Nummernkreise"
            tableName="nummernkreise"
            username={user.username}
            data={rows}
            columns={columns.filter(column => column.visible !== false)}
            allColumns={columns}
            searchable
            onSearch={setSuchbegriff}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: "benutzer.bearbeiten", onClick: bearbeiten }
            ]}
            page={1}
        />

        <Dialog open={open} title={editMode ? "Nummernkreis bearbeiten" : "Nummernkreis"} onClose={handleClose}>
            <Label required glossaryKey="nummernkreis">Bereich</Label>
            <TextField value={currentItem.bezeichnung} onChange={value => setCurrentItem({ ...currentItem, bezeichnung: value })}/>

            <Label glossaryKey="nummernkreis">Schluessel</Label>
            <TextField value={currentItem.schluessel} onChange={value => setCurrentItem({ ...currentItem, schluessel: value })} disabled/>

            <Label required glossaryKey="nummernkreis">Kuerzel</Label>
            <TextField value={currentItem.kuerzel} onChange={value => setCurrentItem({ ...currentItem, kuerzel: value.toUpperCase() })}/>

            <div className="form-row">
                <Label>Beispiel</Label>
                <strong>{createBeispiel(currentItem)}</strong>
            </div>

            <div className="form-row">
                {error && <p className="form-error">{error}</p>}
                <button type="button" onClick={speichern}>Speichern</button>
            </div>
        </Dialog>
    </>;
}

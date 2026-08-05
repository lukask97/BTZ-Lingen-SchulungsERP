import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import belegeService from "../../services/buchhaltung/belegeService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate } from "../../utils/dateTime";

export default function Belege() {
    const today = getBerlinDate();
    const [searchParams] = useSearchParams();
    const [belege, setBelege] = useSyncedServiceData(["belege", "auftraege", "bestellungen"], () => belegeService.list());
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState({ typ: "Rechnungskopie", bezugTyp: "Rechnung", rechnungId: "", bezug: "", beschreibung: "" });
    const [editMode, setEditMode] = useState(false);
    const [typFilter, setTypFilter] = useState("");
    const rechnungen = rechnungenService.list();
    const rechnungsOptionen = rechnungen.map(item => ({ value: item.rechnungsnr, label: `${item.rechnungsnr} - ${item.kunde}` }));
    const bezugFilter = searchParams.get("bezug") || "";
    const rechnungIdFilter = rechnungen.find(item => item.rechnungsnr === bezugFilter)?.id || "";

    const speichern = () => {
        if (current.bezugTyp === "Rechnung" && !current.rechnungId) return;
        if (current.bezugTyp !== "Rechnung" && !current.bezug.trim()) return;
        if (editMode) {
            belegeService.update({ ...current });
        } else {
            belegeService.create({ ...current, datum: today, status: "archiviert" });
        }
        setBelege(belegeService.list());
        setOpen(false);
        setEditMode(false);
        setCurrent({ typ: "Rechnungskopie", bezugTyp: "Rechnung", rechnungId: "", bezug: "", beschreibung: "" });
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

    const daten = useMemo(() => {
        let filtered = belege;
        if (bezugFilter) filtered = filtered.filter(item => item.bezug === bezugFilter || String(item.rechnungId) === String(rechnungIdFilter));
        if (typFilter) filtered = filtered.filter(item => item.typ === typFilter);
        return filtered;
    }, [belege, bezugFilter, rechnungIdFilter, typFilter]);

    const rechnungenMitBeleg = new Set(belege.filter(item => item.bezugTyp === "Rechnung").map(item => String(item.rechnungId || "")));
    const fehlendeBelege = rechnungen.filter(item => !rechnungenMitBeleg.has(String(item.id)));
    const versendet = daten.filter(item => item.status === "versendet").length;

    return <>
        <OverviewCards cards={[
            { label: "Belege gesamt", value: daten.length },
            { label: "Archiviert", value: daten.filter(item => item.status === "archiviert").length },
            { label: "Versendet", value: versendet },
            { label: "Rechnungen ohne Beleg", value: fehlendeBelege.length }
        ]}/>
        <DataTable
            title="Belegarchiv"
            selectableColumns={false}
            data={daten}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "typ", title: "Typ" },
                { field: "bezugTyp", title: "Bezugsart" },
                { field: "bezug", title: "Bezug", render: row => row.bezugTyp === "Rechnung" ? <Link className="detail-link" to={`/rechnungen?focus=${row.bezug}`}>{row.bezug}</Link> : row.bezug },
                { field: "status", title: "Status" },
                { field: "beschreibung", title: "Beschreibung" }
            ]}
            focusRowId={bezugFilter}
            focusField="bezug"
            detailLinkResolver={({ field, row }) => field === "bezug" && row.bezugTyp === "Rechnung" ? `/rechnungen?focus=${row.bezug}` : null}
            filters={[{
                name: "typ",
                label: "Typ",
                options: [
                    { value: "Rechnungskopie", label: "Rechnungskopie" },
                    { value: "Zahlungsbeleg", label: "Zahlungsbeleg" },
                    { value: "Mahnschreiben", label: "Mahnschreiben" }
                ]
            }]}
            onFilter={filters => setTypFilter(filters.typ || "")}
            toolbarActions={[{ name: "new", label: "Beleg archivieren", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: () => { setCurrent({ typ: "Rechnungskopie", bezugTyp: "Rechnung", rechnungId: rechnungIdFilter, bezug: bezugFilter, beschreibung: "" }); setEditMode(false); setOpen(true); }, variant: "secondary" }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: bearbeiten, variant: "secondary" },
                { name: "delete", label: "Löschen", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: loeschen, variant: "danger" }
            ]}
        />
        {fehlendeBelege.length > 0 && <section className="module-panel">
            <h2>Rechnungen ohne zugeordneten Beleg</h2>
            <ul className="module-list">
                {fehlendeBelege.map(item => <li key={item.rechnungsnr}><Link className="detail-link" to={`/belege?bezug=${item.rechnungsnr}`}>{item.rechnungsnr}</Link> – {item.kunde}</li>)}
            </ul>
        </section>}
        <Dialog open={open} title={editMode ? "Beleg bearbeiten" : "Beleg archivieren"} onClose={() => setOpen(false)}>
            <div><Label>Typ</Label><select value={current.typ} onChange={event => setCurrent(item => ({ ...item, typ: event.target.value }))}>
                <option value="Rechnungskopie">Rechnungskopie</option>
                <option value="Zahlungsbeleg">Zahlungsbeleg</option>
                <option value="Mahnschreiben">Mahnschreiben</option>
            </select></div>
            <div><Label glossaryKey="belegsart">Bezugsart</Label><select value={current.bezugTyp || "Rechnung"} onChange={event => setCurrent(item => ({
                ...item,
                bezugTyp: event.target.value,
                rechnungId: event.target.value === "Rechnung" ? item.rechnungId : "",
                bezug: event.target.value === "Rechnung" ? "" : item.bezug
            }))}>
                <option value="Rechnung">Rechnung</option>
                <option value="Sonstiges">Sonstiges</option>
            </select></div>
            <div><Label glossaryKey="belegbezug">Bezug</Label>{current.bezugTyp === "Rechnung"
                ? <LookupField value={current.rechnungId ? (rechnungen.find(item => String(item.id) === String(current.rechnungId))?.rechnungsnr || current.bezug) : current.bezug} options={rechnungsOptionen} onChange={value => {
                    const rechnung = rechnungen.find(item => item.rechnungsnr === value);
                    setCurrent(item => ({ ...item, rechnungId: rechnung?.id || "", bezug: value }));
                }} placeholder="Rechnung suchen..."/>
                : <TextField value={current.bezug} onChange={value => setCurrent(item => ({ ...item, bezug: value }))}/>}</div>
            <div className="form-row"><Label>Beschreibung</Label><TextArea rows={3} value={current.beschreibung} onChange={value => setCurrent(item => ({ ...item, beschreibung: value }))}/></div>
            <div className="form-row"><button type="button" className={editMode ? "button-secondary" : ""} onClick={speichern}>{editMode ? "Änderungen speichern" : "Speichern"}</button></div>
        </Dialog>
    </>;
}

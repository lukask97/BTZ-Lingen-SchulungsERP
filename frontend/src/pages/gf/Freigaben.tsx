import { Link } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import freigabenService from "../../services/gf/freigabenService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate } from "../../utils/dateTime";

const bereichOptionen = [
    { value: "verkauf", label: "Verkauf" },
    { value: "einkauf", label: "Einkauf" },
    { value: "buchhaltung", label: "Buchhaltung" },
    { value: "marketing", label: "Marketing" },
    { value: "logistik", label: "Logistik" },
    { value: "personalwesen", label: "Personalwesen" }
];

const bereichLinks = {
    verkauf: "/themen/verkauf",
    einkauf: "/themen/einkauf",
    buchhaltung: "/buchhaltung",
    marketing: "/marketing",
    logistik: "/logistik",
    personalwesen: "/personalwesen"
};

function createEmptyFreigabe(today: string) {
    return {
        titel: "",
        bereich: "verkauf",
        verantwortung: "Geschäftsführung",
        status: "offen",
        datum: today,
        bezug: "",
        notiz: ""
    };
}

export default function Freigaben() {
    const today = getBerlinDate();
    const [freigaben, setFreigaben] = useSyncedServiceData(["freigaben"], () => freigabenService.list());
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [current, setCurrent] = useState(createEmptyFreigabe(today));

    const neu = () => {
        setCurrent(createEmptyFreigabe(today));
        setEditMode(false);
        setOpen(true);
    };

    const bearbeiten = (item) => {
        setCurrent({ ...item, datum: item.datum || today, bezug: item.bezug || "", notiz: item.notiz || "" });
        setEditMode(true);
        setOpen(true);
    };

    const speichern = () => {
        if (!current.titel.trim()) return;
        const payload = {
            ...current,
            titel: current.titel.trim(),
            bezug: current.bezug.trim(),
            notiz: current.notiz.trim()
        };

        if (editMode) freigabenService.update(current.id, payload);
        else freigabenService.create(payload);

        setFreigaben(freigabenService.list());
        setOpen(false);
        setEditMode(false);
    };

    const freigeben = (item) => {
        freigabenService.update({ ...item, status: "freigegeben" });
        setFreigaben(freigabenService.list());
    };

    const ablehnen = (item) => {
        freigabenService.update({ ...item, status: "abgelehnt" });
        setFreigaben(freigabenService.list());
    };

    const loeschen = (item) => {
        freigabenService.remove(item.id);
        setFreigaben(freigabenService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Freigaben", value: freigaben.length },
            { label: "Offen", value: freigaben.filter(item => item.status === "offen").length },
            { label: "Freigegeben", value: freigaben.filter(item => item.status === "freigegeben").length },
            { label: "Abgelehnt", value: freigaben.filter(item => item.status === "abgelehnt").length }
        ]}/>
        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Freigaben im Unterricht</h2>
                    <span>Lehrkraftsicht</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Freigaben zeigen vereinfachte Führungsentscheidungen zu Rabatten, Aktionen oder Sonderfällen.</li>
                    <li>Die Entscheidung muss nicht komplex sein, aber begründet und sichtbar dokumentiert werden.</li>
                    <li>Idealerweise verweist jede Freigabe auf einen Vorgang aus Verkauf, Einkauf oder Marketing.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Schnelleinstiege</h2>
                    <span>Querverweise</span>
                </div>
                <div className="link-list">
                    <Link className="button-link" to="/geschaeftsfuehrung">Geschäftsführung</Link>
                    <Link className="button-link" to="/berichte">Berichte</Link>
                    <Link className="button-link" to="/themen/szenarien">Fallakten</Link>
                </div>
            </article>
        </section>
        <DataTable
            title="Freigaben"
            selectableColumns={false}
            data={freigaben}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "titel", title: "Vorgang" },
                { field: "bereich", title: "Bereich", render: row => bereichLinks[row.bereich] ? <Link className="detail-link" to={bereichLinks[row.bereich]}>{row.bereich}</Link> : row.bereich },
                { field: "bezug", title: "Bezug" },
                { field: "verantwortung", title: "Verantwortung" },
                { field: "status", title: "Status" },
                { field: "notiz", title: "Notiz" }
            ]}
            detailLinkResolver={({ field, row }) => field === "bereich" ? bereichLinks[row.bereich] || null : null}
            toolbarActions={[{ name: "new", label: "Freigabe anlegen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: PERMISSIONS.GF_BEARBEITEN, onClick: bearbeiten, variant: "secondary" },
                { name: "approve", label: "Freigeben", permission: PERMISSIONS.GF_BEARBEITEN, onClick: freigeben, variant: "success", isVisible: row => row.status === "offen" },
                { name: "reject", label: "Ablehnen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: ablehnen, variant: "danger", isVisible: row => row.status === "offen" },
                { name: "delete", label: "Löschen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: loeschen, variant: "danger" }
            ]}
        />
        <Dialog open={open} title={editMode ? "Freigabe bearbeiten" : "Freigabe anlegen"} onClose={() => setOpen(false)}>
            <div><Label>Titel</Label><TextField value={current.titel} onChange={value => setCurrent(item => ({ ...item, titel: value }))}/></div>
            <div><Label>Bereich</Label><select value={current.bereich} onChange={event => setCurrent(item => ({ ...item, bereich: event.target.value }))}>
                {bereichOptionen.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select></div>
            <div><Label>Verantwortung</Label><TextField value={current.verantwortung} onChange={value => setCurrent(item => ({ ...item, verantwortung: value }))}/></div>
            <div><Label>Datum</Label><TextField type="date" value={current.datum} onChange={value => setCurrent(item => ({ ...item, datum: value }))}/></div>
            <div><Label>Bezug</Label><TextField value={current.bezug} onChange={value => setCurrent(item => ({ ...item, bezug: value }))}/></div>
            <div><Label>Status</Label><select value={current.status} onChange={event => setCurrent(item => ({ ...item, status: event.target.value }))}>
                <option value="offen">offen</option>
                <option value="freigegeben">freigegeben</option>
                <option value="abgelehnt">abgelehnt</option>
            </select></div>
            <div className="form-row"><Label>Notiz</Label><TextArea rows={3} value={current.notiz} onChange={value => setCurrent(item => ({ ...item, notiz: value }))}/></div>
            <div className="form-row"><button onClick={speichern}>{editMode ? "Änderungen speichern" : "Speichern"}</button></div>
        </Dialog>
    </>;
}

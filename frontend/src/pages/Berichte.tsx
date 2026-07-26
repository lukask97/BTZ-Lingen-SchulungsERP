// @ts-nocheck
import { Link } from "react-router-dom";
import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import TextArea from "../components/form/TextArea";
import TextField from "../components/form/TextField";
import OverviewCards from "../components/OverviewCards";
import angeboteService from "../services/angeboteService";
import auftraegeService from "../services/auftraegeService";
import berichteService from "../services/berichteService";
import bestellungenService from "../services/bestellungenService";
import freigabenService from "../services/freigabenService";
import rechnungenService from "../services/rechnungenService";
import reklamationenService from "../services/reklamationenService";

const today = "2026-07-26";

const bereichLinks = {
    verkauf: "/themen/verkauf",
    logistik: "/logistik",
    einkauf: "/themen/einkauf",
    buchhaltung: "/buchhaltung",
    marketing: "/marketing",
    personalwesen: "/personalwesen"
};

function generiereZusammenfassung(bereich) {
    if (bereich === "verkauf") {
        const angebote = angeboteService.list().filter(item => !["angenommen", "abgelehnt"].includes(String(item.status || "").toLowerCase())).length;
        const auftraege = auftraegeService.list().filter(item => item.status === "offen").length;
        const reklamationen = reklamationenService.list().length;
        return `${angebote} offene Angebote, ${auftraege} offene Aufträge, ${reklamationen} Reklamationen.`;
    }
    if (bereich === "einkauf") {
        const bestellungen = bestellungenService.list().filter(item => item.status === "offen").length;
        return `${bestellungen} offene Bestellungen, Wareneingänge zur Prüfung offen.`;
    }
    if (bereich === "buchhaltung") {
        const rechnungen = rechnungenService.list().filter(item => item.status === "offen").length;
        return `${rechnungen} offene Rechnungen und mehrere mögliche Folgeaktionen in Zahlungen oder Mahnungen.`;
    }
    if (bereich === "logistik") {
        const auftraege = auftraegeService.list().filter(item => item.status === "offen").length;
        const bestellungen = bestellungenService.list().filter(item => item.status === "offen").length;
        return `${bestellungen} offene Wareneingänge, ${auftraege} Aufträge mit möglichem Versandbezug.`;
    }
    if (bereich === "marketing") {
        const freigaben = freigabenService.list().filter(item => item.bereich === "marketing" && item.status === "offen").length;
        return `${freigaben} offene marketingbezogene Freigaben, Aktionen können für Unterrichtsgespräche genutzt werden.`;
    }
    return "Bereichsbericht mit vereinfachter didaktischer Zusammenfassung.";
}

export default function Berichte() {
    const [berichte, setBerichte] = useState(berichteService.list());
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [current, setCurrent] = useState({
        titel: "",
        bereich: "verkauf",
        datum: today,
        status: "Entwurf",
        zielgruppe: "Lehrkraft",
        zusammenfassung: "",
        empfohlenAktion: ""
    });

    const neu = () => {
        setCurrent({
            titel: "",
            bereich: "verkauf",
            datum: today,
            status: "Entwurf",
            zielgruppe: "Lehrkraft",
            zusammenfassung: generiereZusammenfassung("verkauf"),
            empfohlenAktion: ""
        });
        setEditMode(false);
        setOpen(true);
    };

    const bearbeiten = (item) => {
        setCurrent({
            ...item,
            datum: item.datum || today,
            zielgruppe: item.zielgruppe || "Lehrkraft",
            empfohlenAktion: item.empfohlenAktion || ""
        });
        setEditMode(true);
        setOpen(true);
    };

    const speichern = () => {
        if (!current.titel.trim()) return;
        const payload = {
            ...current,
            titel: current.titel.trim(),
            zusammenfassung: current.zusammenfassung.trim(),
            empfohlenAktion: current.empfohlenAktion.trim()
        };

        if (editMode) berichteService.update(current.id, payload);
        else berichteService.create(payload);

        setBerichte(berichteService.list());
        setOpen(false);
        setEditMode(false);
    };

    const fertigstellen = (item) => {
        berichteService.update({ ...item, status: "fertig" });
        setBerichte(berichteService.list());
    };

    const loeschen = (item) => {
        berichteService.remove(item.id);
        setBerichte(berichteService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Berichte", value: berichte.length },
            { label: "Fertig", value: berichte.filter(item => item.status === "fertig").length },
            { label: "Entwürfe", value: berichte.filter(item => item.status !== "fertig").length }
        ]}/>
        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Berichte im Unterricht</h2>
                    <span>Lehrkraftsicht</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Berichte fassen einen Fachbereich knapp zusammen und helfen bei Reflexion oder Auswertung.</li>
                    <li>Sie müssen nicht vollständig sein, sondern sollen einen Unterrichtsanlass mit Zahlen und Hinweisen schaffen.</li>
                    <li>Eine empfohlene Folgeaktion macht den Bericht direkt für die Klasse nutzbar.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Schnelleinstiege</h2>
                    <span>Querverweise</span>
                </div>
                <div className="link-list">
                    <Link className="button-link" to="/geschaeftsfuehrung">Geschäftsführung</Link>
                    <Link className="button-link" to="/freigaben">Freigaben</Link>
                    <Link className="button-link" to="/">Dashboard</Link>
                </div>
            </article>
        </section>
        <DataTable
            title="Berichte"
            selectableColumns={false}
            data={berichte}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "titel", title: "Titel" },
                { field: "bereich", title: "Bereich", render: row => bereichLinks[row.bereich] ? <Link className="detail-link" to={bereichLinks[row.bereich]}>{row.bereich}</Link> : row.bereich },
                { field: "zielgruppe", title: "Zielgruppe" },
                { field: "status", title: "Status" },
                { field: "zusammenfassung", title: "Zusammenfassung" },
                { field: "empfohlenAktion", title: "Empfohlene Aktion" }
            ]}
            detailLinkResolver={({ field, row }) => field === "bereich" ? bereichLinks[row.bereich] || null : null}
            toolbarActions={[{ name: "new", label: "Bericht anlegen", permission: "gf.bearbeiten", onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: "gf.bearbeiten", onClick: bearbeiten, variant: "secondary" },
                { name: "done", label: "Fertigstellen", permission: "gf.bearbeiten", onClick: fertigstellen, variant: "success", isVisible: row => row.status !== "fertig" },
                { name: "delete", label: "Löschen", permission: "gf.bearbeiten", onClick: loeschen, variant: "danger" }
            ]}
        />
        <Dialog open={open} title={editMode ? "Bericht bearbeiten" : "Bericht anlegen"} onClose={() => setOpen(false)}>
            <div><Label>Titel</Label><TextField value={current.titel} onChange={value => setCurrent(item => ({ ...item, titel: value }))}/></div>
            <div><Label>Bereich</Label><select value={current.bereich} onChange={event => setCurrent(item => ({ ...item, bereich: event.target.value, zusammenfassung: generiereZusammenfassung(event.target.value) }))}>
                <option value="verkauf">Verkauf</option>
                <option value="einkauf">Einkauf</option>
                <option value="buchhaltung">Buchhaltung</option>
                <option value="logistik">Logistik</option>
                <option value="marketing">Marketing</option>
                <option value="personalwesen">Personalwesen</option>
            </select></div>
            <div><Label>Datum</Label><TextField type="date" value={current.datum} onChange={value => setCurrent(item => ({ ...item, datum: value }))}/></div>
            <div><Label>Zielgruppe</Label><select value={current.zielgruppe} onChange={event => setCurrent(item => ({ ...item, zielgruppe: event.target.value }))}>
                <option value="Lehrkraft">Lehrkraft</option>
                <option value="Klasse">Klasse</option>
                <option value="beide">Beide</option>
            </select></div>
            <div><Label>Status</Label><select value={current.status} onChange={event => setCurrent(item => ({ ...item, status: event.target.value }))}>
                <option value="Entwurf">Entwurf</option>
                <option value="fertig">fertig</option>
            </select></div>
            <div className="form-row"><Label>Zusammenfassung</Label><TextArea rows={4} value={current.zusammenfassung} onChange={value => setCurrent(item => ({ ...item, zusammenfassung: value }))}/></div>
            <div className="form-row"><Label>Empfohlene Aktion</Label><TextArea rows={3} value={current.empfohlenAktion} onChange={value => setCurrent(item => ({ ...item, empfohlenAktion: value }))}/></div>
            <div className="form-row"><button onClick={speichern}>{editMode ? "Änderungen speichern" : "Speichern"}</button></div>
        </Dialog>
    </>;
}

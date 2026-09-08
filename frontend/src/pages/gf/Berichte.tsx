import { Link } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import angeboteService from "../../services/verkauf/angeboteService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import berichteService from "../../services/gf/berichteService";
import bestellungenService, { getAutomatischeBedarfsmeldungen } from "../../services/einkauf/bestellungenService";
import freigabenService from "../../services/gf/freigabenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import reklamationenService from "../../services/verkauf/reklamationenService";
import artikelService from "../../services/logistik/artikelService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate } from "../../utils/dateTime";

const bereichLinks = {
    verkauf: "/themen/verkauf",
    logistik: "/logistik",
    einkauf: "/themen/einkauf",
    buchhaltung: "/buchhaltung",
    marketing: "/marketing",
    personalwesen: "/personalwesen"
};

const intervalDays = {
    Tag: 1,
    Woche: 7,
    Monat: 31,
    Quartal: 92,
    Jahr: 366
};

function createEmptyBericht(today: string) {
    return {
        id: "",
        titel: "",
        bereich: "verkauf",
        datum: today,
        status: "Entwurf",
        zielgruppe: "Lehrkraft",
        zusammenfassung: "",
        empfohlenAktion: "",
        startdatum: today,
        enddatum: today,
        intervall: "Tag"
    };
}

function isDateInRange(value: string, start: string, end: string) {
    if (!value) return false;
    return value >= start && value <= end;
}

function buildIntervalLabel(startdatum: string, enddatum: string, intervall: string) {
    return `${intervall} ${startdatum} bis ${enddatum}`;
}

function generateSummary(bereich: string, startdatum: string, enddatum: string) {
    if (bereich === "verkauf") {
        const angebote = angeboteService.list().filter(item => isDateInRange(item.datum, startdatum, enddatum)).length;
        const auftraege = auftraegeService.list().filter(item => isDateInRange(item.datum, startdatum, enddatum)).length;
        const reklamationen = reklamationenService.list().filter(item => isDateInRange(item.datum, startdatum, enddatum)).length;
        return `${angebote} Angebote, ${auftraege} Aufträge und ${reklamationen} Reklamationen im Zeitraum.`;
    }
    if (bereich === "einkauf") {
        const bestellungen = bestellungenService.list().filter(item => isDateInRange(item.datum, startdatum, enddatum));
        const bedarfe = getAutomatischeBedarfsmeldungen().length;
        return `${bestellungen.length} Bestellungen im Zeitraum, ${bedarfe} aktuelle Bedarfsmeldungen im Einkauf.`;
    }
    if (bereich === "buchhaltung") {
        const rechnungen = rechnungenService.list().filter(item => isDateInRange(item.datum, startdatum, enddatum));
        const offen = rechnungen.filter(item => item.status !== "bezahlt").length;
        return `${rechnungen.length} Rechnungen im Zeitraum, davon ${offen} offen.`;
    }
    if (bereich === "logistik") {
        const artikel = artikelService.getAll();
        const kritisch = artikel.filter(item => Number(item.bestand || 0) <= Number(item.bedarfsmeldungBei || 0)).length;
        const bestellungenImZulauf = bestellungenService.list().filter(item => ["angefragt", "bestaetigt", "versendet"].includes(String(item.status || "").toLowerCase())).length;
        return `${kritisch} kritische Artikelbestände und ${bestellungenImZulauf} nachbestellte Bestellungen.`;
    }
    if (bereich === "marketing") {
        const freigaben = freigabenService.list().filter(item => item.bereich === "marketing" && isDateInRange(item.datum, startdatum, enddatum)).length;
        return `${freigaben} marketingbezogene Freigaben im gewählten Zeitraum.`;
    }
    return "Vereinfachter Zeitraumbericht für Unterricht und Reflexion.";
}

function generateRecommendation(bereich: string) {
    if (bereich === "verkauf") return "Offene Vorgänge und Angebotslage mit der Klasse besprechen.";
    if (bereich === "einkauf") return "Bedarfsmeldungen priorisieren und Bestellungen weiterführen.";
    if (bereich === "buchhaltung") return "Offene Rechnungen mit Zahlungen und Mahnungen abgleichen.";
    if (bereich === "logistik") return "Kritische Bestände und Zulauf gemeinsam auswerten.";
    if (bereich === "marketing") return "Freigaben und Maßnahmen zeitlich einordnen.";
    return "Bericht im Unterricht als Reflexionsgrundlage nutzen.";
}

function suggestDateRange(intervall: string, today: string) {
    const days = intervalDays[intervall] || 1;
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(end.getDate() - (days - 1));
    return {
        startdatum: start.toISOString().slice(0, 10),
        enddatum: end.toISOString().slice(0, 10)
    };
}

export default function Berichte() {
    const today = getBerlinDate();
    const [berichte, setBerichte] = useSyncedServiceData(
        ["berichte", "angebote", "auftraege", "bestellungen", "freigaben", "reklamationen", "artikel"],
        () => berichteService.list()
    );
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [current, setCurrent] = useState(createEmptyBericht(today));

    const neu = () => {
        const range = suggestDateRange("Woche", today);
        setCurrent({
            ...createEmptyBericht(today),
            startdatum: range.startdatum,
            enddatum: range.enddatum,
            intervall: "Woche"
        });
        setEditMode(false);
        setOpen(true);
    };

    const bearbeiten = (item: any) => {
        setCurrent({
            ...item,
            datum: item.datum || today,
            zielgruppe: item.zielgruppe || "Lehrkraft",
            empfohlenAktion: item.empfohlenAktion || "",
            startdatum: item.startdatum || item.datum || today,
            enddatum: item.enddatum || item.datum || today,
            intervall: item.intervall || "Tag"
        });
        setEditMode(true);
        setOpen(true);
    };

    const berichtErzeugen = () => {
        if (!current.titel.trim() || !current.startdatum || !current.enddatum) return;
        const payload = {
            ...current,
            datum: today,
            titel: current.titel.trim(),
            zusammenfassung: generateSummary(current.bereich, current.startdatum, current.enddatum),
            empfohlenAktion: current.empfohlenAktion.trim() || generateRecommendation(current.bereich)
        };
        if (editMode) {
            berichteService.update(current.id, payload);
        } else {
            berichteService.create(payload);
        }
        setBerichte(berichteService.list());
        setOpen(false);
        setEditMode(false);
    };

    const fertigstellen = (item: any) => {
        berichteService.update({ ...item, status: "fertig" });
        setBerichte(berichteService.list());
    };

    const loeschen = (item: any) => {
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
                    <h2>Zeitraumberichte</h2>
                    <span>GF und Lehrkraft</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Berichte werden aus Startdatum, Enddatum und Intervall erzeugt und anschließend gespeichert.</li>
                    <li>Die Kennzahlen bleiben bewusst einfach, damit sie im Unterricht schnell nachvollziehbar sind.</li>
                    <li>Jeder gespeicherte Bericht bleibt bearbeitbar und kann später fertiggestellt werden.</li>
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
                    <button type="button" className="button-link" onClick={neu}>Neuen Bericht erzeugen</button>
                </div>
            </article>
        </section>
        <DataTable
            title="Berichte"
            selectableColumns={false}
            data={berichte}
            columns={[
                { field: "datum", title: "Erzeugt am" },
                { field: "titel", title: "Titel" },
                { field: "bereich", title: "Bereich", render: row => bereichLinks[row.bereich] ? <Link className="detail-link" to={bereichLinks[row.bereich]}>{row.bereich}</Link> : row.bereich },
                { field: "intervall", title: "Intervall" },
                { field: "startdatum", title: "Startdatum" },
                { field: "enddatum", title: "Enddatum" },
                { field: "zielgruppe", title: "Zielgruppe" },
                { field: "status", title: "Status" },
                { field: "zusammenfassung", title: "Zusammenfassung" }
            ]}
            detailLinkResolver={({ field, row }) => field === "bereich" ? bereichLinks[row.bereich] || null : null}
            toolbarActions={[{ name: "new", label: "Bericht erzeugen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: PERMISSIONS.GF_BEARBEITEN, onClick: bearbeiten, variant: "secondary" },
                { name: "done", label: "Fertigstellen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: fertigstellen, variant: "success", isVisible: row => row.status !== "fertig" },
                { name: "delete", label: "Löschen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: loeschen, variant: "danger" }
            ]}
        />
        <Dialog open={open} title={editMode ? "Bericht bearbeiten" : "Bericht erzeugen"} onClose={() => setOpen(false)}>
            <div><Label>Titel</Label><TextField value={current.titel} onChange={value => setCurrent(item => ({ ...item, titel: value }))}/></div>
            <div><Label>Bereich</Label><select value={current.bereich} onChange={event => setCurrent(item => ({ ...item, bereich: event.target.value }))}>
                <option value="verkauf">Verkauf</option>
                <option value="einkauf">Einkauf</option>
                <option value="buchhaltung">Buchhaltung</option>
                <option value="logistik">Logistik</option>
                <option value="marketing">Marketing</option>
                <option value="personalwesen">Personalwesen</option>
            </select></div>
            <div><Label>Intervall</Label><select value={current.intervall} onChange={event => {
                const intervall = event.target.value;
                const range = suggestDateRange(intervall, today);
                setCurrent(item => ({ ...item, intervall, startdatum: range.startdatum, enddatum: range.enddatum }));
            }}>
                <option value="Tag">Tag</option>
                <option value="Woche">Woche</option>
                <option value="Monat">Monat</option>
                <option value="Quartal">Quartal</option>
                <option value="Jahr">Jahr</option>
            </select></div>
            <div className="form-row">
                <div><Label>Startdatum</Label><TextField type="date" value={current.startdatum} onChange={value => setCurrent(item => ({ ...item, startdatum: value }))}/></div>
                <div><Label>Enddatum</Label><TextField type="date" value={current.enddatum} onChange={value => setCurrent(item => ({ ...item, enddatum: value }))}/></div>
            </div>
            <div><Label>Zielgruppe</Label><select value={current.zielgruppe} onChange={event => setCurrent(item => ({ ...item, zielgruppe: event.target.value }))}>
                <option value="Lehrkraft">Lehrkraft</option>
                <option value="Klasse">Klasse</option>
                <option value="beide">Beide</option>
            </select></div>
            <div><Label>Status</Label><select value={current.status} onChange={event => setCurrent(item => ({ ...item, status: event.target.value }))}>
                <option value="Entwurf">Entwurf</option>
                <option value="fertig">fertig</option>
            </select></div>
            <div className="form-row"><Label>Vorschau Zeitraum</Label><p>{buildIntervalLabel(current.startdatum, current.enddatum, current.intervall)}</p></div>
            <div className="form-row"><Label>Empfohlene Aktion</Label><TextArea rows={3} value={current.empfohlenAktion} onChange={value => setCurrent(item => ({ ...item, empfohlenAktion: value }))}/></div>
            <div className="form-row"><button type="button" onClick={berichtErzeugen}>{editMode ? "Bericht speichern" : "Bericht erzeugen und speichern"}</button></div>
        </Dialog>
    </>;
}

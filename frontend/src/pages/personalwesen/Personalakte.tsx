import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import SaveButton from "../../components/SaveButton";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import mitarbeiterService from "../../services/personalwesen/mitarbeiterService";
import personalaktenService from "../../services/personalwesen/personalaktenService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate } from "../../utils/dateTime";
const dokumentOptionen = [
    "Vertragsunterlage",
    "Urlaubsantrag",
    "Krankmeldung",
    "Abmahnung",
    "Onboarding-Checkliste",
    "Schulungsnachweis",
    "Personalnotiz"
];
const schnellvorlagen = [
    { typ: "Vertragsunterlage", titel: "Vertragsunterlage" },
    { typ: "Urlaubsantrag", titel: "Urlaubsantrag" },
    { typ: "Krankmeldung", titel: "Krankmeldung" },
    { typ: "Abmahnung", titel: "Abmahnung (simulativ)" },
    { typ: "Onboarding-Checkliste", titel: "Onboarding-Checkliste" }
];

function createPersonalakteEintrag(mitarbeiterId: string, today: string) {
    return {
        mitarbeiterId,
        dokumentTyp: "Vertragsunterlage",
        titel: "",
        datum: today,
        status: "archiviert",
        notiz: ""
    };
}

function createVorlagenEintrag(
    dokumentTyp: string,
    titel: string,
    mitarbeiterId: string,
    mitarbeiterName: string | undefined,
    today: string
) {
    return {
        mitarbeiterId,
        dokumentTyp,
        titel: mitarbeiterName ? `${titel} ${mitarbeiterName}` : titel,
        datum: today,
        status: dokumentTyp === "Vertragsunterlage" ? "archiviert" : "offen",
        notiz: dokumentTyp === "Abmahnung" ? "Nur für Schulungszwecke / fiktiver Vorgang." : ""
    };
}

export default function Personalakte() {
    const today = getBerlinDate();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mitarbeiter = mitarbeiterService.list();
    const mitarbeiterOptionen = mitarbeiter.map(item => ({ value: String(item.id), label: `${item.name} - ${item.abteilung}` }));
    const initialMitarbeiterId = searchParams.get("mitarbeiter") || String(mitarbeiter[0]?.id || "");
    const [selectedMitarbeiterId, setSelectedMitarbeiterId] = useState(initialMitarbeiterId);
    const [akteneintraege, setAkteneintraege] = useSyncedServiceData(
        ["personalakten", "mitarbeiter", "urlaubsantraege", "krankmeldungen", "schulungen"],
        () => personalaktenService.list()
    );
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [current, setCurrent] = useState(createPersonalakteEintrag(initialMitarbeiterId, today));

    const selectedMitarbeiter = mitarbeiter.find(item => String(item.id) === String(selectedMitarbeiterId));
    const daten = useMemo(
        () => akteneintraege.filter(item => !selectedMitarbeiterId || String(item.mitarbeiterId) === String(selectedMitarbeiterId)),
        [akteneintraege, selectedMitarbeiterId]
    );

    const dokumenteOffen = daten.filter(item => item.status === "offen").length;
    const dokumenttypen = new Set(daten.map(item => item.dokumentTyp)).size;

    const mitarbeiterAuswaehlen = (value) => {
        setSelectedMitarbeiterId(value);
        navigate(`/personalakte?mitarbeiter=${value}`);
    };

    const formularNeu = () => {
        setCurrent(createPersonalakteEintrag(selectedMitarbeiterId || String(mitarbeiter[0]?.id || ""), today));
        setEditMode(false);
        setOpen(true);
    };

    const vorlageOeffnen = (dokumentTyp, titel) => {
        setCurrent(createVorlagenEintrag(
            dokumentTyp,
            titel,
            selectedMitarbeiterId || String(mitarbeiter[0]?.id || ""),
            selectedMitarbeiter?.name,
            today
        ));
        setEditMode(false);
        setOpen(true);
    };

    const speichern = () => {
        const person = mitarbeiter.find(item => String(item.id) === String(current.mitarbeiterId));
        if (!person || !current.titel.trim()) return false;

        const payload = {
            ...current,
            mitarbeiterId: Number(current.mitarbeiterId),
            titel: current.titel.trim(),
            notiz: current.notiz.trim()
        };

        if (editMode) {
            personalaktenService.update(current.id, payload);
        } else {
            personalaktenService.create(payload);
        }

        setAkteneintraege(personalaktenService.list());
        setSelectedMitarbeiterId(String(payload.mitarbeiterId));
        setEditMode(false);
        setCurrent(createPersonalakteEintrag(String(payload.mitarbeiterId), today));
        return true;
    };

    const bearbeiten = (eintrag) => {
        setCurrent({ ...eintrag, mitarbeiterId: String(eintrag.mitarbeiterId) });
        setEditMode(true);
        setOpen(true);
    };

    const loeschen = (eintrag) => {
        personalaktenService.remove(eintrag.id);
        setAkteneintraege(personalaktenService.list());
    };

    return <>
        <h1>Personalakte</h1>
        <p>Dokumenten- und Formularübersicht für Mitarbeiter, damit Personalprozesse und Aktenführung im Unterricht nachvollzogen werden können.</p>

        <section className="module-panel">
            <div className="personalakte-toolbar">
                <div className="personalakte-select">
                    <Label>Mitarbeiter auswählen</Label>
                    <LookupField value={selectedMitarbeiterId} options={mitarbeiterOptionen} onChange={mitarbeiterAuswaehlen} placeholder="Mitarbeiter suchen..."/>
                </div>
                <div className="personalakte-links">
                    <Link className="button-link" to="/mitarbeiter">Mitarbeiter öffnen</Link>
                    <Link className="button-link" to="/urlaubsantraege">Urlaubsanträge</Link>
                    <Link className="button-link" to="/krankmeldungen">Krankmeldungen</Link>
                    <Link className="button-link" to="/schulungen">Schulungen</Link>
                </div>
            </div>
            {selectedMitarbeiter && <div className="personalakte-summary">
                <div><span>Name</span><strong>{selectedMitarbeiter.name}</strong></div>
                <div><span>Abteilung</span><strong>{selectedMitarbeiter.abteilung}</strong></div>
                <div><span>Rolle</span><strong>{selectedMitarbeiter.rolle}</strong></div>
                <div><span>Status</span><strong>{selectedMitarbeiter.status}</strong></div>
            </div>}
        </section>

        <OverviewCards cards={[
            { label: "Akteinträge", value: daten.length },
            { label: "Offene Formulare", value: dokumenteOffen },
            { label: "Dokumenttypen", value: dokumenttypen }
        ]}/>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Schnellvorlagen</h2>
                <span>Formulare und Akteneinträge</span>
            </div>
            <div className="link-list">
                {schnellvorlagen.map(vorlage => <button
                    key={vorlage.typ}
                    type="button"
                    className="button-secondary"
                    onClick={() => vorlageOeffnen(vorlage.typ, vorlage.titel)}
                >
                    {vorlage.typ}
                </button>)}
            </div>
            <p className="module-hint">So lassen sich typische Personaldokumente im Unterricht schneller anlegen, ohne jedes Mal bei Null zu starten.</p>
        </section>

        <DataTable
            title="Personalakte und Formulare"
            selectableColumns={false}
            data={daten}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "dokumentTyp", title: "Dokumenttyp" },
                { field: "titel", title: "Titel" },
                { field: "status", title: "Status" },
                { field: "notiz", title: "Hinweis" }
            ]}
            toolbarActions={[{ name: "new", label: "Dokument hinterlegen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: formularNeu, variant: "secondary" }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: bearbeiten, variant: "secondary" },
                { name: "delete", label: "Löschen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: loeschen, variant: "danger" }
            ]}
        />

        <Dialog
            open={open}
            title={editMode ? "Akteintrag bearbeiten" : "Dokument oder Formular hinterlegen"}
            onClose={() => setOpen(false)}
            footer={<SaveButton onSave={speichern} onSuccess={() => setOpen(false)}>{editMode ? "Änderungen speichern" : "Speichern"}</SaveButton>}
        >
            <div><Label>Mitarbeiter</Label><LookupField value={current.mitarbeiterId} options={mitarbeiterOptionen} onChange={value => setCurrent(item => ({ ...item, mitarbeiterId: value }))} placeholder="Mitarbeiter suchen..."/></div>
            <div><Label>Dokumenttyp</Label><select value={current.dokumentTyp} onChange={event => setCurrent(item => ({ ...item, dokumentTyp: event.target.value }))}>
                {dokumentOptionen.map(item => <option key={item} value={item}>{item}</option>)}
            </select></div>
            <div><Label>Titel</Label><TextField value={current.titel} onChange={value => setCurrent(item => ({ ...item, titel: value }))}/></div>
            <div><Label>Datum</Label><TextField type="date" value={current.datum} onChange={value => setCurrent(item => ({ ...item, datum: value }))}/></div>
            <div><Label>Status</Label><select value={current.status} onChange={event => setCurrent(item => ({ ...item, status: event.target.value }))}>
                <option value="offen">Offen</option>
                <option value="archiviert">Archiviert</option>
                <option value="abgeschlossen">Abgeschlossen</option>
            </select></div>
            <div className="form-row"><Label>Hinweis</Label><TextArea rows={3} value={current.notiz} onChange={value => setCurrent(item => ({ ...item, notiz: value }))}/></div>
        </Dialog>
    </>;
}

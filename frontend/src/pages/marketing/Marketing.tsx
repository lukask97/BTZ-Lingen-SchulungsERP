import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import { PERMISSIONS } from "../../constants/permissions";
import Label from "../../components/form/Label";
import SaveButton from "../../components/SaveButton";
import TextField from "../../components/form/TextField";
import TextArea from "../../components/form/TextArea";
import ModuleOverview from "../../components/ModuleOverview";
import marketingService from "../../services/marketing/marketingService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import useAuth from "../../auth/useAuth";

const heute = () => new Date().toISOString().slice(0, 10);
const leer = { typ: "Kampagne", titel: "", datum: "", status: "geplant", beschreibung: "" };

export default function Marketing() {
    const { user } = useAuth();
    const [aktionen, setAktionen] = useSyncedServiceData(["marketingaktionen"], () => marketingService.getAll());
    const [offen, setOffen] = useState(false);
    const [bearbeiten, setBearbeiten] = useState(false);
    const [aktion, setAktion] = useState(leer);
    const [statusFilter, setStatusFilter] = useState("");
    const [typFilter, setTypFilter] = useState("");
    const [suchbegriff, setSuchbegriff] = useState("");
    const [fehler, setFehler] = useState("");

    const neu = () => { setAktion({ ...leer, datum: heute() }); setBearbeiten(false); setFehler(""); setOffen(true); };
    const editieren = item => { setAktion({ ...item }); setBearbeiten(true); setFehler(""); setOffen(true); };
    const speichern = () => {
        if (!aktion.titel.trim()) {
            setFehler("Bitte das Pflichtfeld Titel ausfüllen.");
            return false;
        }
        if (bearbeiten) marketingService.update(aktion);
        else marketingService.add({ ...aktion, titel: aktion.titel.trim() });
        setAktionen(marketingService.getAll());
        setFehler("");
        return true;
    };
    const aendern = (feld, wert) => {
        if (fehler) setFehler("");
        setAktion(vorherige => ({ ...vorherige, [feld]: wert }));
    };
    const geplant = aktionen.filter(item => item.status === "geplant").length;
    const feedback = aktionen.filter(item => item.typ === "Kundenfeedback").length;
    const gefilterteAktionen = aktionen
        .filter(item =>
            (!statusFilter || item.status === statusFilter) &&
            (!typFilter || item.typ === typFilter) &&
            (!suchbegriff || Object.values(item).join(" ").toLowerCase().includes(suchbegriff.toLowerCase()))
        );
    const marketingColumns = [
        { field: "typ", title: "Art" },
        { field: "titel", title: "Titel" },
        { field: "datum", title: "Datum" },
        { field: "status", title: "Status" },
        { field: "beschreibung", title: "Beschreibung", visible: false }
    ];

    return <ModuleOverview
        title="Marketing"
        intro="Modul für Kampagnen, Kundenaktionen, Newsletter, Events und Feedback. Die Seite soll zeigen, wie Marketingmaßnahmen geplant, dokumentiert und mit Vertrieb oder Kooperationen verknüpft werden."
        cards={[
            { label: "Marketingaktionen", value: aktionen.length },
            { label: "Geplant", value: geplant },
            { label: "Kundenfeedback", value: feedback },
        ]}
        panels={[
            {
                title: "Marketingaufgaben",
                badge: "Lernkette",
                items: [
                    "Kampagnen und Kundenaktionen zeitlich planen.",
                    "Newsletter oder Events als Maßnahmen dokumentieren.",
                    "Kundenfeedback erfassen und für den Vertrieb nutzbar machen.",
                    "Kooperationen als gemeinsame Aktion vorbereiten.",
                ],
            },
            {
                title: "Einstiege und Verknüpfungen",
                badge: "Präsentationssicht",
                items: [
                    "Marketing wirkt auf Kundenkommunikation und Angebotsprozesse.",
                    "Events und Aktionen können mit Szenarien oder Kooperationen verbunden werden.",
                ],
                links: [
                    { to: "/kunden", label: "Kunden öffnen" },
                    { to: "/kundenanfragen", label: "Kundenanfragen öffnen" },
                    { to: "/szenarien/kooperation", label: "Kooperation öffnen" },
                ],
            },
        ]}
    >
        <DataTable title="Marketing"
            tableName="marketingaktionen"
            username={user.username}
            data={gefilterteAktionen}
            columns={marketingColumns.filter(column => column.visible !== false)}
            allColumns={marketingColumns}
            searchable
            onSearch={setSuchbegriff}
            toolbarActions={[{ name: "new", label: "Neue Aktion", permission: PERMISSIONS.MARKETING_BEARBEITEN, onClick: neu, variant: "secondary" }]}
            rowActions={[{ name: "edit", label: "Bearbeiten", permission: PERMISSIONS.MARKETING_BEARBEITEN, onClick: editieren, variant: "secondary" }]}
            filters={[
                { name: "status", label: "Status", options: [{ value: "Entwurf", label: "Entwurf" }, { value: "geplant", label: "Geplant" }, { value: "läuft", label: "Läuft" }, { value: "durchgeführt", label: "Durchgeführt" }] },
                { name: "typ", label: "Art", options: ["Kampagne", "Kundenaktion", "Newsletter", "Event", "Kundenfeedback"].map(value => ({ value, label: value })) }
            ]}
            onFilter={filters => { setStatusFilter(filters.status || ""); setTypFilter(filters.typ || ""); }}
        />
        <Dialog
            open={offen}
            title={bearbeiten ? "Marketingaktion bearbeiten" : "Neue Marketingaktion"}
            onClose={() => { setOffen(false); setFehler(""); }}
            footer={<SaveButton onSave={speichern} onSuccess={() => { setOffen(false); setFehler(""); }}>Speichern</SaveButton>}
        >
            <div><Label>Art</Label><select name="marketing-art" value={aktion.typ} onChange={event => aendern("typ", event.target.value)}><option>Kampagne</option><option>Kundenaktion</option><option>Newsletter</option><option>Event</option><option>Kundenfeedback</option></select></div>
            <div><Label required>Titel</Label><TextField value={aktion.titel} onChange={wert => aendern("titel", wert)}/></div>
            <div><Label>Datum</Label><input name="marketing-datum" type="date" value={aktion.datum} onChange={event => aendern("datum", event.target.value)}/></div>
            <div><Label>Status</Label><select name="marketing-status" value={aktion.status} onChange={event => aendern("status", event.target.value)}><option>Entwurf</option><option>geplant</option><option>läuft</option><option>durchgeführt</option></select></div>
            <div className="form-row"><Label>Beschreibung</Label><TextArea rows={3} value={aktion.beschreibung} onChange={wert => aendern("beschreibung", wert)}/></div>
            <div className="form-row">
                {fehler && <p className="form-error">{fehler}</p>}
            </div>
        </Dialog>
    </ModuleOverview>;
}

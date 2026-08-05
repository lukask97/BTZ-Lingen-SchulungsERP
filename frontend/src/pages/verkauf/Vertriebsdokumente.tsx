import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import TextArea from "../../components/form/TextArea";
import OverviewCards from "../../components/OverviewCards";
import SalesFlowBar from "../../components/SalesFlowBar";
import auftraegeService from "../../services/verkauf/auftraegeService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import nachrichtenService from "../../services/verkauf/nachrichtenService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import angeboteService from "../../services/verkauf/angeboteService";
import { openDocumentPdf } from "../../utils/documentPdf";
import { getBerlinDate } from "../../utils/dateTime";
import { getConfirmationDocument, getProcessContextForDocument } from "../../utils/processFlow";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getLieferscheinnummer } from "../../services/core/documentNumbering";

const dokumentTypen = ["Auftragsbestaetigung", "Lieferschein", "Warenbegleitpapier", "Transportpapier"];
const AUFTRAGS_FILTER = [
    { value: "alle", label: "Alle Auftraege" },
    { value: "offen", label: "Nur offene Auftraege" },
    { value: "ohne_bestaetigung", label: "Ohne Auftragsbestaetigung" },
    { value: "bestaetigt", label: "Bestaetigung versendet" }
];
const euro = (value) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));

function berechneAuftragswert(positionen = []) {
    return positionen.reduce((sum, item) => sum + Number(item.menge || 0) * Number(item.einzelpreis || 0), 0);
}

function createDokumentTitel(dokumentTyp, auftrag) {
    if (!auftrag) return dokumentTyp;
    if (dokumentTyp === "Lieferschein") {
        return `${dokumentTyp} ${getLieferscheinnummer(auftrag.auftragNr, auftrag.datum)}`;
    }
    return `${dokumentTyp} ${auftrag.auftragNr}`;
}

function createVertriebsdokument(auftragId, today, dokumentTyp = "Auftragsbestaetigung") {
    return {
        auftragId,
        dokumentTyp,
        datum: today,
        notiz: ""
    };
}

export default function Vertriebsdokumente() {
    const today = getBerlinDate();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const auftraege = auftraegeService.list();
    const anfragen = customerInquiryService.list();
    const angebote = angeboteService.getAll();
    const initialAuftragId = searchParams.get("auftrag") || String(auftraege[0]?.id || "");
    const [selectedAuftragId, setSelectedAuftragId] = useState(initialAuftragId);
    const [auftragsFilter, setAuftragsFilter] = useState("alle");
    const [dokumente, setDokumente] = useSyncedServiceData(
        ["vertriebsdokumente", "auftraege", "angebote", "kundenanfragen", "nachrichten"],
        () => vertriebsdokumenteService.list()
    );
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState(createVertriebsdokument(initialAuftragId, today));

    const gefilterteAuftraegeFuerAuswahl = useMemo(
        () => auftraege.filter(item => {
            const bestaetigung = getConfirmationDocument(item.id, dokumente);

            if (auftragsFilter === "offen") {
                return String(item.status || "").toLowerCase() === "offen";
            }
            if (auftragsFilter === "ohne_bestaetigung") {
                return !bestaetigung;
            }
            if (auftragsFilter === "bestaetigt") {
                return bestaetigung?.status === "versendet";
            }
            return true;
        }),
        [auftraege, dokumente, auftragsFilter]
    );

    const auftragsOptionen = gefilterteAuftraegeFuerAuswahl.map(item => ({ value: String(item.id), label: `${item.auftragNr} - ${item.kunde}` }));
    const selectedAuftrag = auftraege.find(item => String(item.id) === String(selectedAuftragId));
    const gefilterteDokumente = useMemo(
        () => dokumente.filter(item => !selectedAuftragId || String(item.auftragId) === String(selectedAuftragId)),
        [dokumente, selectedAuftragId]
    );
    const auftragswert = berechneAuftragswert(selectedAuftrag?.positionen || []);
    const overviewCards = useMemo(
        () => [
            { label: "Dokumente", value: gefilterteDokumente.length },
            { label: "Noch offen", value: gefilterteDokumente.filter(item => item.status !== "versendet").length },
            { label: "Versendet", value: gefilterteDokumente.filter(item => item.status === "versendet").length }
        ],
        [gefilterteDokumente]
    );

    const resetCurrentDocument = (auftragId = selectedAuftragId || String(auftraege[0]?.id || ""), dokumentTyp = "Auftragsbestaetigung") => {
        setCurrent(createVertriebsdokument(auftragId, today, dokumentTyp));
    };

    const refreshDokumente = () => {
        setDokumente(vertriebsdokumenteService.list());
    };

    const auftragAuswaehlen = (value) => {
        setSelectedAuftragId(value);
        navigate(`/vertriebsdokumente?auftrag=${value}`);
    };

    const neu = () => {
        const vorbelegterAuftragId = selectedAuftragId || String(auftraege[0]?.id || "");
        const bestaetigung = getConfirmationDocument(vorbelegterAuftragId, dokumente);
        resetCurrentDocument(vorbelegterAuftragId, bestaetigung ? "Lieferschein" : "Auftragsbestaetigung");
        setOpen(true);
    };

    const createDokumentPayload = () => {
        const auftrag = auftraege.find(item => String(item.id) === String(current.auftragId));
        if (!auftrag) return null;
        const vorhandeneBestaetigung = getConfirmationDocument(auftrag.id, dokumente);
        if (current.dokumentTyp === "Auftragsbestaetigung" && vorhandeneBestaetigung) {
            alert("Fuer diesen Auftrag wurde die Auftragsbestaetigung bereits erstellt.");
            return null;
        }
        if (current.dokumentTyp !== "Auftragsbestaetigung" && !vorhandeneBestaetigung) {
            alert("Bitte zuerst die Auftragsbestaetigung erstellen.");
            return null;
        }

        const titel = createDokumentTitel(current.dokumentTyp, auftrag);
        return {
            ...current,
            auftragId: Number(current.auftragId),
            dokumentNr: current.dokumentTyp === "Lieferschein" ? getLieferscheinnummer(auftrag.auftragNr, auftrag.datum) : (current.dokumentNr || ""),
            titel,
            versendetAm: current.versendetAm || "",
            status: current.status || "erstellt",
            notiz: current.notiz.trim()
        };
    };

    const speichern = () => {
        const payload = createDokumentPayload();
        if (!payload) return;

        vertriebsdokumenteService.create(payload);
        refreshDokumente();
        setOpen(false);
        resetCurrentDocument();
    };

    const loeschen = (dokument) => {
        vertriebsdokumenteService.remove(dokument.id);
        refreshDokumente();
    };

    const alsPdf = (dokument) => {
        const auftrag = auftraege.find(item => String(item.id) === String(dokument.auftragId));
        openDocumentPdf({
            title: dokument.titel || createDokumentTitel(dokument.dokumentTyp, { auftragNr: dokument.auftragNr }),
            subject: "Automatisch erzeugtes Vertriebsdokument fuer den Schulungseinsatz.",
            date: dokument.datum,
            note: dokument.notiz,
            referenceLabel: "Auftrag",
            referenceValue: dokument.auftragNr,
            partnerLabel: "Kunde",
            partnerValue: dokument.kunde,
            positions: auftrag?.positionen || dokument.positionen || [],
            preispositionen: auftrag?.preispositionen || dokument.preispositionen || [],
            deductionAmount: auftrag?.rabattBetrag || 0,
            deductionReason: auftrag?.verguenstigungsGrund || ""
        });
    };

    const versenden = (dokument) => {
        vertriebsdokumenteService.update(dokument.id, {
            ...dokument,
            status: "versendet",
            versendetAm: today
        });

        if (dokument.dokumentTyp === "Auftragsbestaetigung") {
            const { auftrag, angebot, anfrage, vorgangId } = getProcessContextForDocument(dokument, auftraege, angebote, anfragen);

            if (vorgangId) {
                nachrichtenService.create({
                    vorgangId,
                    anfrageId: anfrage?.id || "",
                    angebotId: angebot?.id || auftrag?.angebotId || "",
                    auftragId: auftrag?.id || "",
                    dokumentId: dokument.id,
                    kundeId: auftrag?.kundeId || "",
                    datum: today,
                    senderRolle: "Verkauf",
                    senderName: "Schuelerfirma Verkauf",
                    kanal: "E-Mail",
                    betreff: dokument.titel || `Auftragsbestaetigung ${auftrag?.auftragNr || ""}`.trim(),
                    nachricht: `Die Auftragsbestaetigung ${dokument.titel || ""} wurde an den Kunden versendet.`,
                    typ: "Auftragsbestaetigung"
                });
            }
        }

        refreshDokumente();
    };

    const speichernUndVersenden = () => {
        const payload = createDokumentPayload();
        if (!payload) return;

        const createdDokument = vertriebsdokumenteService.create(payload);
        versenden(createdDokument);
        setOpen(false);
        resetCurrentDocument();
    };

    return <>
        <SalesFlowBar currentStep="auftragsbestaetigung"/>
        <h1>Vertriebsdokumente</h1>
        <p>Arbeitsflaeche fuer die Dokumentenkette im Vertrieb. Hier koennen Schueler Auftragsbestaetigung, Lieferschein und Begleitpapiere zu einem Auftrag nachvollziehen und vorbereiten.</p>

        <section className="module-panel">
            <div className="personalakte-toolbar">
                <div className="personalakte-select">
                    <Label>Auftrag auswaehlen</Label>
                    <LookupField value={selectedAuftragId} options={auftragsOptionen} onChange={auftragAuswaehlen} placeholder="Auftrag suchen..."/>
                </div>
                <div className="personalakte-select">
                    <Label>Filter</Label>
                    <select value={auftragsFilter} onChange={event => setAuftragsFilter(event.target.value)}>
                        {AUFTRAGS_FILTER.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                </div>
                <div className="personalakte-links">
                    <Link className="button-link" to="/auftraege">Auftraege oeffnen</Link>
                    <Link className="button-link" to="/versand">Versand oeffnen</Link>
                    <Link className="button-link" to="/angebote">Angebote oeffnen</Link>
                </div>
            </div>
            {selectedAuftrag && <div className="personalakte-summary">
                <div><span>Auftrag</span><strong>{selectedAuftrag.auftragNr}</strong></div>
                <div><span>Kunde</span><strong>{selectedAuftrag.kunde}</strong></div>
                <div><span>Status</span><strong>{selectedAuftrag.status}</strong></div>
                <div><span>Auftragswert</span><strong>{euro(auftragswert)}</strong></div>
            </div>}
        </section>

        <OverviewCards cards={overviewCards}/>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Dokumentenkette</h2>
                    <span>Vertrieb</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Kundenanfrage aufnehmen und als Angebot vorbereiten.</li>
                    <li>Nach Einigung eine Auftragsbestaetigung erstellen.</li>
                    <li>Vor dem Versand Lieferschein und Warenbegleitpapier vorbereiten.</li>
                    <li>Fuer den Transport das passende Begleit- oder Transportpapier ergaenzen.</li>
                </ul>
            </article>
        </section>

        <DataTable
            title="Vorlagen und Vertriebsdokumente"
            selectableColumns={false}
            data={gefilterteDokumente}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "dokumentTyp", title: "Dokumenttyp" },
                { field: "dokumentNr", title: "Dokumentnummer", render: row => row.dokumentNr || "-" },
                { field: "titel", title: "Titel" },
                { field: "versendetAm", title: "Versendet am", render: row => row.versendetAm || "-" },
                { field: "notiz", title: "Hinweis" }
            ]}
            toolbarActions={[{ name: "new", label: "Dokument erstellen", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "pdf", label: "PDF", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: alsPdf, variant: "secondary" },
                { name: "send", label: "Versenden", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: versenden, variant: "secondary", isVisible: row => row.status !== "versendet" },
                { name: "delete", label: "Loeschen", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: loeschen, variant: "danger" }
            ]}
            detailLinkResolver={({ field, row, value }) => {
                if ((field === "auftrag" || field === "auftragNr" || field === "auftragId") && row.auftragId) return `/auftraege?focus=${row.auftragId}`;
                if ((field === "kunde" || field === "kundeId") && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                if (field === "kundeId" && value) return `/kunden?focus=${value}`;
                return null;
            }}
        />

        <Dialog open={open} title="Vertriebsdokument erstellen" onClose={() => setOpen(false)}>
            <div><Label>Auftrag</Label><LookupField value={current.auftragId} options={auftragsOptionen} onChange={value => setCurrent(item => ({ ...item, auftragId: value }))} placeholder="Auftrag suchen..."/></div>
            <div><Label>Dokumenttyp</Label><select value={current.dokumentTyp} onChange={event => setCurrent(item => ({ ...item, dokumentTyp: event.target.value }))}>
                {(getConfirmationDocument(current.auftragId, dokumente) ? dokumentTypen : ["Auftragsbestaetigung"]).map(item => <option key={item} value={item}>{item}</option>)}
            </select></div>
            <div className="form-row"><p>Der Dokumenttitel wird automatisch aus Dokumenttyp und Auftragsnummer erzeugt.</p></div>
            <div className="form-row"><Label>Dokumentnummer</Label><strong>{current.dokumentTyp === "Lieferschein" ? getLieferscheinnummer(auftraege.find(item => String(item.id) === String(current.auftragId))?.auftragNr || "", today) : "-"}</strong></div>
            <div className="form-row"><Label>Vorschau Titel</Label><strong>{createDokumentTitel(current.dokumentTyp, auftraege.find(item => String(item.id) === String(current.auftragId)))}</strong></div>
            <div><Label>Datum</Label><input type="date" value={current.datum} onChange={event => setCurrent(item => ({ ...item, datum: event.target.value }))}/></div>
            <div className="form-row"><Label>Hinweis</Label><TextArea rows={3} value={current.notiz} onChange={value => setCurrent(item => ({ ...item, notiz: value }))}/></div>
            <div className="form-row">
                <button type="button" onClick={speichern}>Speichern</button>
                <button type="button" onClick={speichernUndVersenden}>Direkt versenden</button>
            </div>
        </Dialog>
    </>;
}

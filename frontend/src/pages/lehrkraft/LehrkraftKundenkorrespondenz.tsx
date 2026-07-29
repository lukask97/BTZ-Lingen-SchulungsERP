import { useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import angeboteService from "../../services/verkauf/angeboteService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import kundenService from "../../services/verkauf/customerService";
import nachrichtenService, { listNachrichtenZuVorgang } from "../../services/verkauf/nachrichtenService";
import { angebotInAuftragUebernehmen } from "../../services/verkauf/verkaufService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import { openDocumentPdf } from "../../utils/documentPdf";

const today = "2026-07-28";
const jetzt = () => new Date().toISOString();

export default function LehrkraftKundenkorrespondenz() {
    const [anfragen, setAnfragen] = useState(customerInquiryService.list());
    const [dokumente, setDokumente] = useState(vertriebsdokumenteService.list());
    const [createOpen, setCreateOpen] = useState(false);
    const [threadOpen, setThreadOpen] = useState(false);
    const [customerReplyOpen, setCustomerReplyOpen] = useState(false);
    const [threadItem, setThreadItem] = useState<any>(null);
    const [decisionOpen, setDecisionOpen] = useState(false);
    const [decisionMode, setDecisionMode] = useState<"angenommen" | "abgelehnt">("angenommen");
    const [decisionOffer, setDecisionOffer] = useState<any>(null);
    const [decisionText, setDecisionText] = useState("");
    const [customerReplyItem, setCustomerReplyItem] = useState<any>(null);
    const [customerReplyText, setCustomerReplyText] = useState("");
    const [current, setCurrent] = useState({ typ: "Produktanfrage", kundeId: "", kanal: "E-Mail", anliegen: "" });
    const kunden = kundenService.list();
    const [angebote, setAngebote] = useState(angeboteService.getAll());
    const kundenOptionen = kunden.map(item => ({ value: String(item.id), label: `${item.kundenNr} - ${item.firma}` }));
    const angeboteZuVorgang = vorgangId => angebote
        .filter(item => item.vorgangId === vorgangId)
        .sort((a, b) => Number(a.revision || 0) - Number(b.revision || 0));
    const kundenangebote = angebote
        .filter(item => !["angenommen", "abgelehnt", "ersetzt"].includes(String(item.status || "").toLowerCase()))
        .sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
    const offeneWarenannahmen = dokumente.filter(item =>
        ["lieferschein", "warenbegleitpapier", "transportpapier"].includes(String(item.dokumentTyp || "").toLowerCase())
        && String(item.status || "").toLowerCase() !== "versendet"
    );

    const neueAnfrage = () => {
        setCurrent({ typ: "Produktanfrage", kundeId: String(kunden[0]?.id || ""), kanal: "E-Mail", anliegen: "" });
        setCreateOpen(true);
    };

    const anfrageSpeichern = () => {
        const kunde = kunden.find(item => item.id === Number(current.kundeId));
        if (!kunde || !current.anliegen.trim()) return;
        const neueAnfrage = customerInquiryService.create({
            typ: current.typ,
            kundeId: kunde.id,
            kunde: kunde.firma,
            kanal: current.kanal,
            status: "offen",
            datum: today,
            anliegen: current.anliegen.trim(),
            vorgangId: ""
        });
        const vorgangId = `anfrage-${neueAnfrage.id}`;
        customerInquiryService.update({ ...neueAnfrage, vorgangId });
        nachrichtenService.create({
            vorgangId,
            anfrageId: neueAnfrage.id,
            angebotId: "",
            datum: today,
            zeitpunkt: jetzt(),
            senderRolle: "Kunde",
            senderName: kunde.firma,
            kanal: current.kanal,
            betreff: current.typ,
            nachricht: current.anliegen.trim(),
            typ: "Anfrage"
        });
        setAnfragen(customerInquiryService.list());
        setCreateOpen(false);
    };

    const vorgangOeffnen = (row: any) => {
        setThreadItem(row);
        setThreadOpen(true);
    };

    const kundenrueckmeldungStarten = (row: any) => {
        setCustomerReplyItem(row);
        setCustomerReplyText("");
        setCustomerReplyOpen(true);
    };

    const archivieren = (row: any) => {
        customerInquiryService.update({
            ...row,
            status: "archiviert"
        });
        setAnfragen(customerInquiryService.list());
    };

    const kundenrueckmeldungSpeichern = () => {
        if (!customerReplyItem || !customerReplyText.trim()) return;
        const vorgangId = customerReplyItem.vorgangId || `anfrage-${customerReplyItem.id}`;
        nachrichtenService.create({
            vorgangId,
            anfrageId: customerReplyItem.id,
            angebotId: customerReplyItem.angebotId || "",
            datum: today,
            zeitpunkt: jetzt(),
            senderRolle: "Kunde",
            senderName: customerReplyItem.kunde,
            kanal: customerReplyItem.kanal || "E-Mail",
            betreff: "Kundenrückmeldung",
            nachricht: customerReplyText.trim(),
            typ: "Antwort"
        });
        customerInquiryService.update({
            ...customerReplyItem,
            status: "in Bearbeitung"
        });
        if (customerReplyItem.angebotId) {
            const angebot = angeboteService.getById(customerReplyItem.angebotId);
            if (angebot && !["angenommen", "abgelehnt"].includes(String(angebot.status || "").toLowerCase())) {
                angeboteService.update({ ...angebot, status: "neu verhandeln" });
            }
        }
        setAnfragen(customerInquiryService.list());
        setAngebote(angeboteService.getAll());
        setCustomerReplyOpen(false);
        setCustomerReplyItem(null);
        setCustomerReplyText("");
    };

    const entscheidungStarten = (angebot: any, mode: "angenommen" | "abgelehnt") => {
        setDecisionOffer(angebot);
        setDecisionMode(mode);
        setDecisionText("");
        setDecisionOpen(true);
    };

    const entscheidungSpeichern = () => {
        if (!decisionOffer) return;
        if (decisionText.trim()) {
            nachrichtenService.create({
                vorgangId: decisionOffer.vorgangId,
                anfrageId: decisionOffer.anfrageId || "",
                angebotId: decisionOffer.id,
                datum: today,
                zeitpunkt: jetzt(),
                senderRolle: "Lehrkraft",
                senderName: "Lehrkraft",
                kanal: "E-Mail",
                betreff: decisionMode === "angenommen" ? `Annahme ${decisionOffer.angebotsNr}` : `Ablehnung ${decisionOffer.angebotsNr}`,
                nachricht: decisionText.trim(),
                typ: "Antwort"
            });
        }

        if (decisionMode === "angenommen") {
            angebotInAuftragUebernehmen(decisionOffer.id);
        } else {
            angeboteService.update({ ...decisionOffer, status: "abgelehnt" });
            if (decisionOffer.anfrageId) {
                const anfrage = customerInquiryService.list().find(item => String(item.id) === String(decisionOffer.anfrageId));
                if (anfrage) {
                    customerInquiryService.update({ ...anfrage, status: "erledigt", angebotId: decisionOffer.id });
                }
            }
        }

        setAnfragen(customerInquiryService.list());
        setAngebote(angeboteService.getAll());
        setDecisionOpen(false);
        setDecisionOffer(null);
        setDecisionText("");
    };

    const dokumentVersenden = (row: any) => {
        vertriebsdokumenteService.update(row.id, {
            ...row,
            status: "versendet",
            versendetAm: today
        });
        setDokumente(vertriebsdokumenteService.list());
    };

    const angebotAlsPdf = (angebot: any) => {
        const verlaufAngebote = angeboteZuVorgang(angebot.vorgangId)
            .slice()
            .sort((a, b) => Number(b.revision || 0) - Number(a.revision || 0));
        const neuestesAngebot = verlaufAngebote[0] || angebot;
        const aeltereVersionen = verlaufAngebote.slice(1);
        const verlaufNachrichten = listNachrichtenZuVorgang(angebot.vorgangId);
        openDocumentPdf({
            title: `Angebot ${neuestesAngebot.angebotsNr}`,
            subject: "Aktueller Angebotsstand für die Lehrkraft. Seite 1 zeigt immer die neueste Version.",
            date: neuestesAngebot.datum,
            note: neuestesAngebot.verguenstigungsGrund || "Kein zusätzlicher Hinweis hinterlegt.",
            referenceLabel: "Angebot",
            referenceValue: neuestesAngebot.angebotsNr,
            partnerLabel: "Kunde",
            partnerValue: neuestesAngebot.kunde,
            positions: neuestesAngebot.positionen || [],
            deductionAmount: neuestesAngebot.rabattBetrag || 0,
            deductionReason: neuestesAngebot.verguenstigungsGrund || "",
            appendixPages: [
                ...aeltereVersionen.map((version) => ({
                    title: `Frühere Version ${version.angebotsNr}`,
                    subject: "Älterer Angebotsstand aus dem selben Verhandlungsvorgang.",
                    date: version.datum,
                    note: version.verguenstigungsGrund || "Kein zusätzlicher Hinweis hinterlegt.",
                    referenceLabel: "Angebot",
                    referenceValue: version.angebotsNr,
                    partnerLabel: "Kunde",
                    partnerValue: version.kunde,
                    positions: version.positionen || [],
                    deductionAmount: version.rabattBetrag || 0,
                    deductionReason: version.verguenstigungsGrund || ""
                })),
                {
                    pageType: "history",
                    title: "Nachrichtenverlauf",
                    subject: "Kompletter Verhandlungs- und Nachrichtenverlauf zum Vorgang.",
                    date: neuestesAngebot.datum,
                    note: "Der Verlauf ist chronologisch sortiert.",
                    referenceValue: neuestesAngebot.vorgangId,
                    partnerLabel: "Kunde",
                    partnerValue: neuestesAngebot.kunde,
                    historyEntries: verlaufNachrichten.map((entry) => ({
                        date: String(entry.zeitpunkt || entry.datum).replace("T", " ").slice(0, 16),
                        label: `${entry.senderRolle}: ${entry.betreff}`,
                        text: entry.nachricht
                    }))
                }
            ]
        });
    };

    return <>
        <h1>Lehrkraft: Kundenkorrespondenz</h1>
        <p>Diese Seite ist der externe Gegenpart zum Verkauf. Hier erfasst die Lehrkraft Kundenanfragen und begleitet den Verhandlungsfaden, während der Verkauf anschließend intern Angebote und Aufträge weiterbearbeitet.</p>
        <OverviewCards cards={[
            { label: "Offene Anfragen", value: anfragen.filter(item => item.status === "offen").length },
            { label: "Offene Angebote", value: kundenangebote.length },
            { label: "Offene Warenannahme", value: offeneWarenannahmen.length }
        ]}/>
        <DataTable
            title="Kundenanfragen extern"
            selectableColumns={false}
            data={anfragen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "kanal", title: "Kanal" },
                { field: "typ", title: "Typ" },
                { field: "status", title: "Status" },
                { field: "anliegen", title: "Anliegen" }
            ]}
            detailLinkResolver={({ field, row }) => field === "kunde" && row.kundeId ? `/kunden?focus=${row.kundeId}` : null}
            toolbarActions={[{ name: "new", label: "Anfrage erfassen", permission: "gf", onClick: neueAnfrage }]}
            rowActions={[
                { name: "thread", label: "Vorgang", permission: "gf", onClick: vorgangOeffnen, variant: "secondary", isVisible: row => !!row.vorgangId },
                { name: "customerReply", label: "Kundenrückmeldung", permission: "gf", onClick: kundenrueckmeldungStarten, variant: "secondary", isVisible: row => row.status !== "archiviert" },
                { name: "archive", label: "Archivieren", permission: "gf", onClick: archivieren, variant: "secondary", isVisible: row => row.status !== "archiviert" }
            ]}
        />
        <DataTable
            title="Angebote an Kunden"
            selectableColumns={false}
            data={kundenangebote}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "angebotsNr", title: "Angebot", render: row => <Link className="detail-link" to={`/angebote?focus=${row.id}`}>{row.angebotsNr}</Link> },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "gueltigBis", title: "Gültig bis" },
                { field: "status", title: "Status" },
                { field: "gesamtbetrag", title: "Betrag" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "angebotsNr") return `/angebote?focus=${row.id}`;
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                return null;
            }}
            rowActions={[
                { name: "thread", label: "Vorgang", permission: "gf", onClick: vorgangOeffnen, variant: "secondary", isVisible: row => !!row.vorgangId },
                { name: "pdf", label: "PDF", permission: "gf", onClick: angebotAlsPdf, variant: "secondary" },
                { name: "accept", label: "Annehmen", permission: "gf", onClick: row => entscheidungStarten(row, "angenommen"), variant: "success" },
                { name: "reject", label: "Ablehnen", permission: "gf", onClick: row => entscheidungStarten(row, "abgelehnt"), variant: "danger" }
            ]}
        />
        <DataTable
            title="Warenannahme / Transportbescheinigung"
            selectableColumns={false}
            data={offeneWarenannahmen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "auftragNr", title: "Auftrag", render: row => row.auftragId ? <Link className="detail-link" to={`/auftraege?focus=${row.auftragId}`}>{row.auftragNr}</Link> : row.auftragNr },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "dokumentTyp", title: "Dokumenttyp" },
                { field: "status", title: "Status" },
                { field: "versendetAm", title: "Versendet am", render: row => row.versendetAm || "-" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "auftragNr" && row.auftragId) return `/auftraege?focus=${row.auftragId}`;
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                return null;
            }}
            rowActions={[
                { name: "send", label: "Versenden", permission: "gf", onClick: dokumentVersenden, variant: "secondary", isVisible: row => row.status !== "versendet" }
            ]}
        />
        <Dialog open={createOpen} title="Kundenanfrage erfassen" onClose={() => setCreateOpen(false)}>
            <div><Label>Typ</Label><select value={current.typ} onChange={event => setCurrent(value => ({ ...value, typ: event.target.value }))}><option>Produktanfrage</option><option>Angebotswunsch</option><option>Transportverzoegerung</option></select></div>
            <div><Label>Kunde</Label><LookupField value={current.kundeId} options={kundenOptionen} onChange={value => setCurrent(item => ({ ...item, kundeId: value }))} placeholder="Kunde suchen..."/></div>
            <div><Label>Kanal</Label><TextField value={current.kanal} onChange={value => setCurrent(item => ({ ...item, kanal: value }))}/></div>
            <div className="form-row"><Label>Anliegen</Label><TextArea rows={4} value={current.anliegen} onChange={value => setCurrent(item => ({ ...item, anliegen: value }))}/></div>
            <div className="form-row"><button onClick={anfrageSpeichern}>Speichern</button></div>
        </Dialog>
        <Dialog open={customerReplyOpen} title="Kundenrückmeldung erfassen" onClose={() => setCustomerReplyOpen(false)}>
            {customerReplyItem && <>
                <div className="module-panel">
                    <div><Label>Kunde</Label><strong>{customerReplyItem.kunde}</strong></div>
                    <div><Label>Vorgang</Label><strong>{customerReplyItem.vorgangId || "-"}</strong></div>
                    <div><Label>Aktueller Status</Label><strong>{customerReplyItem.status}</strong></div>
                </div>
                <div className="form-row"><Label>Rückmeldung</Label><TextArea rows={5} value={customerReplyText} onChange={setCustomerReplyText} placeholder="Antwort, Rückfrage oder Änderungswunsch des Kunden dokumentieren..."/></div>
                <div className="form-row"><button onClick={kundenrueckmeldungSpeichern}>Speichern</button></div>
            </>}
        </Dialog>
        <Dialog open={decisionOpen} title={decisionOffer ? `${decisionMode === "angenommen" ? "Annahme" : "Ablehnung"} ${decisionOffer.angebotsNr}` : "Angebotsentscheidung"} onClose={() => setDecisionOpen(false)}>
            {decisionOffer && <>
                <div className="module-panel">
                    <div><Label>Kunde</Label><strong>{decisionOffer.kunde}</strong></div>
                    <div><Label>Angebot</Label><strong>{decisionOffer.angebotsNr}</strong></div>
                    <div><Label>Entscheidung</Label><strong>{decisionMode === "angenommen" ? "Annehmen" : "Ablehnen"}</strong></div>
                </div>
                <div className="form-row"><Label>Nachricht an den Verhandlungsfaden</Label><TextArea rows={5} value={decisionText} onChange={setDecisionText} placeholder="Optionale Rückmeldung oder Begründung dokumentieren..."/></div>
                <div className="form-row"><button onClick={entscheidungSpeichern}>Entscheidung speichern</button></div>
            </>}
        </Dialog>
        <Dialog open={threadOpen} title="Verhandlungsfaden der Lehrkraftsicht" onClose={() => setThreadOpen(false)}>
            {threadItem && <>
                <div className="module-panel">
                    <div><Label>Vorgang</Label><strong>{threadItem.vorgangId || "-"}</strong></div>
                    <div><Label>Kunde</Label><strong>{threadItem.kunde}</strong></div>
                    <div><Label>Aktuelle Anfrage</Label><p>{threadItem.anliegen}</p></div>
                </div>
                <div className="form-row">
                    <Label>Angebotsstände</Label>
                    {angeboteZuVorgang(threadItem.vorgangId).length === 0 ? <p>Noch kein Angebot vorhanden.</p> : <ul className="positionsliste">
                        {angeboteZuVorgang(threadItem.vorgangId).map(item => <li key={item.id}><Link className="detail-link" to={`/angebote?focus=${item.id}`}>{item.angebotsNr}</Link> - {item.status}</li>)}
                    </ul>}
                </div>
                <div className="form-row">
                    <Label>Nachrichtenverlauf</Label>
                    {listNachrichtenZuVorgang(threadItem.vorgangId).length === 0 ? <p>Noch keine Nachrichten vorhanden.</p> : <ul className="positionsliste">
                        {listNachrichtenZuVorgang(threadItem.vorgangId).map(item => <li key={item.id}><strong>{String(item.zeitpunkt || item.datum).replace("T", " ").slice(0, 16)}</strong> - {item.senderRolle}: {item.betreff}<br/>{item.nachricht}</li>)}
                    </ul>}
                </div>
            </>}
        </Dialog>
    </>;
}

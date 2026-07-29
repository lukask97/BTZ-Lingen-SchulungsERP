import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/TextArea";
import OverviewCards from "../../components/OverviewCards";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import { listNachrichtenZuVorgang } from "../../services/verkauf/nachrichtenService";
import angeboteService from "../../services/verkauf/angeboteService";
import { getCustomerName } from "../../utils/customerReferences";

const today = "2026-07-28";

export default function Kundenanfragen() {
    const navigate = useNavigate();
    const [anfragen, setAnfragen] = useState(customerInquiryService.list());
    const [replyOpen, setReplyOpen] = useState(false);
    const [threadOpen, setThreadOpen] = useState(false);
    const [replyItem, setReplyItem] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [threadItem, setThreadItem] = useState(null);
    const angebote = angeboteService.getAll();
    const angeboteZuVorgang = vorgangId => angebote
        .filter(item => item.vorgangId === vorgangId)
        .sort((a, b) => Number(a.revision || 0) - Number(b.revision || 0));

    const antworten = (item) => {
        setReplyItem(item);
        setReplyText(item.antwort || "");
        setReplyOpen(true);
    };

    const vorgangOeffnen = (item) => {
        setThreadItem(item);
        setThreadOpen(true);
    };

    const antwortSpeichern = () => {
        if (!replyItem || !replyText.trim()) return;
        customerInquiryService.update({
            ...replyItem,
            status: "beantwortet",
            antwort: replyText.trim(),
            beantwortetAm: today
        });
        setAnfragen(customerInquiryService.list());
        setReplyOpen(false);
        setReplyItem(null);
        setReplyText("");
    };

    const offene = anfragen.filter(item => item.status === "offen").length;

    return <>
        <OverviewCards cards={[
            { label: "Anfragen gesamt", value: anfragen.length },
            { label: "Offen", value: offene },
            { label: "Beantwortet", value: anfragen.filter(item => item.status === "beantwortet").length }
        ]}/>
        <DataTable
            title="Kundenanfragen"
            selectableColumns={false}
            data={anfragen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{getCustomerName(row.kundeId, row.kunde)}</Link> : row.kunde },
                { field: "typ", title: "Typ" },
                { field: "kanal", title: "Kanal" },
                { field: "status", title: "Status" },
                { field: "anliegen", title: "Anliegen" }
            ]}
            detailLinkResolver={({ field, row, value }) => {
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                if (field === "angebotId" && value) return `/angebote?focus=${value}`;
                if (field === "auftragId" && value) return `/auftraege?focus=${value}`;
                return null;
            }}
            rowActions={[
                { name: "openOffer", label: "Angebot öffnen", permission: "verkauf.bearbeiten", onClick: row => row.angebotId && navigate(`/angebote?focus=${row.angebotId}`), variant: "secondary", isVisible: row => !!row.angebotId },
                { name: "thread", label: "Vorgang", permission: "verkauf.bearbeiten", onClick: vorgangOeffnen, variant: "secondary", isVisible: row => !!row.vorgangId },
                { name: "offer", label: "Angebot vorbereiten", permission: "verkauf.bearbeiten", onClick: row => navigate(`/angebote?new=fromInquiry&kundeId=${row.kundeId}&anfrageId=${row.id}`), variant: "secondary", isVisible: row => row.status === "offen" && !!row.kundeId },
                { name: "openOrder", label: "Auftrag öffnen", permission: "verkauf.bearbeiten", onClick: row => row.auftragId && navigate(`/auftraege?focus=${row.auftragId}`), variant: "secondary", isVisible: row => !!row.auftragId },
                { name: "order", label: "Auftrag direkt anlegen", permission: "verkauf.bearbeiten", onClick: row => navigate(`/auftraege?new=fromInquiry&kundeId=${row.kundeId}&anfrageId=${row.id}`), variant: "success", isVisible: row => row.status === "offen" && !!row.kundeId && !row.auftragId },
                { name: "reply", label: "Antworten", permission: "verkauf.bearbeiten", onClick: antworten, variant: "secondary", isVisible: row => row.status !== "beantwortet" }
            ]}
        />
        <Dialog open={replyOpen} title="Kundenanfrage beantworten" onClose={() => setReplyOpen(false)}>
            {replyItem && <>
                <div className="module-panel">
                    <div><Label>Kunde</Label><strong>{getCustomerName(replyItem.kundeId, replyItem.kunde)}</strong></div>
                    <div><Label>Originale Anfrage</Label><p>{replyItem.anliegen}</p></div>
                </div>
                <div><Label>Antwort</Label><TextArea rows={5} value={replyText} onChange={setReplyText} placeholder="Antwort an den Kunden erfassen..."/></div>
                <div className="form-row"><button onClick={antwortSpeichern}>Antwort speichern</button></div>
            </>}
        </Dialog>
        <Dialog open={threadOpen} title="Vorgang zur Kundenanfrage" onClose={() => setThreadOpen(false)}>
            {threadItem && <>
                <div className="module-panel">
                    <div><Label>Vorgang</Label><strong>{threadItem.vorgangId || "-"}</strong></div>
                    <div><Label>Kunde</Label><strong>{getCustomerName(threadItem.kundeId, threadItem.kunde)}</strong></div>
                    <div><Label>Status</Label><strong>{threadItem.status}</strong></div>
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
                        {listNachrichtenZuVorgang(threadItem.vorgangId).map(item => <li key={item.id}><strong>{item.datum}</strong> - {item.senderRolle}: {item.betreff}<br/>{item.nachricht}</li>)}
                    </ul>}
                </div>
            </>}
        </Dialog>
    </>;
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import LookupField from "../components/form/LookupField";
import TextArea from "../components/form/TextArea";
import TextField from "../components/form/TextField";
import OverviewCards from "../components/OverviewCards";
import customerInquiryService from "../services/customerInquiryService";
import kundenService from "../services/customerService";
import { getCustomerName } from "../utils/customerReferences";

const today = "2026-07-28";

export default function Kundenanfragen() {
    const navigate = useNavigate();
    const [anfragen, setAnfragen] = useState(customerInquiryService.list());
    const [createOpen, setCreateOpen] = useState(false);
    const [replyOpen, setReplyOpen] = useState(false);
    const [current, setCurrent] = useState({ typ: "Produktanfrage", kundeId: "", kanal: "E-Mail", anliegen: "" });
    const [replyItem, setReplyItem] = useState(null);
    const [replyText, setReplyText] = useState("");
    const kunden = kundenService.list();
    const kundenOptionen = kunden.map(item => ({ value: String(item.id), label: `${item.kundenNr} - ${item.firma}` }));

    const neueAnfrage = () => {
        setCurrent({ typ: "Produktanfrage", kundeId: String(kunden[0]?.id || ""), kanal: "E-Mail", anliegen: "" });
        setCreateOpen(true);
    };

    const speichern = () => {
        const kunde = kunden.find(item => item.id === Number(current.kundeId));
        if (!kunde || !current.anliegen.trim()) return;
        customerInquiryService.create({
            typ: current.typ,
            kundeId: kunde.id,
            kanal: current.kanal,
            status: "offen",
            datum: today,
            anliegen: current.anliegen.trim()
        });
        setAnfragen(customerInquiryService.list());
        setCreateOpen(false);
    };

    const antworten = (item) => {
        setReplyItem(item);
        setReplyText(item.antwort || "");
        setReplyOpen(true);
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
            toolbarActions={[{ name: "new", label: "Neue Anfrage", permission: "verkauf.bearbeiten", onClick: neueAnfrage }]}
            rowActions={[
                { name: "openOffer", label: "Angebot öffnen", permission: "verkauf.bearbeiten", onClick: row => row.angebotId && navigate(`/angebote?focus=${row.angebotId}`), variant: "secondary", isVisible: row => !!row.angebotId },
                { name: "offer", label: "Angebot vorbereiten", permission: "verkauf.bearbeiten", onClick: row => navigate(`/angebote?new=fromInquiry&kundeId=${row.kundeId}&anfrageId=${row.id}`), variant: "secondary", isVisible: row => row.status === "offen" && !!row.kundeId },
                { name: "openOrder", label: "Auftrag öffnen", permission: "verkauf.bearbeiten", onClick: row => row.auftragId && navigate(`/auftraege?focus=${row.auftragId}`), variant: "secondary", isVisible: row => !!row.auftragId },
                { name: "order", label: "Auftrag direkt anlegen", permission: "verkauf.bearbeiten", onClick: row => navigate(`/auftraege?new=fromInquiry&kundeId=${row.kundeId}&anfrageId=${row.id}`), variant: "success", isVisible: row => row.status === "offen" && !!row.kundeId && !row.auftragId },
                { name: "reply", label: "Antworten", permission: "verkauf.bearbeiten", onClick: antworten, variant: "secondary", isVisible: row => row.status !== "beantwortet" }
            ]}
        />
        <Dialog open={createOpen} title="Kundenanfrage erfassen" onClose={() => setCreateOpen(false)}>
            <div><Label>Typ</Label><select value={current.typ} onChange={event => setCurrent(value => ({ ...value, typ: event.target.value }))}><option>Produktanfrage</option><option>Angebotswunsch</option><option>Transportverzoegerung</option></select></div>
            <div><Label>Kunde</Label><LookupField value={current.kundeId} options={kundenOptionen} onChange={value => setCurrent(item => ({ ...item, kundeId: value }))} placeholder="Kunde suchen..."/></div>
            <div><Label>Kanal</Label><TextField value={current.kanal} onChange={value => setCurrent(item => ({ ...item, kanal: value }))}/></div>
            <div className="form-row"><Label>Anliegen</Label><TextArea rows={4} value={current.anliegen} onChange={value => setCurrent(item => ({ ...item, anliegen: value }))}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
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
    </>;
}

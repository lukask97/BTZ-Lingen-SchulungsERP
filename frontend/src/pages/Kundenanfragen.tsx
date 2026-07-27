import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
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

const today = "2026-07-27";

export default function Kundenanfragen() {
    const navigate = useNavigate();
    const [anfragen, setAnfragen] = useState(customerInquiryService.list());
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState({ typ: "Produktanfrage", kundeId: "", kanal: "E-Mail", anliegen: "" });
    const kunden = kundenService.list();
    const kundenOptionen = kunden.map(item => ({ value: String(item.id), label: `${item.kundenNr} - ${item.firma}` }));

    const neueAnfrage = () => {
        setCurrent({ typ: "Produktanfrage", kundeId: String(kunden[0]?.id || ""), kanal: "E-Mail", anliegen: "" });
        setOpen(true);
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
        setOpen(false);
    };

    const abschliessen = (item) => {
        customerInquiryService.update({ ...item, status: "erledigt" });
        setAnfragen(customerInquiryService.list());
    };

    const offene = anfragen.filter(item => item.status === "offen").length;

    return <>
        <OverviewCards cards={[
            { label: "Anfragen gesamt", value: anfragen.length },
            { label: "Offen", value: offene },
            { label: "Erledigt", value: anfragen.length - offene }
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
                { name: "openOffer", label: "Angebot öffnen", permission: "verkauf.bearbeiten", onClick: row => navigate(`/angebote?focus=${row.angebotId}`), variant: "secondary", isVisible: row => !!row.angebotId },
                { name: "offer", label: "Angebot vorbereiten", permission: "verkauf.bearbeiten", onClick: row => navigate(`/angebote?new=fromInquiry&kundeId=${row.kundeId}&anfrageId=${row.id}`), variant: "secondary", isVisible: row => row.status === "offen" && !!row.kundeId },
                { name: "openOrder", label: "Auftrag öffnen", permission: "verkauf.bearbeiten", onClick: row => navigate(`/auftraege?focus=${row.auftragId}`), variant: "secondary", isVisible: row => !!row.auftragId },
                { name: "order", label: "Auftrag direkt anlegen", permission: "verkauf.bearbeiten", onClick: row => navigate(`/auftraege?new=fromInquiry&kundeId=${row.kundeId}&anfrageId=${row.id}`), variant: "success", isVisible: row => row.status === "offen" && !!row.kundeId && !row.auftragId },
                { name: "done", label: "Als erledigt markieren", permission: "verkauf.bearbeiten", onClick: abschliessen, isVisible: row => row.status !== "erledigt" }
            ]}
        />
        <Dialog open={open} title="Kundenanfrage erfassen" onClose={() => setOpen(false)}>
            <div><Label>Typ</Label><select value={current.typ} onChange={event => setCurrent(value => ({ ...value, typ: event.target.value }))}><option>Produktanfrage</option><option>Angebotswunsch</option><option>Transportverzoegerung</option></select></div>
            <div><Label>Kunde</Label><LookupField value={current.kundeId} options={kundenOptionen} onChange={value => setCurrent(item => ({ ...item, kundeId: value }))} placeholder="Kunde suchen..."/></div>
            <div><Label>Kanal</Label><TextField value={current.kanal} onChange={value => setCurrent(item => ({ ...item, kanal: value }))}/></div>
            <div className="form-row"><Label>Anliegen</Label><TextArea rows={4} value={current.anliegen} onChange={value => setCurrent(item => ({ ...item, anliegen: value }))}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

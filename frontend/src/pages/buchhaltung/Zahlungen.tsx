import { Link } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import OverviewCards from "../../components/OverviewCards";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import zahlungenService from "../../services/buchhaltung/zahlungenService";
import { getPaymentOpenItemStatus, isOpenItem, isPendingPayment } from "../../utils/openItems";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate } from "../../utils/dateTime";

function createZahlungsentwurf(today: string) {
    return { rechnungId: "", betrag: 0, ausfuehrenAm: today };
}

export default function Zahlungen() {
    const today = getBerlinDate();
    const [zahlungen, setZahlungen] = useSyncedServiceData(["zahlungen", "auftraege", "bestellungen"], () => zahlungenService.list());
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(createZahlungsentwurf(today));
    const rechnungen = rechnungenService.list().filter(isOpenItem);
    const rechnungsOptionen = rechnungen.map(item => ({ value: String(item.id), label: `${item.rechnungsnr} - ${item.kunde}` }));

    const resolvePartnerLink = (zahlung) => {
        const rechnung = zahlung.rechnungId ? rechnungenService.getById(zahlung.rechnungId) : null;
        if (!rechnung) return null;
        if (rechnung.rechnungstyp === "Eingangsrechnung") {
            return rechnung.lieferantId ? `/lieferanten?focus=${rechnung.lieferantId}` : null;
        }
        return rechnung.kundeId ? `/kunden?focus=${rechnung.kundeId}` : null;
    };

    const neu = () => {
        const first = rechnungen[0];
        setDraft({
            rechnungId: first ? String(first.id) : "",
            betrag: first ? Number(first.betrag) : 0,
            ausfuehrenAm: first?.faelligAm || today
        });
        setOpen(true);
    };

    const speichern = () => {
        const rechnung = rechnungenService.getById(draft.rechnungId);
        if (!rechnung) return;
        zahlungenService.create({
            rechnungId: rechnung.id,
            zahlungsart: rechnung.rechnungstyp === "Eingangsrechnung" ? "Ausgang" : "Eingang",
            datum: today,
            ausfuehrenAm: draft.ausfuehrenAm,
            betrag: Number(draft.betrag),
            methode: "Überweisung",
            status: "geplant"
        });
        setZahlungen(zahlungenService.list());
        setOpen(false);
        setDraft(createZahlungsentwurf(today));
    };

    const ausfuehren = (zahlung) => {
        if (zahlung.status === "ausgefuehrt") return;
        const rechnung = zahlung.rechnungId ? rechnungenService.getById(zahlung.rechnungId) : null;
        zahlungenService.update({ ...zahlung, status: "ausgefuehrt", datum: today });
        if (rechnung) {
            rechnungenService.update({ ...rechnung, status: "bezahlt" });
        }
        setZahlungen(zahlungenService.list());
    };

    const stornieren = (zahlung) => {
        const rechnung = zahlung.rechnungId ? rechnungenService.getById(zahlung.rechnungId) : null;
        if (rechnung && zahlung.status === "ausgefuehrt") {
            rechnungenService.update({ ...rechnung, status: "offen" });
        }
        zahlungenService.remove(zahlung.id);
        setZahlungen(zahlungenService.list());
    };

    const summe = zahlungen.reduce((total, item) => total + Number(item.betrag), 0);
    const eingaenge = zahlungen.filter(item => item.zahlungsart !== "Ausgang").length;
    const ausgaenge = zahlungen.filter(item => item.zahlungsart === "Ausgang").length;
    const offeneZahlungen = zahlungen.filter(isPendingPayment);

    return <>
        <OverviewCards cards={[
            { label: "Zahlungen", value: zahlungen.length },
            { label: "Zahlungseingänge", value: eingaenge },
            { label: "Zahlungsausgänge", value: ausgaenge },
            { label: "Summe", value: `${summe.toFixed(2)} €` },
            { label: "Offene Zahlungen", value: offeneZahlungen.length }
        ]}/>
        <DataTable
            title="Interne Zahlungsübersicht"
            selectableColumns={false}
            data={zahlungen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "rechnungsnr", title: "Rechnung", render: row => <Link className="detail-link" to={`/rechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> },
                { field: "zahlungsart", title: "Art" },
                { field: "ausfuehrenAm", title: "Ausführen am" },
                { field: "status", title: "Status", render: row => getPaymentOpenItemStatus(row) === "bezahlt" ? "ausgeführt" : row.status },
                { field: "kunde", title: "Kunde", render: row => {
                    const link = resolvePartnerLink(row);
                    return link ? <Link className="detail-link" to={link}>{row.kunde}</Link> : row.kunde;
                } },
                { field: "betrag", title: "Betrag" },
                { field: "methode", title: "Methode" }
            ]}
            focusField="rechnungsnr"
            detailLinkResolver={({ field, row, value }) => {
                if (field === "rechnungsnr") return `/rechnungen?focus=${value}`;
                if (field === "kunde") return resolvePartnerLink(row);
                return null;
            }}
            toolbarActions={[{ name: "new", label: "Zahlungsvorgang anlegen", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: neu, variant: "success" }]}
            rowActions={[
                { name: "execute", label: "Als ausgeführt markieren", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: ausfuehren, variant: "success", isVisible: row => row.status !== "ausgefuehrt" },
                { name: "cancel", label: "Stornieren", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: stornieren, variant: "danger" }
            ]}
        />
        <Dialog open={open} title="Internen Zahlungsvorgang anlegen" onClose={() => setOpen(false)}>
            <div><Label>Rechnung</Label><LookupField value={draft.rechnungId} options={rechnungsOptionen} onChange={value => setDraft(item => ({ ...item, rechnungId: value }))} placeholder="Rechnung suchen..."/></div>
            <div className="form-row">
                <div><Label>Betrag</Label><NumberField value={draft.betrag} min="0" onChange={value => setDraft(item => ({ ...item, betrag: value }))}/></div>
                <div><Label>Ausführen am</Label><input type="date" value={draft.ausfuehrenAm} onChange={event => setDraft(item => ({ ...item, ausfuehrenAm: event.target.value }))}/></div>
            </div>
            <div className="form-row"><button type="button" onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

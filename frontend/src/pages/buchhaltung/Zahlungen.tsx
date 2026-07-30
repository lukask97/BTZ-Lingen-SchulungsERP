// @ts-nocheck
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
import kundenService from "../../services/verkauf/customerService";
import lieferantenService from "../../services/einkauf/lieferantenService";
import { getCustomerName } from "../../utils/customerReferences";
import { getPaymentOpenItemStatus, isOpenItem, isPendingPayment } from "../../utils/openItems";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";

const today = "2026-07-28";

export default function Zahlungen() {
    const [zahlungen, setZahlungen] = useSyncedServiceData(["zahlungen", "auftraege", "bestellungen"], () => zahlungenService.list());
    const [open, setOpen] = useState(false);
    const [rechnungId, setRechnungId] = useState("");
    const [betrag, setBetrag] = useState(0);
    const [ausfuehrenAm, setAusfuehrenAm] = useState(today);
    const rechnungen = rechnungenService.list().filter(isOpenItem);
    const kunden = kundenService.list();
    const lieferanten = lieferantenService.list();
    const rechnungsOptionen = rechnungen.map(item => ({ value: String(item.id), label: `${item.rechnungsnr} - ${item.kunde}` }));

    const resolvePartnerLink = (zahlung) => {
        const rechnung = rechnungenService.list().find(item => item.rechnungsnr === zahlung.rechnungsnr);
        if (!rechnung) return null;
        if (rechnung.rechnungstyp === "Eingangsrechnung") {
            const lieferantId = rechnung.lieferantId || lieferanten.find(item => item.firma === rechnung.kunde)?.id;
            return lieferantId ? `/lieferanten?focus=${lieferantId}` : null;
        }
        const kundeId = rechnung.kundeId || kunden.find(item => item.firma === rechnung.kunde)?.id;
        return kundeId ? `/kunden?focus=${kundeId}` : null;
    };

    const neu = () => {
        const first = rechnungen[0];
        setRechnungId(first ? String(first.id) : "");
        setBetrag(first ? Number(first.betrag) : 0);
        setAusfuehrenAm(first?.faelligAm || today);
        setOpen(true);
    };

    const speichern = () => {
        const rechnung = rechnungenService.getById(rechnungId);
        if (!rechnung) return;
        zahlungenService.create({
            rechnungsnr: rechnung.rechnungsnr,
            zahlungsart: rechnung.rechnungstyp === "Eingangsrechnung" ? "Ausgang" : "Eingang",
            kunde: rechnung.rechnungstyp === "Eingangsrechnung" ? rechnung.kunde : getCustomerName(rechnung.kundeId, rechnung.kunde),
            datum: today,
            ausfuehrenAm,
            betrag: Number(betrag),
            methode: "Überweisung",
            status: "geplant"
        });
        setZahlungen(zahlungenService.list());
        setOpen(false);
    };

    const ausfuehren = (zahlung) => {
        if (zahlung.status === "ausgefuehrt") return;
        const rechnung = rechnungenService.list().find(item => item.rechnungsnr === zahlung.rechnungsnr);
        zahlungenService.update({ ...zahlung, status: "ausgefuehrt", datum: today });
        if (rechnung) {
            rechnungenService.update({ ...rechnung, status: "bezahlt" });
        }
        setZahlungen(zahlungenService.list());
    };

    const stornieren = (zahlung) => {
        const rechnung = rechnungenService.list().find(item => item.rechnungsnr === zahlung.rechnungsnr);
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
            toolbarActions={[{ name: "new", label: "Zahlungsvorgang anlegen", permission: "buchhaltung.bearbeiten", onClick: neu, variant: "success" }]}
            rowActions={[
                { name: "execute", label: "Als ausgeführt markieren", permission: "buchhaltung.bearbeiten", onClick: ausfuehren, variant: "success", isVisible: row => row.status !== "ausgefuehrt" },
                { name: "cancel", label: "Stornieren", permission: "buchhaltung.bearbeiten", onClick: stornieren, variant: "danger" }
            ]}
        />
        <Dialog open={open} title="Internen Zahlungsvorgang anlegen" onClose={() => setOpen(false)}>
            <div><Label>Rechnung</Label><LookupField value={rechnungId} options={rechnungsOptionen} onChange={setRechnungId} placeholder="Rechnung suchen..."/></div>
            <div className="form-row">
                <div><Label>Betrag</Label><NumberField value={betrag} min="0" onChange={setBetrag}/></div>
                <div><Label>Ausführen am</Label><input type="date" value={ausfuehrenAm} onChange={event => setAusfuehrenAm(event.target.value)}/></div>
            </div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

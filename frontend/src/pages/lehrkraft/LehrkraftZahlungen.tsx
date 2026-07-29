import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import OverviewCards from "../../components/OverviewCards";
import bestellungenService from "../../services/einkauf/bestellungenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import zahlungenService from "../../services/buchhaltung/zahlungenService";
import { getPaymentOpenItemStatus, isPendingPayment } from "../../utils/openItems";

const today = "2026-07-28";

export default function LehrkraftZahlungen() {
    const [searchParams] = useSearchParams();
    const [zahlungen, setZahlungen] = useState(zahlungenService.list());
    const [open, setOpen] = useState(false);
    const [bezugTyp, setBezugTyp] = useState("Rechnung");
    const [rechnungId, setRechnungId] = useState("");
    const [bestellungId, setBestellungId] = useState("");
    const [betrag, setBetrag] = useState(0);
    const [ausfuehrenAm, setAusfuehrenAm] = useState(today);

    const rechnungen = rechnungenService.list();
    const bestellungen = bestellungenService.list();
    const focusRef = searchParams.get("focus") || "";

    const rechnungsOptionen = rechnungen.map(item => ({ value: String(item.id), label: `${item.rechnungsnr} - ${item.kunde}` }));
    const bestellOptionen = bestellungen.map(item => ({ value: String(item.id), label: `${item.bestellNr} - ${item.lieferant}` }));

    const neu = () => {
        const ersteRechnung = rechnungen[0];
        const ersteBestellung = bestellungen[0];
        setBezugTyp("Rechnung");
        setRechnungId(ersteRechnung ? String(ersteRechnung.id) : "");
        setBestellungId(ersteBestellung ? String(ersteBestellung.id) : "");
        setBetrag(Number(ersteRechnung?.betrag || 0));
        setAusfuehrenAm(ersteRechnung?.faelligAm || today);
        setOpen(true);
    };

    const speichern = () => {
        if (bezugTyp === "Rechnung") {
            const rechnung = rechnungenService.getById(Number(rechnungId));
            if (!rechnung) return;
            zahlungenService.create({
                rechnungId: rechnung.id,
                rechnungsnr: rechnung.rechnungsnr,
                zahlungsart: rechnung.rechnungstyp === "Eingangsrechnung" ? "Ausgang" : "Eingang",
                kunde: rechnung.kunde,
                datum: today,
                ausfuehrenAm,
                betrag: Number(betrag),
                methode: "Überweisung",
                status: "geplant"
            });
        } else {
            const bestellung = bestellungen.find(item => String(item.id) === String(bestellungId));
            if (!bestellung) return;
            zahlungenService.create({
                bestellungId: bestellung.id,
                bestellNr: bestellung.bestellNr,
                rechnungsnr: "",
                zahlungsart: "Ausgang",
                kunde: bestellung.lieferant,
                datum: today,
                ausfuehrenAm,
                betrag: Number(betrag),
                methode: "Überweisung",
                status: "geplant"
            });
        }
        setZahlungen(zahlungenService.list());
        setOpen(false);
    };

    const ausfuehren = (zahlung: any) => {
        zahlungenService.update(zahlung.id, { ...zahlung, status: "ausgefuehrt", datum: today });
        if (zahlung.rechnungId) {
            const rechnung = rechnungenService.getById(zahlung.rechnungId);
            if (rechnung) rechnungenService.update({ ...rechnung, status: "bezahlt" });
        }
        setZahlungen(zahlungenService.list());
    };

    const stornieren = (zahlung: any) => {
        if (zahlung.rechnungId && zahlung.status === "ausgefuehrt") {
            const rechnung = rechnungenService.getById(zahlung.rechnungId);
            if (rechnung) rechnungenService.update({ ...rechnung, status: "offen" });
        }
        zahlungenService.remove(zahlung.id);
        setZahlungen(zahlungenService.list());
    };

    const daten = zahlungen.map(item => ({
        ...item,
        referenz: item.rechnungsnr || item.bestellNr || "-",
        bezugTyp: item.rechnungsnr ? "Rechnung" : item.bestellNr ? "Bestellung" : "-",
        statusSicht: getPaymentOpenItemStatus(item) === "bezahlt" ? "ausgeführt" : getPaymentOpenItemStatus(item)
    }));

    return <>
        <h1>Lehrkraft: Zahlungen extern</h1>
        <p>Externe Zahlungen werden hier aus Lehrkraftsicht gepflegt. Zahlungen können entweder auf eigene Rechnungen oder direkt auf eigene Bestellungen bei Lieferanten verweisen.</p>
        <OverviewCards cards={[
            { label: "Zahlungen gesamt", value: zahlungen.length },
            { label: "Geplant / offen", value: zahlungen.filter(isPendingPayment).length },
            { label: "Zu Rechnungen", value: zahlungen.filter(item => !!item.rechnungsnr).length },
            { label: "Zu Bestellungen", value: zahlungen.filter(item => !!item.bestellNr).length }
        ]}/>
        <DataTable
            title="Externe Zahlungen"
            selectableColumns={false}
            data={daten}
            focusRowId={focusRef}
            focusField="rechnungsnr"
            columns={[
                { field: "datum", title: "Datum" },
                { field: "bezugTyp", title: "Bezug" },
                { field: "referenz", title: "Referenz", render: row => {
                    if (row.rechnungId) return <Link className="detail-link" to={`/rechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link>;
                    if (row.bestellungId) return <Link className="detail-link" to={`/bestellungen?focus=${row.bestellungId}`}>{row.bestellNr}</Link>;
                    return row.referenz;
                } },
                { field: "kunde", title: "Partner" },
                { field: "zahlungsart", title: "Art" },
                { field: "ausfuehrenAm", title: "Ausführen am" },
                { field: "betrag", title: "Betrag" },
                { field: "statusSicht", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "referenz" && row.rechnungId) return `/rechnungen?focus=${row.rechnungsnr}`;
                if (field === "referenz" && row.bestellungId) return `/bestellungen?focus=${row.bestellungId}`;
                return null;
            }}
            toolbarActions={[{ name: "new", label: "Zahlung anlegen", permission: "gf", onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "execute", label: "Ausführen", permission: "gf", onClick: ausfuehren, variant: "success", isVisible: row => row.status !== "ausgefuehrt" },
                { name: "cancel", label: "Stornieren", permission: "gf", onClick: stornieren, variant: "danger" }
            ]}
        />
        <Dialog open={open} title="Externe Zahlung anlegen" onClose={() => setOpen(false)}>
            <div><Label>Bezug</Label><select value={bezugTyp} onChange={event => setBezugTyp(event.target.value)}><option>Rechnung</option><option>Bestellung</option></select></div>
            {bezugTyp === "Rechnung" ? <div><Label>Rechnung</Label><LookupField value={rechnungId} options={rechnungsOptionen} onChange={value => {
                setRechnungId(value);
                const rechnung = rechnungenService.getById(Number(value));
                setBetrag(Number(rechnung?.betrag || 0));
                setAusfuehrenAm(rechnung?.faelligAm || today);
            }} placeholder="Rechnung suchen..."/></div> : <div><Label>Bestellung</Label><LookupField value={bestellungId} options={bestellOptionen} onChange={value => {
                setBestellungId(value);
                setBetrag(0);
                setAusfuehrenAm(today);
            }} placeholder="Bestellung suchen..."/></div>}
            <div className="form-row">
                <div><Label>Betrag</Label><NumberField value={betrag} min="0" onChange={wert => setBetrag(Number(wert || 0))}/></div>
                <div><Label>Ausführen am</Label><input type="date" value={ausfuehrenAm} onChange={event => setAusfuehrenAm(event.target.value)}/></div>
            </div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

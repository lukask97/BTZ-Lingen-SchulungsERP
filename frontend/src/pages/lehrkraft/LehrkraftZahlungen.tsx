import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import { PERMISSIONS } from "../../constants/permissions";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import OverviewCards from "../../components/OverviewCards";
import bestellungenService from "../../services/einkauf/bestellungenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import zahlungenService from "../../services/buchhaltung/zahlungenService";
import { getBerlinDate } from "../../utils/dateTime";
import { getPaymentOpenItemStatus, isPendingPayment } from "../../utils/openItems";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";

export default function LehrkraftZahlungen() {
    const today = getBerlinDate();
    const [searchParams] = useSearchParams();
    const [zahlungen, setZahlungen] = useSyncedServiceData(
        ["zahlungen", "auftraege", "bestellungen"],
        () => zahlungenService.list()
    );
    const [open, setOpen] = useState(false);
    const [bezugTyp, setBezugTyp] = useState("Rechnung");
    const [rechnungId, setRechnungId] = useState("");
    const [bestellungId, setBestellungId] = useState("");
    const [betrag, setBetrag] = useState(0);
    const [ausfuehrenAm, setAusfuehrenAm] = useState(today);
    const [fehler, setFehler] = useState("");

    const rechnungen = rechnungenService.list();
    const bestellungen = bestellungenService.list();
    const focusRef = searchParams.get("focus") || "";

    const rechnungsOptionen = rechnungen.map(item => ({ value: String(item.id), label: `${item.rechnungsnr} - ${item.kunde}` }));
    const bestellOptionen = bestellungen.map(item => ({ value: String(item.id), label: `${item.bestellNr} - ${item.lieferant}` }));

    const neu = () => {
        const ersteRechnung = rechnungen[0];
        const ersteBestellung = bestellungen[0];
        setFehler("");
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
            if (!rechnung || Number(betrag) <= 0 || !ausfuehrenAm) {
                setFehler("Bitte Bezug, Betrag und Ausfuehrungsdatum ausfuellen.");
                return;
            }
            zahlungenService.create({
                rechnungId: rechnung.id,
                zahlungsart: rechnung.rechnungstyp === "Eingangsrechnung" ? "Ausgang" : "Eingang",
                datum: today,
                ausfuehrenAm,
                betrag: Number(betrag),
                methode: "Überweisung",
                status: "geplant"
            });
        } else {
            const bestellung = bestellungen.find(item => String(item.id) === String(bestellungId));
            if (!bestellung || Number(betrag) <= 0 || !ausfuehrenAm) {
                setFehler("Bitte Bezug, Betrag und Ausfuehrungsdatum ausfuellen.");
                return;
            }
            zahlungenService.create({
                bestellungId: bestellung.id,
                zahlungsart: "Ausgang",
                datum: today,
                ausfuehrenAm,
                betrag: Number(betrag),
                methode: "Überweisung",
                status: "geplant"
            });
        }
        setFehler("");
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
        bezugTyp: item.rechnungId ? "Rechnung" : item.bestellungId ? "Bestellung" : "-",
        statusSicht: getPaymentOpenItemStatus(item) === "bezahlt" ? "ausgeführt" : getPaymentOpenItemStatus(item)
    }));

    return <>
        <h1>Lehrkraft: Zahlungen extern</h1>
        <p>Externe Zahlungen werden hier aus Lehrkraftsicht gepflegt. Zahlungen können entweder auf eigene Rechnungen oder direkt auf eigene Bestellungen bei Lieferanten verweisen.</p>
        <OverviewCards cards={[
            { label: "Zahlungen gesamt", value: zahlungen.length },
            { label: "Geplant / offen", value: zahlungen.filter(isPendingPayment).length },
            { label: "Zu Rechnungen", value: zahlungen.filter(item => !!item.rechnungId).length },
            { label: "Zu Bestellungen", value: zahlungen.filter(item => !!item.bestellungId).length }
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
            toolbarActions={[{ name: "new", label: "Zahlung anlegen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "execute", label: "Ausführen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: ausfuehren, variant: "success", isVisible: row => row.status !== "ausgefuehrt" },
                { name: "cancel", label: "Stornieren", permission: PERMISSIONS.GF_BEARBEITEN, onClick: stornieren, variant: "danger" }
            ]}
        />
        <Dialog open={open} title="Externe Zahlung anlegen" onClose={() => {
            setFehler("");
            setOpen(false);
        }}>
            <div><Label required>Bezug</Label><select value={bezugTyp} onChange={event => {
                setFehler("");
                setBezugTyp(event.target.value);
            }}><option>Rechnung</option><option>Bestellung</option></select></div>
            {bezugTyp === "Rechnung" ? <div><Label required>Rechnung</Label><LookupField value={rechnungId} options={rechnungsOptionen} onChange={value => {
                setFehler("");
                setRechnungId(value);
                const rechnung = rechnungenService.getById(Number(value));
                setBetrag(Number(rechnung?.betrag || 0));
                setAusfuehrenAm(rechnung?.faelligAm || today);
            }} placeholder="Rechnung suchen..."/></div> : <div><Label required>Bestellung</Label><LookupField value={bestellungId} options={bestellOptionen} onChange={value => {
                setFehler("");
                setBestellungId(value);
                setBetrag(0);
                setAusfuehrenAm(today);
            }} placeholder="Bestellung suchen..."/></div>}
            <div className="form-row">
                <div><Label required>Betrag</Label><NumberField value={betrag} min="0" onChange={wert => {
                    setFehler("");
                    setBetrag(Number(wert || 0));
                }}/></div>
                <div><Label required>Ausführen am</Label><input type="date" value={ausfuehrenAm} onChange={event => {
                    setFehler("");
                    setAusfuehrenAm(event.target.value);
                }}/></div>
            </div>
            <div className="form-row">
                {fehler && <p className="form-error">{fehler}</p>}
                <button onClick={speichern}>Speichern</button>
            </div>
        </Dialog>
    </>;
}

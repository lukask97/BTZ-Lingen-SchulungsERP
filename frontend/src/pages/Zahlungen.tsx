// @ts-nocheck
import { Link } from "react-router-dom";
import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import LookupField from "../components/form/LookupField";
import NumberField from "../components/form/NumberField";
import OverviewCards from "../components/OverviewCards";
import rechnungenService from "../services/rechnungenService";
import zahlungenService from "../services/zahlungenService";
import kundenService from "../services/customerService";
import lieferantenService from "../services/lieferantenService";

const today = "2026-07-26";

export default function Zahlungen() {
    const [zahlungen, setZahlungen] = useState(zahlungenService.list());
    const [open, setOpen] = useState(false);
    const [rechnungId, setRechnungId] = useState("");
    const [betrag, setBetrag] = useState(0);
    const rechnungen = rechnungenService.list().filter(item => item.status === "offen");
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
        setOpen(true);
    };

    const speichern = () => {
        const rechnung = rechnungenService.getById(Number(rechnungId));
        if (!rechnung) return;
        zahlungenService.create({
            rechnungsnr: rechnung.rechnungsnr,
            zahlungsart: rechnung.rechnungstyp === "Eingangsrechnung" ? "Ausgang" : "Eingang",
            kunde: rechnung.kunde,
            datum: today,
            betrag: Number(betrag),
            methode: "Überweisung"
        });
        rechnungenService.update({ ...rechnung, status: "bezahlt" });
        setZahlungen(zahlungenService.list());
        setOpen(false);
    };

    const stornieren = (zahlung) => {
        const rechnung = rechnungenService.list().find(item => item.rechnungsnr === zahlung.rechnungsnr);
        if (rechnung) {
            rechnungenService.update({ ...rechnung, status: "offen" });
        }
        zahlungenService.remove(zahlung.id);
        setZahlungen(zahlungenService.list());
    };

    const summe = zahlungen.reduce((total, item) => total + Number(item.betrag), 0);
    const eingaenge = zahlungen.filter(item => item.zahlungsart !== "Ausgang").length;
    const ausgaenge = zahlungen.filter(item => item.zahlungsart === "Ausgang").length;

    return <>
        <OverviewCards cards={[
            { label: "Zahlungen", value: zahlungen.length },
            { label: "Zahlungseingänge", value: eingaenge },
            { label: "Zahlungsausgänge", value: ausgaenge },
            { label: "Summe", value: `${summe.toFixed(2)} €` },
            { label: "Offene Rechnungen", value: rechnungen.length }
        ]}/>
        <DataTable
            title="Zahlungen"
            selectableColumns={false}
            data={zahlungen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "rechnungsnr", title: "Rechnung", render: row => <Link className="detail-link" to={`/rechnungen?focus=${row.rechnungsnr}`}>{row.rechnungsnr}</Link> },
                { field: "zahlungsart", title: "Art" },
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
            toolbarActions={[{ name: "new", label: "Zahlung erfassen", permission: "buchhaltung.bearbeiten", onClick: neu, variant: "success" }]}
            rowActions={[{ name: "cancel", label: "Stornieren", permission: "buchhaltung.bearbeiten", onClick: stornieren, variant: "danger" }]}
        />
        <Dialog open={open} title="Zahlung erfassen" onClose={() => setOpen(false)}>
            <div><Label>Rechnung</Label><LookupField value={rechnungId} options={rechnungsOptionen} onChange={setRechnungId} placeholder="Rechnung suchen..."/></div>
            <div><Label>Betrag</Label><NumberField value={betrag} min="0" onChange={setBetrag}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

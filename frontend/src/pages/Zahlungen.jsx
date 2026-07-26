import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import NumberField from "../components/form/NumberField";
import OverviewCards from "../components/OverviewCards";
import rechnungenService from "../services/rechnungenService";
import zahlungenService from "../services/zahlungenService";

const today = "2026-07-26";

export default function Zahlungen() {
    const [zahlungen, setZahlungen] = useState(zahlungenService.list());
    const [open, setOpen] = useState(false);
    const [rechnungId, setRechnungId] = useState("");
    const [betrag, setBetrag] = useState(0);
    const rechnungen = rechnungenService.list().filter(item => item.status === "offen");

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

    return <>
        <OverviewCards cards={[
            { label: "Zahlungen", value: zahlungen.length },
            { label: "Summe", value: `${summe.toFixed(2)} €` },
            { label: "Offene Rechnungen", value: rechnungen.length }
        ]}/>
        <DataTable
            title="Zahlungen"
            selectableColumns={false}
            data={zahlungen}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "rechnungsnr", title: "Rechnung" },
                { field: "kunde", title: "Kunde" },
                { field: "betrag", title: "Betrag" },
                { field: "methode", title: "Methode" }
            ]}
            toolbarActions={[{ name: "new", label: "Zahlung erfassen", permission: "buchhaltung.bearbeiten", onClick: neu, variant: "success" }]}
            rowActions={[{ name: "cancel", label: "Stornieren", permission: "buchhaltung.bearbeiten", onClick: stornieren, variant: "danger" }]}
        />
        <Dialog open={open} title="Zahlung erfassen" onClose={() => setOpen(false)}>
            <div><Label>Rechnung</Label><select value={rechnungId} onChange={event => setRechnungId(event.target.value)}>
                {rechnungen.map(item => <option key={item.id} value={item.id}>{item.rechnungsnr} - {item.kunde}</option>)}
            </select></div>
            <div><Label>Betrag</Label><NumberField value={betrag} min="0" onChange={setBetrag}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

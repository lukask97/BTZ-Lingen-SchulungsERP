import { useMemo, useState } from "react";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import NumberField from "../components/form/NumberField";
import TextField from "../components/form/TextField";
import OverviewCards from "../components/OverviewCards";
import firmenkontoService from "../services/firmenkontoService";

const euro = (betrag) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(betrag || 0));
const today = "2026-07-26";

function withSaldo(rows) {
    let saldo = 0;
    return rows.map(row => {
        saldo += Number(row.haben || 0) - Number(row.soll || 0);
        return { ...row, saldo };
    });
}

export default function Firmenkonto() {
    const [rows, setRows] = useState(firmenkontoService.list());
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [current, setCurrent] = useState({ datum: today, betreff: "", info: "", soll: 0, haben: 0 });

    const kontoRows = useMemo(() => withSaldo(rows), [rows]);
    const aktuellerSaldo = kontoRows.at(-1)?.saldo || 0;
    const einnahmen = kontoRows.reduce((sum, row) => sum + Number(row.haben || 0), 0);
    const ausgaben = kontoRows.reduce((sum, row) => sum + Number(row.soll || 0), 0);

    const speichern = () => {
        if (!current.betreff.trim()) return;
        const payload = {
            ...current,
            datum: current.datum || today,
            betreff: current.betreff.trim(),
            info: current.info.trim()
        };

        if (editId) {
            firmenkontoService.update(editId, payload);
        } else {
            firmenkontoService.create(payload);
        }

        setRows(firmenkontoService.list());
        setCurrent({ datum: today, betreff: "", info: "", soll: 0, haben: 0 });
        setEditId(null);
        setOpen(false);
    };

    const bearbeiten = (row) => {
        setCurrent({
            datum: row.datum || today,
            betreff: row.betreff || "",
            info: row.info || "",
            soll: Number(row.soll || 0),
            haben: Number(row.haben || 0)
        });
        setEditId(row.id);
        setOpen(true);
    };

    const loeschen = (id) => {
        firmenkontoService.remove(id);
        setRows(firmenkontoService.list());
    };

    const abbrechen = () => {
        setCurrent({ datum: today, betreff: "", info: "", soll: 0, haben: 0 });
        setEditId(null);
        setOpen(false);
    };

    return <>
        <h1>Firmenkonto</h1>
        <p>Einfaches Schulungs-Mockup für Zahlungsein- und -ausgänge. Die Seite zeigt nur eine verständliche Hilfestellung für den Umgang mit einem Geschäftskonto.</p>
        <OverviewCards cards={[
            { label: "Aktueller Saldo", value: euro(aktuellerSaldo) },
            { label: "Eingänge", value: euro(einnahmen) },
            { label: "Ausgänge", value: euro(ausgaben) }
        ]}/>
        <section className="module-panel">
            <div className="firmenkonto-header">
                <div>
                    <strong>Firmenkonto</strong>
                    <p className="module-hint">Laufende Übersicht über Zahlungen, Verwendungszweck und Kontostand.</p>
                </div>
                <button className="button-secondary" onClick={() => setOpen(true)}>Buchung ergänzen</button>
            </div>
            <table className="datatable firmenkonto-table">
                <thead>
                <tr>
                    <th>Datum</th>
                    <th>Betreff (Grund der Zahlung)</th>
                    <th>Info (z.B. RgNr, Nr., Projekt, etc.)</th>
                    <th>Soll (Ausgang)</th>
                    <th>Haben (Eingang)</th>
                    <th>Saldo</th>
                    <th>Aktionen</th>
                </tr>
                </thead>
                <tbody>
                {kontoRows.map(row => <tr key={row.id}>
                    <td>{row.datum || ""}</td>
                    <td>{row.betreff || ""}</td>
                    <td>{row.info || ""}</td>
                    <td>{Number(row.soll || 0) > 0 ? euro(row.soll) : ""}</td>
                    <td>{Number(row.haben || 0) > 0 ? euro(row.haben) : ""}</td>
                    <td>{euro(row.saldo)}</td>
                    <td>
                        {row.betreff ? <div className="table-actions">
                            <button className="button-secondary" onClick={() => bearbeiten(row)}>Bearbeiten</button>
                            <button className="button-danger" onClick={() => loeschen(row.id)}>Löschen</button>
                        </div> : <span className="module-hint">Leerzeile</span>}
                    </td>
                </tr>)}
                </tbody>
            </table>
        </section>

        <Dialog open={open} title={editId ? "Buchung bearbeiten" : "Buchung ergänzen"} onClose={abbrechen}>
            <div><Label>Datum</Label><TextField type="date" value={current.datum} onChange={value => setCurrent(item => ({ ...item, datum: value }))}/></div>
            <div><Label>Betreff</Label><TextField value={current.betreff} onChange={value => setCurrent(item => ({ ...item, betreff: value }))}/></div>
            <div className="form-row"><Label>Info</Label><TextField value={current.info} onChange={value => setCurrent(item => ({ ...item, info: value }))}/></div>
            <div><Label>Soll</Label><NumberField value={current.soll} min="0" onChange={value => setCurrent(item => ({ ...item, soll: Number(value) }))}/></div>
            <div><Label>Haben</Label><NumberField value={current.haben} min="0" onChange={value => setCurrent(item => ({ ...item, haben: Number(value) }))}/></div>
            <div className="form-row firmenkonto-dialog-actions">
                <button className="button-secondary" onClick={abbrechen}>Abbrechen</button>
                <button onClick={speichern}>{editId ? "Änderungen speichern" : "Speichern"}</button>
            </div>
        </Dialog>
    </>;
}

import { useMemo, useState } from "react";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import NumberField from "../../components/form/NumberField";
import SaveButton from "../../components/SaveButton";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import useAuth from "../../auth/useAuth";
import { ACCESS } from "../../constants/permissions";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import firmenkontoService, { KONTO_TYPEN, STANDARD_EINKAUFSKONTO_ZIEL } from "../../services/buchhaltung/firmenkontoService";
import { getBerlinDate } from "../../utils/dateTime";

const euro = (betrag) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(betrag || 0));

function withSaldo(rows) {
    let saldo = 0;
    return rows.map(row => {
        saldo += Number(row.haben || 0) - Number(row.soll || 0);
        return { ...row, saldo };
    });
}

function getAccountLabel(konto) {
    if (konto === KONTO_TYPEN.VERKAUF) return "Verkaufskonto";
    if (konto === KONTO_TYPEN.EINKAUF) return "Einkaufskonto";
    return "Firmenkonto";
}

function getVisibleAccounts({ canReadBuchhaltung, canReadGf, canReadVerkauf, canReadEinkauf }) {
    if (canReadBuchhaltung || canReadGf) {
        return [KONTO_TYPEN.FIRMA, KONTO_TYPEN.VERKAUF, KONTO_TYPEN.EINKAUF];
    }

    const visible = [];
    if (canReadVerkauf) visible.push(KONTO_TYPEN.VERKAUF);
    if (canReadEinkauf) visible.push(KONTO_TYPEN.EINKAUF);
    return visible;
}

export default function Firmenkonto() {
    const today = getBerlinDate();
    const { hasAccess } = useAuth();
    const canReadBuchhaltung = hasAccess(ACCESS.BUCHHALTUNG);
    const canReadGf = hasAccess(ACCESS.GESCHAEFTSFUEHRUNG);
    const canReadVerkauf = hasAccess(ACCESS.VERKAUF);
    const canReadEinkauf = hasAccess(ACCESS.EINKAUF);
    const canManageAllAccounts = canReadBuchhaltung || canReadGf;
    const visibleAccounts = getVisibleAccounts({ canReadBuchhaltung, canReadGf, canReadVerkauf, canReadEinkauf });

    const [rows, setRows] = useSyncedServiceData(["firmenkonto"], () => firmenkontoService.list());
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [status, setStatus] = useState("");
    const [targetAmount, setTargetAmount] = useState(() => firmenkontoService.getSettings().einkaufskontoZiel || STANDARD_EINKAUFSKONTO_ZIEL);
    const [selectedAccount, setSelectedAccount] = useState(() => {
        if (canManageAllAccounts) return KONTO_TYPEN.FIRMA;
        return visibleAccounts[0] || KONTO_TYPEN.VERKAUF;
    });
    const [current, setCurrent] = useState({ datum: today, konto: selectedAccount, betreff: "", info: "", soll: 0, haben: 0 });

    const rowsByAccount = useMemo(() => ({
        [KONTO_TYPEN.FIRMA]: withSaldo(rows.filter(row => row.konto === KONTO_TYPEN.FIRMA)),
        [KONTO_TYPEN.VERKAUF]: withSaldo(rows.filter(row => row.konto === KONTO_TYPEN.VERKAUF)),
        [KONTO_TYPEN.EINKAUF]: withSaldo(rows.filter(row => row.konto === KONTO_TYPEN.EINKAUF))
    }), [rows]);

    const visibleAccountCards = visibleAccounts.map(konto => {
        const kontoRows = rowsByAccount[konto] || [];
        const saldo = kontoRows.at(-1)?.saldo || 0;
        const eingaenge = kontoRows.reduce((sum, row) => sum + Number(row.haben || 0), 0);
        const ausgaenge = kontoRows.reduce((sum, row) => sum + Number(row.soll || 0), 0);

        return {
            label: getAccountLabel(konto),
            value: euro(saldo),
            hint: `Eingänge ${euro(eingaenge)} / Ausgänge ${euro(ausgaenge)}`
        };
    });

    const activeAccount = canManageAllAccounts ? selectedAccount : (visibleAccounts[0] || KONTO_TYPEN.VERKAUF);
    const activeRows = rowsByAccount[activeAccount] || [];
    const einkaufssaldo = rowsByAccount[KONTO_TYPEN.EINKAUF].at(-1)?.saldo || 0;
    const verkaufssaldo = rowsByAccount[KONTO_TYPEN.VERKAUF].at(-1)?.saldo || 0;
    const firmensaldo = rowsByAccount[KONTO_TYPEN.FIRMA].at(-1)?.saldo || 0;

    const speichern = () => {
        if (!current.betreff.trim()) return false;

        const payload = {
            ...current,
            datum: current.datum || today,
            konto: current.konto || activeAccount,
            betreff: current.betreff.trim(),
            info: current.info.trim(),
            soll: Number(current.soll || 0),
            haben: Number(current.haben || 0)
        };

        if (editId) {
            firmenkontoService.update(editId, payload);
        } else {
            firmenkontoService.create(payload);
        }

        setRows(firmenkontoService.list());
        setCurrent({ datum: today, konto: activeAccount, betreff: "", info: "", soll: 0, haben: 0 });
        setEditId(null);
        setStatus("Buchung gespeichert.");
        return true;
    };

    const bearbeiten = (row) => {
        setCurrent({
            datum: row.datum || today,
            konto: row.konto || activeAccount,
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
        setStatus("Buchung gelöscht.");
    };

    const abbrechen = () => {
        setCurrent({ datum: today, konto: activeAccount, betreff: "", info: "", soll: 0, haben: 0 });
        setEditId(null);
        setOpen(false);
    };

    const zielbetragSpeichern = () => {
        firmenkontoService.updateSettings({ einkaufskontoZiel: targetAmount });
        setStatus(`Zielbestand für das Einkaufskonto gespeichert: ${euro(targetAmount)}.`);
    };

    const wochenabschlussAusfuehren = () => {
        firmenkontoService.updateSettings({ einkaufskontoZiel: targetAmount });
        const result = firmenkontoService.runWeeklyTransfer(today, targetAmount);
        setRows(firmenkontoService.list());

        const messages = [];
        if (result.salesTransfer.amount > 0) {
            messages.push(`${euro(result.salesTransfer.amount)} vom Verkaufskonto ins Firmenkonto verschoben`);
        }
        if (result.purchasingTransfer.amount > 0) {
            messages.push(`${euro(result.purchasingTransfer.amount)} ins Einkaufskonto aufgefüllt`);
        }
        if (messages.length === 0) {
            messages.push("Kein Transfer nötig. Verkaufskonto ist leer und das Einkaufskonto liegt bereits auf oder über dem Zielbestand.");
        }
        setStatus(messages.join(" / "));
    };

    return <>
        <h1>Kontenübersicht</h1>
        <p>Verkauf und Einkauf arbeiten mit getrennten Bereichskonten. Der volle Kontostand des Firmenkontos bleibt auf Buchhaltung und Geschäftsführung beschränkt.</p>
        <OverviewCards cards={visibleAccountCards}/>

        {canManageAllAccounts && <section className="module-panel">
            <div className="firmenkonto-control-grid">
                <div className="firmenkonto-control-card">
                    <strong>Wochenabschluss</strong>
                    <p className="module-hint">Am Montag, 3. August 2026, kannst du den Sammeltransfer manuell auslösen: zuerst Verkauf ins Firmenkonto, danach Auffüllung des Einkaufskontos bis zum Zielbestand.</p>
                    <button type="button" className="button-secondary" onClick={wochenabschlussAusfuehren}>Wochenabschluss ausführen</button>
                </div>
                <div className="firmenkonto-control-card">
                    <strong>Zielbestand Einkauf</strong>
                    <p className="module-hint">Dieser Wert legt fest, auf welchen Bestand das Einkaufskonto nach dem Wochenabschluss aufgefüllt wird.</p>
                    <div className="firmenkonto-target-row">
                        <NumberField value={targetAmount} min="0" onChange={value => setTargetAmount(Number(value || 0))}/>
                        <button type="button" onClick={zielbetragSpeichern}>Ziel speichern</button>
                    </div>
                </div>
            </div>
            <div className="kennzahlen">
                <div className="kennzahl"><span>Firmenkonto</span><strong>{euro(firmensaldo)}</strong></div>
                <div className="kennzahl"><span>Verkaufskonto</span><strong>{euro(verkaufssaldo)}</strong></div>
                <div className="kennzahl"><span>Einkaufskonto</span><strong>{euro(einkaufssaldo)}</strong></div>
                <div className="kennzahl"><span>Ziel Einkauf</span><strong>{euro(targetAmount)}</strong></div>
            </div>
        </section>}

        {status && <p className="module-hint firmenkonto-status">{status}</p>}

        <section className="module-panel">
            <div className="firmenkonto-header">
                <div>
                    <strong>{canManageAllAccounts ? "Kontobewegungen" : getAccountLabel(activeAccount)}</strong>
                    <p className="module-hint">Jede Buchung wird einem Konto zugeordnet. Verkauf und Einkauf sehen nur die für sie freigegebenen Bereichskonten.</p>
                </div>
                <div className="firmenkonto-header-actions">
                    {canManageAllAccounts && <select value={selectedAccount} onChange={event => {
                        setSelectedAccount(event.target.value);
                        setCurrent(item => ({ ...item, konto: event.target.value }));
                    }}>
                        <option value={KONTO_TYPEN.FIRMA}>Firmenkonto</option>
                        <option value={KONTO_TYPEN.VERKAUF}>Verkaufskonto</option>
                        <option value={KONTO_TYPEN.EINKAUF}>Einkaufskonto</option>
                    </select>}
                    {canManageAllAccounts && <button type="button" className="button-secondary" onClick={() => {
                        setCurrent(item => ({ ...item, konto: activeAccount }));
                        setOpen(true);
                    }}>Buchung ergänzen</button>}
                </div>
            </div>

            <table className="datatable firmenkonto-table">
                <thead>
                <tr>
                    <th>Datum</th>
                    {canManageAllAccounts && <th>Konto</th>}
                    <th>Betreff</th>
                    <th>Info</th>
                    <th>Soll</th>
                    <th>Haben</th>
                    <th>Saldo</th>
                    {canManageAllAccounts && <th>Aktionen</th>}
                </tr>
                </thead>
                <tbody>
                {activeRows.length === 0 ? <tr>
                    <td colSpan={canManageAllAccounts ? 8 : 6}>Noch keine Buchungen vorhanden.</td>
                </tr> : activeRows.map(row => <tr key={row.id}>
                    <td>{row.datum || ""}</td>
                    {canManageAllAccounts && <td>{getAccountLabel(row.konto)}</td>}
                    <td>{row.betreff || ""}</td>
                    <td>{row.info || ""}</td>
                    <td>{Number(row.soll || 0) > 0 ? euro(row.soll) : ""}</td>
                    <td>{Number(row.haben || 0) > 0 ? euro(row.haben) : ""}</td>
                    <td>{euro(row.saldo)}</td>
                    {canManageAllAccounts && <td>
                        <div className="table-actions">
                            <button type="button" className="button-secondary" onClick={() => bearbeiten(row)}>Bearbeiten</button>
                            <button type="button" className="button-danger" onClick={() => loeschen(row.id)}>Löschen</button>
                        </div>
                    </td>}
                </tr>)}
                </tbody>
            </table>
        </section>

        <Dialog
            open={open}
            title={editId ? "Buchung bearbeiten" : "Buchung ergänzen"}
            onClose={abbrechen}
            footer={<SaveButton onSave={speichern} onSuccess={abbrechen}>{editId ? "Änderungen speichern" : "Speichern"}</SaveButton>}
        >
            <div><Label>Datum</Label><TextField type="date" value={current.datum} onChange={value => setCurrent(item => ({ ...item, datum: value }))}/></div>
            <div><Label>Konto</Label><select value={current.konto} onChange={event => setCurrent(item => ({ ...item, konto: event.target.value }))}>
                <option value={KONTO_TYPEN.FIRMA}>Firmenkonto</option>
                <option value={KONTO_TYPEN.VERKAUF}>Verkaufskonto</option>
                <option value={KONTO_TYPEN.EINKAUF}>Einkaufskonto</option>
            </select></div>
            <div><Label>Betreff</Label><TextField value={current.betreff} onChange={value => setCurrent(item => ({ ...item, betreff: value }))}/></div>
            <div className="form-row"><Label>Info</Label><TextField value={current.info} onChange={value => setCurrent(item => ({ ...item, info: value }))}/></div>
            <div><Label>Soll</Label><NumberField value={current.soll} min="0" onChange={value => setCurrent(item => ({ ...item, soll: Number(value || 0) }))}/></div>
            <div><Label>Haben</Label><NumberField value={current.haben} min="0" onChange={value => setCurrent(item => ({ ...item, haben: Number(value || 0) }))}/></div>
        </Dialog>
    </>;
}

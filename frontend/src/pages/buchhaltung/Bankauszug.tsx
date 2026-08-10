import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import HelpHint from "../../components/HelpHint";
import OverviewCards from "../../components/OverviewCards";
import useAuth from "../../auth/useAuth";
import { ACCESS } from "../../constants/permissions";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import firmenkontoService, { KONTO_TYPEN } from "../../services/buchhaltung/firmenkontoService";

const euro = (betrag: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(betrag || 0));

function withSaldo(rows: any[]) {
    let saldo = 0;
    return rows.map(row => {
        saldo += Number(row.haben || 0) - Number(row.soll || 0);
        return { ...row, saldo };
    });
}

function getAccountLabel(konto: string) {
    if (konto === KONTO_TYPEN.VERKAUF) return "Verkaufskonto";
    if (konto === KONTO_TYPEN.EINKAUF) return "Einkaufskonto";
    return "Firmenkonto";
}

function getAccountHint(konto: string) {
    if (konto === KONTO_TYPEN.VERKAUF) {
        return "Hier liegen die Zahlungseingänge aus dem Verkauf, bis sie intern weiter übertragen werden.";
    }
    if (konto === KONTO_TYPEN.EINKAUF) {
        return "Hier werden Ausgaben für Bestellungen und Beschaffung sichtbar.";
    }
    return "Das Firmenkonto ist das zentrale Hauptkonto der Buchhaltung.";
}

function getVisibleAccounts({ canReadBuchhaltung, canReadGf, canReadVerkauf, canReadEinkauf }: any) {
    if (canReadBuchhaltung || canReadGf) {
        return [KONTO_TYPEN.FIRMA, KONTO_TYPEN.VERKAUF, KONTO_TYPEN.EINKAUF];
    }

    const visible = [];
    if (canReadVerkauf) visible.push(KONTO_TYPEN.VERKAUF);
    if (canReadEinkauf) visible.push(KONTO_TYPEN.EINKAUF);
    return visible;
}

export default function Bankauszug() {
    const { hasAccess } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const canReadBuchhaltung = hasAccess(ACCESS.BUCHHALTUNG);
    const canReadGf = hasAccess(ACCESS.GESCHAEFTSFUEHRUNG);
    const canReadVerkauf = hasAccess(ACCESS.VERKAUF);
    const canReadEinkauf = hasAccess(ACCESS.EINKAUF);
    const visibleAccounts = getVisibleAccounts({ canReadBuchhaltung, canReadGf, canReadVerkauf, canReadEinkauf });
    const [rows] = useSyncedServiceData(["firmenkonto"], () => firmenkontoService.list());

    const requestedAccount = searchParams.get("konto") || "";
    const activeAccount = visibleAccounts.includes(requestedAccount as any)
        ? requestedAccount
        : (visibleAccounts[0] || KONTO_TYPEN.FIRMA);

    const rowsByAccount = useMemo(() => ({
        [KONTO_TYPEN.FIRMA]: withSaldo(rows.filter(row => row.konto === KONTO_TYPEN.FIRMA)),
        [KONTO_TYPEN.VERKAUF]: withSaldo(rows.filter(row => row.konto === KONTO_TYPEN.VERKAUF)),
        [KONTO_TYPEN.EINKAUF]: withSaldo(rows.filter(row => row.konto === KONTO_TYPEN.EINKAUF))
    }), [rows]);

    const activeRows = rowsByAccount[activeAccount] || [];
    const saldo = activeRows.at(-1)?.saldo || 0;
    const eingaenge = activeRows.reduce((sum, row) => sum + Number(row.haben || 0), 0);
    const ausgaenge = activeRows.reduce((sum, row) => sum + Number(row.soll || 0), 0);

    return <>
        <h1>Bankauszug</h1>
        <p>Der Bankauszug zeigt die Kontobewegungen je Konto. Je nach Rolle siehst du das Firmenkonto, das Verkaufskonto, das Einkaufskonto oder nur die für dich freigegebenen Bereichskonten. <HelpHint text="Der Bankauszug zeigt die einzelnen Kontobewegungen eines Kontos in zeitlicher Reihenfolge." delay={300} /></p>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Konten auswählen</h2>
                <span>Bankansicht</span>
            </div>
            <div className="buchhaltung-tab-row" role="tablist" aria-label="Bankkonten">
                {visibleAccounts.map(konto => <button
                    key={konto}
                    type="button"
                    role="tab"
                    aria-selected={activeAccount === konto}
                    className={`buchhaltung-tab${activeAccount === konto ? " is-active" : ""}`}
                    onClick={() => {
                        const nextParams = new URLSearchParams(searchParams);
                        nextParams.set("konto", konto);
                        setSearchParams(nextParams, { replace: true });
                    }}
                >
                    {getAccountLabel(konto)}
                </button>)}
            </div>
            <p className="module-hint">{getAccountHint(activeAccount)}</p>
        </section>

        <OverviewCards cards={[
            { label: "Aktives Konto", value: getAccountLabel(activeAccount), note: "Ausgewählter Bankauszug" },
            { label: "Buchungen", value: activeRows.length, note: "Kontobewegungen im Auszug" },
            { label: "Eingänge", value: euro(eingaenge), note: "Summe Haben" },
            { label: "Ausgänge", value: euro(ausgaenge), note: "Summe Soll" },
            { label: "Saldo", value: euro(saldo), note: "Laufender Kontostand" }
        ]}/>
        <p className="module-hint">
            Jede Zeile zeigt eine Kontobewegung. <strong>Soll</strong> steht für Abgang, <strong>Haben</strong> für Zugang, der <strong>Saldo</strong> für den Kontostand nach der Buchung.
        </p>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>{getAccountLabel(activeAccount)}</h2>
                <span>Kontobewegungen</span>
            </div>
            <table className="datatable firmenkonto-table">
                <thead>
                <tr>
                    <th>Datum</th>
                    <th>Betreff</th>
                    <th>Info</th>
                    <th><span className="datatable-header">Soll <HelpHint text="Soll zeigt bei einem Konto einen Abgang oder eine Belastung auf diesem Konto." delay={300} /></span></th>
                    <th><span className="datatable-header">Haben <HelpHint text="Haben zeigt bei einem Konto einen Zugang oder eine Gutschrift auf diesem Konto." delay={300} /></span></th>
                    <th><span className="datatable-header">Saldo <HelpHint text="Der Saldo ist der aktuelle Kontostand nach Berücksichtigung aller bisherigen Soll- und Haben-Buchungen." delay={300} /></span></th>
                </tr>
                </thead>
                <tbody>
                {activeRows.length === 0 ? <tr><td colSpan={6}>Noch keine Buchungen vorhanden.</td></tr> : activeRows.map(row => <tr key={row.id}>
                    <td>{row.datum || ""}</td>
                    <td>{row.betreff || ""}</td>
                    <td>{row.info || ""}</td>
                    <td>{Number(row.soll || 0) > 0 ? euro(row.soll) : ""}</td>
                    <td>{Number(row.haben || 0) > 0 ? euro(row.haben) : ""}</td>
                    <td>{euro(row.saldo)}</td>
                </tr>)}
                </tbody>
            </table>
        </section>
        <div className="link-list">
            <Link className="button-link" to="/firmenkonto">Kontenübersicht</Link>
            <Link className="button-link" to="/ausgangsrechnungen">Ausgangsrechnungen</Link>
            <Link className="button-link" to="/eingangsrechnungen">Eingangsrechnungen</Link>
        </div>
    </>;
}

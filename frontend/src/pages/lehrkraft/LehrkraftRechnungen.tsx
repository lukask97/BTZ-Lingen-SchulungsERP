import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable";
import OverviewCards from "../../components/OverviewCards";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";

const today = "2026-07-28";

function getInvoiceViewStatus(rechnung: any) {
    if (rechnung.status === "bezahlt") return "bezahlt";
    if (rechnung.faelligAm && rechnung.faelligAm < today) return "ueberfaellig";
    return "offen";
}

export default function LehrkraftRechnungen() {
    useStorageSyncRefresh(["auftraege", "bestellungen", "artikel", "zahlungen"]);

    const navigate = useNavigate();
    const rechnungen = rechnungenService.list().map(item => ({
        ...item,
        sichtStatus: getInvoiceViewStatus(item),
        bezug: item.rechnungstyp === "Eingangsrechnung" ? "Lieferant -> Schülerfirma" : "Schülerfirma -> Kunde"
    }));

    return <>
        <h1>Lehrkraft: Rechnungen extern</h1>
        <p>Diese Lehrkraftsicht zeigt Rechnungen mit Außenbezug. Damit lässt sich schnell prüfen, welche Rechnungen gegenüber Kunden oder gegenüber der Schülerfirma noch offen sind.</p>
        <OverviewCards cards={[
            { label: "Rechnungen gesamt", value: rechnungen.length },
            { label: "Offen", value: rechnungen.filter(item => item.sichtStatus === "offen").length },
            { label: "Überfällig", value: rechnungen.filter(item => item.sichtStatus === "ueberfaellig").length },
            { label: "Bezahlt", value: rechnungen.filter(item => item.sichtStatus === "bezahlt").length }
        ]}/>
        <DataTable
            title="Rechnungen mit Außenbezug"
            selectableColumns={false}
            data={rechnungen}
            columns={[
                { field: "rechnungsnr", title: "Rechnung" },
                { field: "bezug", title: "Außenbezug" },
                { field: "kunde", title: "Partner" },
                { field: "datum", title: "Datum" },
                { field: "faelligAm", title: "Fällig am" },
                { field: "betrag", title: "Betrag" },
                { field: "sichtStatus", title: "Status" }
            ]}
            rowActions={[
                { name: "payments", label: "Zahlung öffnen", permission: "gf", onClick: row => navigate(`/lehrkraft/zahlungen?focus=${row.rechnungsnr}`), variant: "secondary" },
                { name: "documents", label: "Belege", permission: "gf", onClick: row => navigate(`/belege?bezug=${row.rechnungsnr}`), variant: "secondary" }
            ]}
        />
    </>;
}

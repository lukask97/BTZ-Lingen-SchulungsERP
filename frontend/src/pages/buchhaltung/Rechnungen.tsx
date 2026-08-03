import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import OverviewCards from "../../components/OverviewCards";
import { PERMISSIONS } from "../../constants/permissions";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";
import { getBerlinDate } from "../../utils/dateTime";

function ampelStatus(rechnung: any) {
    const today = getBerlinDate();
    if (rechnung.status === "bezahlt") return "bezahlt";
    if (rechnung.faelligAm && rechnung.faelligAm < today) return "fällig";
    return "offen";
}

export default function Rechnungen() {
    useStorageSyncRefresh(["auftraege", "bestellungen", "artikel", "zahlungen", "nummernkreise"]);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const rechnungen = rechnungenService.list().map(item => ({ ...item, ampel: ampelStatus(item) }));
    const offeneRechnungen = rechnungen.filter(item => item.ampel === "offen");
    const faelligeRechnungen = rechnungen.filter(item => item.ampel === "fällig");
    const bezahlteRechnungen = rechnungen.filter(item => item.ampel === "bezahlt");

    return <>
        <OverviewCards cards={[
            { label: "Abgeleitete Rechnungen", value: rechnungen.length },
            { label: "Offen", value: offeneRechnungen.length },
            { label: "Fällig", value: faelligeRechnungen.length },
            { label: "Bezahlt", value: bezahlteRechnungen.length }
        ]}/>
        <DataTable
            title="Interne Rechnungsübersicht"
            selectableColumns={false}
            data={rechnungen}
            focusRowId={searchParams.get("focus") || ""}
            focusField="rechnungsnr"
            columns={[
                { field: "rechnungsnr", title: "Rechnungsnummer" },
                { field: "rechnungstyp", title: "Typ" },
                { field: "bezug", title: "Bezug", render: row => row.rechnungstyp === "Eingangsrechnung"
                    ? <Link className="detail-link" to={`/bestellungen?focus=${row.bestellungId}`}>{row.bestellNr}</Link>
                    : <Link className="detail-link" to={`/auftraege?focus=${row.auftragId}`}>{row.auftragNr}</Link> },
                { field: "kunde", title: "Partner", render: row => row.rechnungstyp === "Eingangsrechnung"
                    ? (row.lieferantId ? <Link className="detail-link" to={`/lieferanten?focus=${row.lieferantId}`}>{row.kunde}</Link> : row.kunde)
                    : (row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde) },
                { field: "datum", title: "Datum" },
                { field: "faelligAm", title: "Fällig am" },
                { field: "betrag", title: "Betrag" },
                { field: "ampel", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "bezug" && row.rechnungstyp === "Eingangsrechnung") return `/bestellungen?focus=${row.bestellungId}`;
                if (field === "bezug") return `/auftraege?focus=${row.auftragId}`;
                if (field === "kunde" && row.rechnungstyp === "Eingangsrechnung" && row.lieferantId) return `/lieferanten?focus=${row.lieferantId}`;
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                return null;
            }}
            rowActions={[
                { name: "documents", label: "Belege öffnen", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: row => navigate(`/belege?bezug=${row.rechnungsnr}`), variant: "secondary" },
                { name: "payments", label: "Zahlungen", permission: PERMISSIONS.BUCHHALTUNG_BEARBEITEN, onClick: row => navigate(`/zahlungen?focus=${row.rechnungsnr}`), variant: "secondary" }
            ]}
        />
    </>;
}

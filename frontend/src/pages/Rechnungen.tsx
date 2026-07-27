import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "../components/DataTable";
import OverviewCards from "../components/OverviewCards";
import rechnungenService from "../services/rechnungenService";

const today = "2026-07-27";

function ampelStatus(rechnung: any) {
    if (rechnung.status === "bezahlt") return "bezahlt";
    if (rechnung.faelligAm && rechnung.faelligAm < today) return "fällig";
    return "offen";
}

export default function Rechnungen() {
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
            title="Rechnungsübersicht"
            selectableColumns={false}
            data={rechnungen}
            focusRowId={searchParams.get("focus") || ""}
            focusField="rechnungsnr"
            columns={[
                { field: "rechnungsnr", title: "Rechnungsnummer" },
                { field: "auftragNr", title: "Auftrag", render: row => <Link className="detail-link" to={`/auftraege?focus=${row.auftragId}`}>{row.auftragNr}</Link> },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "datum", title: "Datum" },
                { field: "faelligAm", title: "Fällig am" },
                { field: "betrag", title: "Betrag" },
                { field: "ampel", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "auftragNr") return `/auftraege?focus=${row.auftragId}`;
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                return null;
            }}
            rowActions={[
                { name: "documents", label: "Belege öffnen", permission: "buchhaltung.bearbeiten", onClick: row => navigate(`/belege?bezug=${row.rechnungsnr}`), variant: "secondary" },
                { name: "payments", label: "Zahlungen", permission: "buchhaltung.bearbeiten", onClick: row => navigate(`/zahlungen?focus=${row.rechnungsnr}`), variant: "secondary" }
            ]}
        />
    </>;
}

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import DataTable from "../components/DataTable";
import auftraegeService from "../services/auftraegeService";
import OverviewCards from "../components/OverviewCards";
import versandService from "../services/versandService";
import vertriebsdokumenteService from "../services/vertriebsdokumenteService";
import { canStartShipping, getConfirmationDocument, getSalesStepLabel, SALES_STEPS } from "../utils/processFlow";

export default function Auftraege() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [auftraege] = useState(auftraegeService.getAll());
    const versandauftraege = versandService.list();
    const vertriebsdokumente = vertriebsdokumenteService.list();
    const [statusFilter, setStatusFilter] = useState("");
    const findeVersandZuAuftrag = (auftragId) => versandauftraege.find(item => String(item.auftragId) === String(auftragId));
    const data = auftraege.map(auftrag => ({
        ...auftrag,
        positionenText: auftrag.positionen.map(position => `${position.artikel} (${position.menge})`).join(", "),
        prozess: getSalesStepLabel(
            findeVersandZuAuftrag(auftrag.id)?.status === "versendet"
                ? SALES_STEPS.VERSAND_VERSENDET
                : findeVersandZuAuftrag(auftrag.id)
                    ? SALES_STEPS.VERSAND_ERSTELLT
                    : getConfirmationDocument(auftrag.id, vertriebsdokumente)?.status === "versendet"
                        ? SALES_STEPS.AUFTRAGSBESTAETIGUNG_GESENDET
                        : getConfirmationDocument(auftrag.id, vertriebsdokumente)
                            ? SALES_STEPS.AUFTRAGSBESTAETIGUNG_ERSTELLT
                            : SALES_STEPS.ANGEBOT_ANGENOMMEN
        )
    }));
    const offeneAuftraege = auftraege.filter(auftrag => auftrag.status === "offen");
    const positionen = auftraege.reduce((summe, auftrag) => summe + auftrag.positionen.length, 0);

    return <>
        <OverviewCards cards={[
            { label: "Aufträge gesamt", value: auftraege.length },
            { label: "Noch offen", value: offeneAuftraege.length },
            { label: "Auftragspositionen", value: positionen }
        ]}/>
        <DataTable title="Aufträge" selectableColumns={false} data={data.filter(item => !statusFilter || item.status === statusFilter)}
        columns={[
            { field: "auftragNr", title: "Auftragsnummer" }, { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
            { field: "datum", title: "Datum" }, { field: "status", title: "Status" },
            { field: "prozess", title: "Prozess" }, { field: "positionenText", title: "Positionen" }
        ]}
        focusRowId={searchParams.get("focus") || ""}
        detailLinkResolver={({ field, row }) => {
            if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
            if (field === "angebotId" && row.angebotId) return `/angebote?focus=${row.angebotId}`;
            return null;
        }}
        filters={[{ name: "status", label: "Status", options: [{ value: "offen", label: "Offen" }] }]}
        onFilter={filters => setStatusFilter(filters.status || "")}
        rowActions={[
            { name: "offerOpen", label: "Angebot öffnen", permission: "verkauf.bearbeiten", onClick: row => row.angebotId && navigate(`/angebote?focus=${row.angebotId}`), variant: "secondary", isVisible: row => !!row.angebotId },
            { name: "confirm", label: "Dokumente öffnen", permission: "verkauf.bearbeiten", onClick: row => navigate(`/vertriebsdokumente?auftrag=${row.id}`), variant: "secondary" },
            { name: "ship", label: "Versand starten", permission: "logistik.bearbeiten", onClick: row => navigate(`/versand?new=fromOrder&auftragId=${row.id}`), variant: "secondary", isVisible: row => canStartShipping(row.id, vertriebsdokumente) && !findeVersandZuAuftrag(row.id) },
            { name: "shipOpen", label: "Versand öffnen", permission: "logistik.bearbeiten", onClick: row => {
                const versand = findeVersandZuAuftrag(row.id);
                if (versand) navigate(`/versand?focus=${versand.id}`);
            }, variant: "secondary", isVisible: row => !!findeVersandZuAuftrag(row.id) }
        ]}
        />
    </>;
}

// @ts-nocheck
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import auftraegeService from "../../services/verkauf/auftraegeService";
import versandService from "../../services/logistik/versandService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import { canStartShipping } from "../../utils/processFlow";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";

const today = "2026-07-26";

export default function Versand() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [versand, setVersand] = useSyncedServiceData(
        ["versandauftraege", "auftraege", "vertriebsdokumente"],
        () => versandService.list()
    );
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState({ versandNr: "", auftragId: "", auftrag: "", kunde: "", datum: today, status: "in Vorbereitung", transport: "" });
    const auftraege = auftraegeService.list();
    const vertriebsdokumente = vertriebsdokumenteService.list();
    const versandfaehigeAuftraege = auftraege.filter(item => canStartShipping(item.id, vertriebsdokumente));
    const auftragsOptionen = versandfaehigeAuftraege.map(item => ({ value: String(item.id), label: `${item.auftragNr} - ${item.kunde}` }));

    useEffect(() => {
        if (searchParams.get("new") !== "fromOrder") return;
        const auftragId = searchParams.get("auftragId") || "";
        const auftrag = versandfaehigeAuftraege.find(item => String(item.id) === String(auftragId)) || versandfaehigeAuftraege[0];
        if (!auftrag) return;
        setCurrent({
            versandNr: "",
            auftragId: String(auftrag.id),
            auftrag: auftrag.auftragNr,
            kunde: auftrag.kunde,
            datum: today,
            status: "in Vorbereitung",
            transport: ""
        });
        setOpen(true);
    }, [searchParams, versandfaehigeAuftraege]);

    const speichern = () => {
        if (!current.auftrag.trim() || !current.kunde.trim()) return;
        versandService.create(current);
        setVersand(versandService.list());
        setOpen(false);
    };

    const neuenVersandStarten = () => {
        const ersterAuftrag = versandfaehigeAuftraege[0];
        if (!ersterAuftrag) {
            alert("Versand ist erst möglich, wenn die Auftragsbestätigung gesendet wurde.");
            return;
        }
        setCurrent({
            versandNr: "",
            auftragId: ersterAuftrag ? String(ersterAuftrag.id) : "",
            auftrag: ersterAuftrag?.auftragNr || "",
            kunde: ersterAuftrag?.kunde || "",
            datum: today,
            status: "in Vorbereitung",
            transport: ""
        });
        setOpen(true);
    };

    const auftragAuswaehlen = (value) => {
        const auftrag = versandfaehigeAuftraege.find(item => String(item.id) === String(value));
        setCurrent(item => ({
            ...item,
            auftragId: value,
            auftrag: auftrag?.auftragNr || "",
            kunde: auftrag?.kunde || ""
        }));
    };

    const versenden = (item) => {
        versandService.update({ ...item, status: "versendet" });
        setVersand(versandService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Versandaufträge", value: versand.length },
            { label: "In Vorbereitung", value: versand.filter(item => item.status === "in Vorbereitung").length },
            { label: "Versendet", value: versand.filter(item => item.status === "versendet").length }
        ]}/>
        <DataTable
            title="Versand"
            selectableColumns={false}
            data={versand}
            columns={[
                { field: "versandNr", title: "Versandnummer" },
                { field: "auftrag", title: "Auftrag", render: row => row.auftragId ? <Link className="detail-link" to={`/auftraege?focus=${row.auftragId}`}>{row.auftrag}</Link> : row.auftrag },
                { field: "kunde", title: "Kunde", render: row => row.auftragId ? <Link className="detail-link" to={`/kunden?focus=${auftraege.find(item => item.id === row.auftragId)?.kundeId || ""}`}>{row.kunde}</Link> : row.kunde },
                { field: "datum", title: "Datum" },
                { field: "transport", title: "Transport" },
                { field: "status", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => {
                if (field === "auftrag" && row.auftragId) return `/auftraege?focus=${row.auftragId}`;
                if (field === "auftragId" && row.auftragId) return `/auftraege?focus=${row.auftragId}`;
                const auftrag = auftraege.find(item => item.id === row.auftragId);
                if (field === "kunde" && auftrag?.kundeId) return `/kunden?focus=${auftrag.kundeId}`;
                return null;
            }}
            toolbarActions={[{ name: "new", label: "Versand anlegen", permission: "logistik.bearbeiten", onClick: neuenVersandStarten, variant: "secondary" }]}
            rowActions={[
                { name: "orderOpen", label: "Auftrag öffnen", permission: "verkauf.bearbeiten", onClick: row => row.auftragId && navigate(`/auftraege?focus=${row.auftragId}`), variant: "secondary", isVisible: row => !!row.auftragId },
                { name: "ship", label: "Als versendet markieren", permission: "logistik.bearbeiten", onClick: versenden, variant: "success", isVisible: row => row.status !== "versendet" }
            ]}
        />
        <Dialog open={open} title="Versand anlegen" onClose={() => setOpen(false)}>
            <div><Label>Versandnummer</Label><TextField value={current.versandNr} onChange={value => setCurrent(item => ({ ...item, versandNr: value }))}/></div>
            <div><Label>Auftrag</Label><LookupField value={current.auftragId} options={auftragsOptionen} onChange={auftragAuswaehlen} placeholder="Auftrag suchen..."/></div>
            <div><Label>Kunde</Label><TextField value={current.kunde} onChange={value => setCurrent(item => ({ ...item, kunde: value }))}/></div>
            <div><Label>Transport</Label><TextField value={current.transport} onChange={value => setCurrent(item => ({ ...item, transport: value }))}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

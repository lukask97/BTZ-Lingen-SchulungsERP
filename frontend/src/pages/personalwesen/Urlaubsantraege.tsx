import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import mitarbeiterService from "../../services/personalwesen/mitarbeiterService";
import urlaubsantraegeService from "../../services/personalwesen/urlaubsantraegeService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { addDaysToIsoDate, getBerlinDate } from "../../utils/dateTime";

function createUrlaubsantrag(today: string) {
    return {
        mitarbeiterId: "",
        von: addDaysToIsoDate(today, 14),
        bis: addDaysToIsoDate(today, 18),
        tage: 5,
        status: "offen"
    };
}

export default function Urlaubsantraege() {
    const today = getBerlinDate();
    const navigate = useNavigate();
    const [antraege, setAntraege] = useSyncedServiceData(
        ["urlaubsantraege", "mitarbeiter", "personalakten"],
        () => urlaubsantraegeService.list()
    );
    const [open, setOpen] = useState(false);
    const mitarbeiter = mitarbeiterService.list();
    const mitarbeiterOptionen = mitarbeiter.map(item => ({ value: String(item.id), label: `${item.name} - ${item.abteilung}` }));
    const [current, setCurrent] = useState(createUrlaubsantrag(today));

    const neu = () => {
        const ersterMitarbeiter = mitarbeiter[0];
        setCurrent({
            ...createUrlaubsantrag(today),
            mitarbeiterId: ersterMitarbeiter ? String(ersterMitarbeiter.id) : ""
        });
        setOpen(true);
    };

    const mitarbeiterAuswaehlen = (value) => {
        setCurrent(item => ({ ...item, mitarbeiterId: value }));
    };

    const speichern = () => {
        if (!current.mitarbeiterId) return;
        urlaubsantraegeService.create(current);
        setAntraege(urlaubsantraegeService.list());
        setOpen(false);
        setCurrent(createUrlaubsantrag(today));
    };

    const genehmigen = (antrag) => {
        urlaubsantraegeService.update({ ...antrag, status: "genehmigt" });
        setAntraege(urlaubsantraegeService.list());
    };

    const ablehnen = (antrag) => {
        urlaubsantraegeService.update({ ...antrag, status: "abgelehnt" });
        setAntraege(urlaubsantraegeService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Urlaubsanträge", value: antraege.length },
            { label: "Offen", value: antraege.filter(item => item.status === "offen").length },
            { label: "Genehmigt", value: antraege.filter(item => item.status === "genehmigt").length }
        ]}/>
        <DataTable
            title="Urlaubsanträge"
            selectableColumns={false}
            data={antraege}
            columns={[
                { field: "mitarbeiter", title: "Mitarbeiter", render: row => row.mitarbeiterId ? <Link className="detail-link" to={`/personalakte?mitarbeiter=${row.mitarbeiterId}`}>{row.mitarbeiter}</Link> : row.mitarbeiter },
                { field: "von", title: "Von" },
                { field: "bis", title: "Bis" },
                { field: "tage", title: "Tage" },
                { field: "status", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => field === "mitarbeiter" && row.mitarbeiterId ? `/personalakte?mitarbeiter=${row.mitarbeiterId}` : null}
            toolbarActions={[{ name: "new", label: "Antrag anlegen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "details", label: "Akte öffnen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: row => navigate(`/personalakte?mitarbeiter=${row.mitarbeiterId}`), variant: "secondary", isVisible: row => !!row.mitarbeiterId },
                { name: "approve", label: "Genehmigen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: genehmigen, variant: "success", isVisible: row => row.status === "offen" },
                { name: "reject", label: "Ablehnen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: ablehnen, variant: "danger", isVisible: row => row.status === "offen" }
            ]}
        />
        <Dialog open={open} title="Urlaubsantrag anlegen" onClose={() => setOpen(false)}>
            <div><Label>Mitarbeiter</Label><LookupField value={current.mitarbeiterId} options={mitarbeiterOptionen} onChange={mitarbeiterAuswaehlen} placeholder="Mitarbeiter suchen..."/></div>
            <div><Label>Von</Label><TextField type="date" value={current.von} onChange={value => setCurrent(item => ({ ...item, von: value }))}/></div>
            <div><Label>Bis</Label><TextField type="date" value={current.bis} onChange={value => setCurrent(item => ({ ...item, bis: value }))}/></div>
            <div><Label>Tage</Label><NumberField value={current.tage} min="1" onChange={value => setCurrent(item => ({ ...item, tage: Number(value) }))}/></div>
            <div className="form-row"><button type="button" onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

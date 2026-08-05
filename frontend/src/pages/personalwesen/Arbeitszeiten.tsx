import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import arbeitszeitenService from "../../services/personalwesen/arbeitszeitenService";
import mitarbeiterService from "../../services/personalwesen/mitarbeiterService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate } from "../../utils/dateTime";

function createArbeitszeitEintrag(today: string) {
    return { mitarbeiterId: "", datum: today, von: "08:00", bis: "16:00", status: "erfasst" };
}

export default function Arbeitszeiten() {
    const today = getBerlinDate();
    const navigate = useNavigate();
    const [eintraege, setEintraege] = useSyncedServiceData(
        ["arbeitszeiten", "mitarbeiter", "personalakten"],
        () => arbeitszeitenService.list()
    );
    const [open, setOpen] = useState(false);
    const mitarbeiter = mitarbeiterService.list();
    const mitarbeiterOptionen = mitarbeiter.map(item => ({ value: String(item.id), label: `${item.name} - ${item.abteilung}` }));
    const [current, setCurrent] = useState(createArbeitszeitEintrag(today));

    const neu = () => {
        const ersterMitarbeiter = mitarbeiter[0];
        setCurrent({
            ...createArbeitszeitEintrag(today),
            mitarbeiterId: ersterMitarbeiter ? String(ersterMitarbeiter.id) : ""
        });
        setOpen(true);
    };

    const mitarbeiterAuswaehlen = (value) => {
        setCurrent(item => ({ ...item, mitarbeiterId: value }));
    };

    const speichern = () => {
        if (!current.mitarbeiterId) return;
        arbeitszeitenService.create(current);
        setEintraege(arbeitszeitenService.list());
        setOpen(false);
    };

    const freigeben = (eintrag) => {
        arbeitszeitenService.update({ ...eintrag, status: "freigegeben" });
        setEintraege(arbeitszeitenService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Zeitbuchungen", value: eintraege.length },
            { label: "Erfasst", value: eintraege.filter(item => item.status === "erfasst").length },
            { label: "Freigegeben", value: eintraege.filter(item => item.status === "freigegeben").length }
        ]}/>
        <DataTable
            title="Arbeitszeiten"
            selectableColumns={false}
            data={eintraege}
            columns={[
                { field: "mitarbeiter", title: "Mitarbeiter", render: row => row.mitarbeiterId ? <Link className="detail-link" to={`/personalakte?mitarbeiter=${row.mitarbeiterId}`}>{row.mitarbeiter}</Link> : row.mitarbeiter },
                { field: "datum", title: "Datum" },
                { field: "von", title: "Von" },
                { field: "bis", title: "Bis" },
                { field: "status", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => field === "mitarbeiter" && row.mitarbeiterId ? `/personalakte?mitarbeiter=${row.mitarbeiterId}` : null}
            toolbarActions={[{ name: "new", label: "Zeit buchen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "details", label: "Akte öffnen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: row => navigate(`/personalakte?mitarbeiter=${row.mitarbeiterId}`), variant: "secondary", isVisible: row => !!row.mitarbeiterId },
                { name: "approve", label: "Freigeben", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: freigeben, variant: "success", isVisible: row => row.status !== "freigegeben" }
            ]}
        />
        <Dialog open={open} title="Arbeitszeit erfassen" onClose={() => setOpen(false)}>
            <div><Label>Mitarbeiter</Label><LookupField value={current.mitarbeiterId} options={mitarbeiterOptionen} onChange={mitarbeiterAuswaehlen} placeholder="Mitarbeiter suchen..."/></div>
            <div><Label>Von</Label><TextField type="time" value={current.von} onChange={value => setCurrent(item => ({ ...item, von: value }))}/></div>
            <div><Label>Bis</Label><TextField type="time" value={current.bis} onChange={value => setCurrent(item => ({ ...item, bis: value }))}/></div>
            <div className="form-row"><button type="button" onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

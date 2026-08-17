import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import SaveButton from "../../components/SaveButton";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import krankmeldungenService from "../../services/personalwesen/krankmeldungenService";
import mitarbeiterService from "../../services/personalwesen/mitarbeiterService";
import personalaktenService from "../../services/personalwesen/personalaktenService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate } from "../../utils/dateTime";

function createKrankmeldung(today: string) {
    return { mitarbeiterId: "", von: today, bis: today, grund: "", status: "eingegangen" };
}

export default function Krankmeldungen() {
    const today = getBerlinDate();
    const navigate = useNavigate();
    const [meldungen, setMeldungen] = useSyncedServiceData(
        ["krankmeldungen", "mitarbeiter", "personalakten"],
        () => krankmeldungenService.list()
    );
    const [open, setOpen] = useState(false);
    const mitarbeiter = mitarbeiterService.list();
    const mitarbeiterOptionen = mitarbeiter.map(item => ({ value: String(item.id), label: `${item.name} - ${item.abteilung}` }));
    const [current, setCurrent] = useState(createKrankmeldung(today));

    const neu = () => {
        const ersterMitarbeiter = mitarbeiter[0];
        setCurrent({
            ...createKrankmeldung(today),
            mitarbeiterId: ersterMitarbeiter ? String(ersterMitarbeiter.id) : ""
        });
        setOpen(true);
    };

    const mitarbeiterAuswaehlen = (value) => {
        setCurrent(item => ({ ...item, mitarbeiterId: value }));
    };

    const speichern = () => {
        if (!current.mitarbeiterId || !current.grund.trim()) return false;

        const neueMeldung = krankmeldungenService.create({
            ...current,
            grund: current.grund.trim()
        });

        if (neueMeldung.mitarbeiterId) {
            personalaktenService.create({
                mitarbeiterId: Number(neueMeldung.mitarbeiterId),
                dokumentTyp: "Krankmeldung",
                titel: `Krankmeldung ${neueMeldung.von}`,
                datum: neueMeldung.von,
                status: "offen",
                notiz: neueMeldung.grund
            });
        }

        setMeldungen(krankmeldungenService.list());
        setCurrent(createKrankmeldung(today));
        return true;
    };

    const bestaetigen = (meldung) => {
        krankmeldungenService.update({ ...meldung, status: "bestätigt" });
        setMeldungen(krankmeldungenService.list());
    };

    const abschliessen = (meldung) => {
        krankmeldungenService.update({ ...meldung, status: "abgeschlossen" });
        setMeldungen(krankmeldungenService.list());
    };

    return <>
        <OverviewCards cards={[
            { label: "Krankmeldungen", value: meldungen.length },
            { label: "Eingegangen", value: meldungen.filter(item => item.status === "eingegangen").length },
            { label: "Bestätigt", value: meldungen.filter(item => item.status === "bestätigt").length },
            { label: "Abgeschlossen", value: meldungen.filter(item => item.status === "abgeschlossen").length }
        ]}/>
        <DataTable
            title="Krankmeldungen"
            selectableColumns={false}
            data={meldungen}
            columns={[
                { field: "mitarbeiter", title: "Mitarbeiter", render: row => row.mitarbeiterId ? <Link className="detail-link" to={`/personalakte?mitarbeiter=${row.mitarbeiterId}`}>{row.mitarbeiter}</Link> : row.mitarbeiter },
                { field: "von", title: "Von" },
                { field: "bis", title: "Bis" },
                { field: "grund", title: "Grund" },
                { field: "status", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => field === "mitarbeiter" && row.mitarbeiterId ? `/personalaktemitarbeiter=${row.mitarbeiterId}` : null}
            toolbarActions={[{ name: "new", label: "Krankmeldung erfassen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "details", label: "Akte öffnen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: row => navigate(`/personalakte?mitarbeiter=${row.mitarbeiterId}`), variant: "secondary", isVisible: row => !!row.mitarbeiterId },
                { name: "approve", label: "Bestätigen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: bestaetigen, variant: "success", isVisible: row => row.status === "eingegangen" },
                { name: "done", label: "Abschließen", permission: PERMISSIONS.PERSONALWESEN_BEARBEITEN, onClick: abschliessen, variant: "success", isVisible: row => row.status === "bestätigt" }
            ]}
        />
        <Dialog
            open={open}
            title="Krankmeldung erfassen"
            onClose={() => setOpen(false)}
            footer={<SaveButton onSave={speichern} onSuccess={() => setOpen(false)}>Speichern</SaveButton>}
        >
            <div><Label>Mitarbeiter</Label><LookupField value={current.mitarbeiterId} options={mitarbeiterOptionen} onChange={mitarbeiterAuswaehlen} placeholder="Mitarbeiter suchen..."/></div>
            <div><Label>Von</Label><TextField type="date" value={current.von} onChange={value => setCurrent(item => ({ ...item, von: value }))}/></div>
            <div><Label>Bis</Label><TextField type="date" value={current.bis} onChange={value => setCurrent(item => ({ ...item, bis: value }))}/></div>
            <div className="form-row"><Label>Grund / Hinweis</Label><TextArea rows={3} value={current.grund} onChange={value => setCurrent(item => ({ ...item, grund: value }))}/></div>
        </Dialog>
    </>;
}

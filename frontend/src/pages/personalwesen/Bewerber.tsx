import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import bewerberService from "../../services/personalwesen/bewerberService";
import mitarbeiterService from "../../services/personalwesen/mitarbeiterService";
import personalaktenService from "../../services/personalwesen/personalaktenService";

const today = "2026-07-26";

function ableitungAusStelle(stelle = "") {
    const normalized = stelle.toLowerCase();
    if (normalized.includes("marketing")) return { abteilung: "Marketing", rolle: "Mitarbeiterin" };
    if (normalized.includes("lager")) return { abteilung: "Lager", rolle: "Fachkraft" };
    if (normalized.includes("assistenz")) return { abteilung: "Verwaltung", rolle: "Assistenz" };
    if (normalized.includes("verkauf")) return { abteilung: "Verkauf", rolle: "Mitarbeiterin" };
    return { abteilung: "Verwaltung", rolle: "Mitarbeiterin" };
}

export default function Bewerber() {
    const navigate = useNavigate();
    const [bewerber, setBewerber] = useState(bewerberService.list());
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState({ name: "", stelle: "", datum: today, status: "eingegangen", notiz: "" });

    const speichern = () => {
        if (!current.name.trim()) return;
        bewerberService.create(current);
        setBewerber(bewerberService.list());
        setOpen(false);
    };

    const einladen = (item) => {
        bewerberService.update({ ...item, status: "eingeladen" });
        setBewerber(bewerberService.list());
    };

    const uebernehmen = (item) => {
        const vorhanden = item.mitarbeiterId ? mitarbeiterService.list().find(person => person.id === item.mitarbeiterId) : null;
        if (vorhanden) {
            navigate(`/personalakte?mitarbeiter=${vorhanden.id}`);
            return;
        }

        const profil = ableitungAusStelle(item.stelle);
        const neuerMitarbeiter = mitarbeiterService.create({
            name: item.name,
            abteilung: profil.abteilung,
            rolle: profil.rolle,
            eintritt: today,
            status: "im Einsatz"
        });

        personalaktenService.create({
            mitarbeiterId: neuerMitarbeiter.id,
            mitarbeiter: neuerMitarbeiter.name,
            dokumentTyp: "Onboarding-Checkliste",
            titel: `Onboarding ${neuerMitarbeiter.name}`,
            datum: today,
            status: "offen",
            notiz: `Aus Bewerberprozess für ${item.stelle || "neue Stelle"} übernommen.`
        });

        bewerberService.update({
            ...item,
            status: "übernommen",
            mitarbeiterId: neuerMitarbeiter.id,
            notiz: item.notiz ? `${item.notiz} | Als Mitarbeiter übernommen.` : "Als Mitarbeiter übernommen."
        });
        setBewerber(bewerberService.list());
        navigate(`/personalakte?mitarbeiter=${neuerMitarbeiter.id}`);
    };

    return <>
        <OverviewCards cards={[
            { label: "Bewerber", value: bewerber.length },
            { label: "Eingegangen", value: bewerber.filter(item => item.status === "eingegangen").length },
            { label: "Eingeladen", value: bewerber.filter(item => item.status === "eingeladen").length },
            { label: "Übernommen", value: bewerber.filter(item => item.status === "übernommen").length }
        ]}/>
        <DataTable
            title="Bewerber"
            selectableColumns={false}
            data={bewerber}
            columns={[
                { field: "name", title: "Name", render: row => row.mitarbeiterId ? <Link className="detail-link" to={`/personalakte?mitarbeiter=${row.mitarbeiterId}`}>{row.name}</Link> : row.name },
                { field: "stelle", title: "Stelle" },
                { field: "datum", title: "Datum" },
                { field: "status", title: "Status" },
                { field: "notiz", title: "Notiz" }
            ]}
            detailLinkResolver={({ field, row }) => field === "name" && row.mitarbeiterId ? `/personalakte?mitarbeiter=${row.mitarbeiterId}` : null}
            toolbarActions={[{ name: "new", label: "Bewerber anlegen", permission: "personalwesen.bearbeiten", onClick: () => setOpen(true), variant: "secondary" }]}
            rowActions={[
                { name: "invite", label: "Zum Gespräch einladen", permission: "personalwesen.bearbeiten", onClick: einladen, variant: "success", isVisible: row => row.status === "eingegangen" },
                { name: "hire", label: "Als Mitarbeiter übernehmen", permission: "personalwesen.bearbeiten", onClick: uebernehmen, variant: "secondary", isVisible: row => row.status === "eingeladen" || row.status === "übernommen" }
            ]}
        />
        <Dialog open={open} title="Bewerber anlegen" onClose={() => setOpen(false)}>
            <div><Label>Name</Label><TextField value={current.name} onChange={value => setCurrent(item => ({ ...item, name: value }))}/></div>
            <div><Label>Stelle</Label><TextField value={current.stelle} onChange={value => setCurrent(item => ({ ...item, stelle: value }))}/></div>
            <div className="form-row"><Label>Notiz</Label><TextArea rows={3} value={current.notiz} onChange={value => setCurrent(item => ({ ...item, notiz: value }))}/></div>
            <div className="form-row"><button onClick={speichern}>Speichern</button></div>
        </Dialog>
    </>;
}

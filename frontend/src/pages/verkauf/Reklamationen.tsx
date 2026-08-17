import { Link } from "react-router-dom";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import SaveButton from "../../components/SaveButton";
import TextArea from "../../components/form/TextArea";
import reklamationenService, { naechsteReklamationsnummer } from "../../services/verkauf/reklamationenService";
import kundenService from "../../services/verkauf/customerService";
import OverviewCards from "../../components/OverviewCards";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";

const heute = () => new Date().toISOString().slice(0, 10);

export default function Reklamationen() {
    const [reklamationen, setReklamationen] = useSyncedServiceData(["reklamationen", "kunden"], () => reklamationenService.getAll());
    const [offen, setOffen] = useState(false);
    const [kundeId, setKundeId] = useState("");
    const [beschreibung, setBeschreibung] = useState("");
    const [fehler, setFehler] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const kunden = kundenService.getAll();
    const kundenOptionen = kunden.map(item => ({ value: String(item.id), label: `${item.kundenNr} - ${item.firma}` }));

    const neu = () => {
        setKundeId(kunden[0]?.id ? String(kunden[0].id) : "");
        setBeschreibung("");
        setFehler("");
        setOffen(true);
    };

    const speichern = () => {
        const kunde = kunden.find(item => item.id === Number(kundeId));
        if (!kunde || !beschreibung.trim()) {
            setFehler("Bitte einen Kunden und eine Beschreibung angeben.");
            return false;
        }
        reklamationenService.add({
            reklamationsNr: naechsteReklamationsnummer(),
            kundeId: kunde.id,
            datum: heute(),
            beschreibung: beschreibung.trim(),
            status: "neu"
        });
        setReklamationen(reklamationenService.getAll());
        return true;
    };

    const ersatzlieferungPlanen = reklamation => {
        if (reklamation.status !== "neu") return;
        reklamationenService.update({ ...reklamation, status: "Ersatzlieferung geplant" });
        setReklamationen(reklamationenService.getAll());
    };

    const neueReklamationen = reklamationen.filter(item => item.status === "neu").length;
    const ersatzlieferungen = reklamationen.filter(item => item.status === "Ersatzlieferung geplant").length;

    return <>
        <OverviewCards cards={[
            { label: "Reklamationen gesamt", value: reklamationen.length },
            { label: "Neu", value: neueReklamationen },
            { label: "Ersatzlieferung geplant", value: ersatzlieferungen }
        ]}/>
        <DataTable title="Reklamationen" selectableColumns={false} data={reklamationen.filter(item => !statusFilter || item.status === statusFilter)}
            columns={[
                { field: "reklamationsNr", title: "Nummer" }, { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "datum", title: "Datum" }, { field: "beschreibung", title: "Beschreibung" },
                { field: "status", title: "Status" }
            ]}
            detailLinkResolver={({ field, row }) => field === "kunde" && row.kundeId ? `/kunden?focus=${row.kundeId}` : null}
            toolbarActions={[{ name: "new", label: "Reklamation erfassen", permission: PERMISSIONS.SERVICE_BEARBEITEN, onClick: neu }]}
            rowActions={[{ name: "replacement", label: "Ersatzlieferung planen", permission: PERMISSIONS.SERVICE_BEARBEITEN, onClick: ersatzlieferungPlanen }]}
            filters={[{ name: "status", label: "Status", options: [{ value: "neu", label: "Neu" }, { value: "Ersatzlieferung geplant", label: "Ersatzlieferung geplant" }] }]}
            onFilter={filters => setStatusFilter(filters.status || "")}
        />
        <Dialog
            open={offen}
            title="Reklamation erfassen"
            onClose={() => setOffen(false)}
            footer={<SaveButton onSave={speichern} onSuccess={() => setOffen(false)}>Reklamation speichern</SaveButton>}
        >
            <div><Label required>Kunde</Label><LookupField value={kundeId} options={kundenOptionen} onChange={setKundeId} placeholder="Kunde suchen..."/></div>
            <div><Label>Datum</Label><input type="date" value={heute()} disabled/></div>
            <div className="form-row"><Label required>Beschreibung</Label><TextArea rows={4} value={beschreibung} placeholder="Was ist passiert" onChange={setBeschreibung}/>
                {fehler && <p className="form-error">{fehler}</p>}</div>
        </Dialog>
    </>;
}

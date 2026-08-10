import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable";
import TextField from "../../components/form/TextField";
import Label from "../../components/form/Label";
import kundenService from "../../services/verkauf/customerService";
import lieferantenService from "../../services/einkauf/lieferantenService";
import artikelService from "../../services/logistik/artikelService";
import angeboteService from "../../services/verkauf/angeboteService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import bestellungenService from "../../services/einkauf/bestellungenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import abteilungenService from "../../services/organisation/abteilungenService";

function normalize(value: string) {
    return String(value || "").trim().toLowerCase();
}

export default function Suche() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    const targets = useMemo(() => {
        const departmentTargets = abteilungenService.getAll().map(item => ({
            id: `abteilung-${item.id}`,
            nummer: item.kuerzel,
            bezeichnung: item.name,
            bereich: "Organisation",
            ziel: "/organisation",
            fokus: item.kuerzel
        }));
        return [
            ...kundenService.getAll().map(item => ({ id: `kunde-${item.id}`, nummer: item.kundenNr, bezeichnung: item.firma, bereich: "Kunden", ziel: `/kunden?focus=${item.id}` })),
            ...lieferantenService.getAll().map(item => ({ id: `lieferant-${item.id}`, nummer: item.lieferantenNr, bezeichnung: item.firma, bereich: "Lieferanten", ziel: `/lieferanten?focus=${item.id}` })),
            ...artikelService.getAll().map(item => ({ id: `artikel-${item.id}`, nummer: item.artikelNr, bezeichnung: item.name, bereich: "Artikel", ziel: `/artikel?focus=${item.id}` })),
            ...angeboteService.getAll().map(item => ({ id: `angebot-${item.id}`, nummer: item.angebotsNr, bezeichnung: item.kunde || "Angebot", bereich: "Angebote", ziel: "/angebote" })),
            ...auftraegeService.getAll().map(item => ({ id: `auftrag-${item.id}`, nummer: item.auftragNr, bezeichnung: item.kunde || "Auftrag", bereich: "Aufträge", ziel: "/auftraege" })),
            ...bestellungenService.getAll().map(item => ({ id: `bestellung-${item.id}`, nummer: item.bestellNr, bezeichnung: item.lieferant || "Bestellung", bereich: "Bestellungen", ziel: `/bestellungen?focus=${item.id}` })),
            ...rechnungenService.getAll().map(item => ({ id: `rechnung-${item.id}`, nummer: item.rechnungsnr, bezeichnung: item.kunde || "Rechnung", bereich: item.rechnungstyp === "Eingangsrechnung" ? "Eingangsrechnungen" : "Ausgangsrechnungen", ziel: `/${item.rechnungstyp === "Eingangsrechnung" ? "eingangsrechnungen" : "ausgangsrechnungen"}?focus=${item.rechnungsnr}` })),
            ...departmentTargets
        ];
    }, []);

    const results = useMemo(() => {
        const needle = normalize(query);
        if (!needle) return [];
        return targets.filter(item => normalize(item.nummer).includes(needle) || normalize(item.bezeichnung).includes(needle));
    }, [query, targets]);

    const direktSuche = () => {
        if (results.length === 1) {
            navigate(results[0].ziel);
        }
    };

    return <>
        <h1>Generelle Suche</h1>
        <p>Nummern, Kürzel und zentrale Bezeichnungen können hier gesucht werden. Bei einem eindeutigen Treffer wird direkt weitergeleitet.</p>
        <div className="form-row">
            <Label>Nummer oder Kürzel</Label>
            <TextField value={query} onChange={setQuery} placeholder="z. B. RG-2026-001, ART001 oder BU" />
            <button type="button" onClick={direktSuche} disabled={results.length !== 1}>Direkt öffnen</button>
        </div>
        <DataTable
            title="Treffer"
            selectableColumns={false}
            data={results}
            columns={[
                { field: "nummer", title: "Nummer / Kürzel" },
                { field: "bezeichnung", title: "Bezeichnung" },
                { field: "bereich", title: "Bereich" },
                { field: "ziel", title: "Aktion", render: row => <button type="button" className="link-button" onClick={() => navigate(row.ziel)}>Öffnen</button> }
            ]}
        />
    </>;
}

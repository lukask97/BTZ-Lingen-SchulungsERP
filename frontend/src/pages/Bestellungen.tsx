// @ts-nocheck
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import LookupField from "../components/form/LookupField";
import NumberField from "../components/form/NumberField";
import bestellungenService, { naechsteBestellnummer } from "../services/bestellungenService";
import lieferantenService from "../services/lieferantenService";
import artikelService from "../services/artikelService";
import OverviewCards from "../components/OverviewCards";
import einkaufsdokumenteService from "../services/einkaufsdokumenteService";
import { canBookGoodsReceipt, canCreateIncomingInvoice, getPurchaseStep, getPurchaseStepLabel } from "../utils/processFlow";

const heute = () => new Date().toISOString().slice(0, 10);

export default function Bestellungen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [bestellungen, setBestellungen] = useState(bestellungenService.getAll());
    const [offen, setOffen] = useState(false);
    const [lieferantId, setLieferantId] = useState("");
    const [artikelId, setArtikelId] = useState("");
    const [menge, setMenge] = useState(1);
    const [positionen, setPositionen] = useState([]);
    const [fehler, setFehler] = useState("");
    const [suchbegriff, setSuchbegriff] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const lieferanten = lieferantenService.getAll();
    const artikel = artikelService.getAll().filter(item => item.artikelTyp !== "Dienstleistung");
    const einkaufsdokumente = einkaufsdokumenteService.list();
    const lieferantenOptionen = lieferanten.map(item => ({ value: String(item.id), label: `${item.lieferantenNr} - ${item.firma}` }));
    const artikelOptionen = artikel.map(item => ({
        value: String(item.id),
        label: `${item.artikelNr} - ${item.name} (EK: ${Number(item.einkaufspreis ?? item.preis ?? 0).toFixed(2)} €, Bestand: ${item.bestand})`
    }));

    const neu = () => {
        setLieferantId(lieferanten[0]?.id ? String(lieferanten[0].id) : "");
        setArtikelId(artikel[0]?.id ? String(artikel[0].id) : "");
        setMenge(1);
        setPositionen([]);
        setFehler("");
        setOffen(true);
    };

    const positionHinzufuegen = () => {
        const auswahl = artikel.find(item => item.id === Number(artikelId));
        if (!auswahl || Number(menge) <= 0) return;

        setPositionen(vorherige => {
            const vorhanden = vorherige.find(item => item.artikelId === auswahl.id);
            if (vorhanden) {
                return vorherige.map(item => item.artikelId === auswahl.id
                    ? { ...item, menge: item.menge + Number(menge) }
                    : item);
            }
            return [...vorherige, { artikelId: auswahl.id, artikel: auswahl.name, menge: Number(menge) }];
        });
    };

    const speichern = () => {
        const lieferant = lieferanten.find(item => item.id === Number(lieferantId));
        if (!lieferant || positionen.length === 0) {
            setFehler("Bitte einen Lieferanten und mindestens eine Position auswählen.");
            return;
        }

        bestellungenService.add({
            bestellNr: naechsteBestellnummer(),
            lieferantId: lieferant.id,
            lieferant: lieferant.firma,
            datum: heute(),
            status: "offen",
            positionen
        });
        setBestellungen(bestellungenService.getAll());
        setOffen(false);
    };

    const data = bestellungen.map(bestellung => ({
        ...bestellung,
        positionenText: bestellung.positionen.map(position => `${position.artikel} (${position.menge})`).join(", "),
        prozess: getPurchaseStepLabel(getPurchaseStep(bestellung, einkaufsdokumente))
    })).filter(bestellung => (!statusFilter || bestellung.status === statusFilter) && Object.values(bestellung).join(" ").toLowerCase().includes(suchbegriff.toLowerCase()));
    const offeneBestellungen = bestellungen.filter(item => item.status === "offen").length;
    const eingegangeneBestellungen = bestellungen.filter(item => item.status === "eingegangen").length;
    const berechneBestellwert = (bestellung) => bestellung.positionen.reduce((summe, position) => {
        const artikelEintrag = artikel.find(item => item.id === position.artikelId);
        return summe + Number(position.menge) * Number(artikelEintrag?.einkaufspreis ?? artikelEintrag?.preis ?? 0);
    }, 0);

    return <>
        <OverviewCards cards={[
            { label: "Bestellungen gesamt", value: bestellungen.length },
            { label: "Noch offen", value: offeneBestellungen },
            { label: "Wareneingang gebucht", value: eingegangeneBestellungen }
        ]}/>
        <DataTable
            title="Bestellungen"
            columns={[
                { field: "bestellNr", title: "Bestellnummer" },
                { field: "lieferant", title: "Lieferant", render: row => row.lieferantId ? <Link className="detail-link" to={`/lieferanten?focus=${row.lieferantId}`}>{row.lieferant}</Link> : row.lieferant },
                { field: "datum", title: "Datum" },
                { field: "status", title: "Status" },
                { field: "prozess", title: "Prozess" },
                { field: "positionenText", title: "Positionen" }
            ]}
            data={data}
            selectableColumns={false}
            focusRowId={searchParams.get("focus") || ""}
            detailLinkResolver={({ field, row }) => field === "lieferant" && row.lieferantId ? `/lieferanten?focus=${row.lieferantId}` : null}
            searchable
            onSearch={setSuchbegriff}
            filters={[{ name: "status", label: "Status", options: [{ value: "offen", label: "Offen" }, { value: "eingegangen", label: "Eingegangen" }] }]}
            onFilter={filters => setStatusFilter(filters.status || "")}
            toolbarActions={[{ name: "new", label: "Neue Bestellung", permission: "einkauf.bearbeiten", onClick: neu }]}
            rowActions={[
                { name: "documents", label: "Dokumente", permission: "einkauf.bearbeiten", onClick: row => navigate(`/einkaufsdokumente?bestellung=${row.id}`), variant: "secondary" },
                { name: "goods", label: "Wareneingang", permission: "lager.buchen", onClick: row => navigate(`/wareneingaenge?focus=${row.id}`), variant: "secondary", isVisible: row => canBookGoodsReceipt(row, einkaufsdokumente) },
                { name: "invoice", label: "Eingangsrechnung", permission: "rechnung.anlegen", onClick: row => navigate(`/rechnungen?new=eingangsrechnung&bestellungId=${row.id}&bestellNr=${row.bestellNr}&lieferantId=${row.lieferantId}&betrag=${berechneBestellwert(row)}`), variant: "secondary", isVisible: row => canCreateIncomingInvoice(row) }
            ]}
        />
        <Dialog open={offen} title="Neue Bestellung" onClose={() => setOffen(false)}>
            <div><Label required>Lieferant</Label>
                <LookupField value={lieferantId} options={lieferantenOptionen} onChange={setLieferantId} placeholder="Lieferant suchen..."/>
            </div>
            <div><Label>Bestelldatum</Label><input type="date" value={heute()} disabled/></div>
            <div className="form-row bestellposition-hinzufuegen">
                <div><Label>Artikel</Label>
                    <LookupField value={artikelId} options={artikelOptionen} onChange={setArtikelId} placeholder="Artikel suchen..."/>
                </div>
                <div><Label>Menge</Label><NumberField value={menge} min="1" onChange={wert => setMenge(Number(wert))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufügen</button>
            </div>
            <div className="form-row">
                <Label required>Bestellpositionen</Label>
                {positionen.length === 0 ? <p>Noch keine Position vorhanden.</p> : <ul className="positionsliste">
                    {positionen.map(position => <li key={position.artikelId}>{position.artikel}: {position.menge}
                        <button type="button" className="link-button" onClick={() => setPositionen(items => items.filter(item => item.artikelId !== position.artikelId))}>Entfernen</button>
                    </li>)}
                </ul>}
                {fehler && <p className="form-error">{fehler}</p>}
            </div>
            <div className="form-row"><button onClick={speichern}>Bestellung speichern</button></div>
        </Dialog>
    </>;
}

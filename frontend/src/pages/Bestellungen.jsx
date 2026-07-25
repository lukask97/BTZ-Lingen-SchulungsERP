import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import NumberField from "../components/form/NumberField";
import bestellungenService, { naechsteBestellnummer } from "../services/bestellungenService";
import lieferantenService from "../services/lieferantenService";
import artikelService from "../services/artikelService";
import OverviewCards from "../components/OverviewCards";

const heute = () => new Date().toISOString().slice(0, 10);

export default function Bestellungen() {
    const [bestellungen, setBestellungen] = useState(bestellungenService.getAll());
    const [offen, setOffen] = useState(false);
    const [lieferantId, setLieferantId] = useState("");
    const [artikelId, setArtikelId] = useState("");
    const [menge, setMenge] = useState(1);
    const [positionen, setPositionen] = useState([]);
    const [fehler, setFehler] = useState("");
    const [suchbegriff, setSuchbegriff] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const lieferanten = lieferantenService.getAll().filter(item => item.aktiv);
    const artikel = artikelService.getAll().filter(item => item.aktiv);

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
        positionenText: bestellung.positionen.map(position => `${position.artikel} (${position.menge})`).join(", ")
    })).filter(bestellung => (!statusFilter || bestellung.status === statusFilter) && Object.values(bestellung).join(" ").toLowerCase().includes(suchbegriff.toLowerCase()));
    const offeneBestellungen = bestellungen.filter(item => item.status === "offen").length;
    const eingegangeneBestellungen = bestellungen.filter(item => item.status === "eingegangen").length;

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
                { field: "lieferant", title: "Lieferant" },
                { field: "datum", title: "Datum" },
                { field: "status", title: "Status" },
                { field: "positionenText", title: "Positionen" }
            ]}
            data={data}
            selectableColumns={false}
            searchable
            onSearch={setSuchbegriff}
            filters={[{ name: "status", label: "Status", options: [{ value: "offen", label: "Offen" }, { value: "eingegangen", label: "Eingegangen" }] }]}
            onFilter={filters => setStatusFilter(filters.status || "")}
            toolbarActions={[{ name: "new", label: "Neue Bestellung", permission: "einkauf.bearbeiten", onClick: neu }]}
        />
        <Dialog open={offen} title="Neue Bestellung" onClose={() => setOffen(false)}>
            <div><Label required>Lieferant</Label>
                <select value={lieferantId} onChange={event => setLieferantId(event.target.value)}>
                    <option value="">Bitte wählen</option>
                    {lieferanten.map(item => <option key={item.id} value={item.id}>{item.firma}</option>)}
                </select>
            </div>
            <div><Label>Bestelldatum</Label><input type="date" value={heute()} disabled/></div>
            <div className="form-row bestellposition-hinzufuegen">
                <div><Label>Artikel</Label>
                    <select value={artikelId} onChange={event => setArtikelId(event.target.value)}>
                        <option value="">Bitte wählen</option>
                        {artikel.map(item => <option key={item.id} value={item.id}>{item.name} (Bestand: {item.bestand})</option>)}
                    </select>
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

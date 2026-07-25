import { useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import NumberField from "../components/form/NumberField";
import angeboteService, { naechsteAngebotsnummer } from "../services/angeboteService";
import kundenService from "../services/customerService";
import artikelService from "../services/artikelService";
import { angebotInAuftragUebernehmen } from "../services/verkaufService";
import OverviewCards from "../components/OverviewCards";

const heute = () => new Date().toISOString().slice(0, 10);
const gesamtbetrag = positionen => positionen.reduce((summe, position) => summe + position.menge * position.einzelpreis, 0);

export default function Angebote() {
    const [angebote, setAngebote] = useState(angeboteService.getAll());
    const [offen, setOffen] = useState(false);
    const [kundeId, setKundeId] = useState("");
    const [artikelId, setArtikelId] = useState("");
    const [menge, setMenge] = useState(1);
    const [positionen, setPositionen] = useState([]);
    const [fehler, setFehler] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const kunden = kundenService.getAll().filter(item => item.aktiv);
    const artikel = artikelService.getAll().filter(item => item.aktiv);

    const neu = () => {
        setKundeId(kunden[0]?.id ? String(kunden[0].id) : "");
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
            if (vorhanden) return vorherige.map(item => item.artikelId === auswahl.id
                ? { ...item, menge: item.menge + Number(menge) } : item);
            return [...vorherige, { artikelId: auswahl.id, artikel: auswahl.name, menge: Number(menge), einzelpreis: Number(auswahl.preis) }];
        });
    };

    const speichern = () => {
        const kunde = kunden.find(item => item.id === Number(kundeId));
        if (!kunde || positionen.length === 0) {
            setFehler("Bitte einen Kunden und mindestens eine Position auswählen.");
            return;
        }
        angeboteService.add({ angebotsNr: naechsteAngebotsnummer(), kundeId: kunde.id, kunde: kunde.firma, datum: heute(), status: "offen", positionen });
        setAngebote(angeboteService.getAll());
        setOffen(false);
    };

    const auftragAnlegen = angebot => {
        if (!confirm(`Angebot ${angebot.angebotsNr} in einen Auftrag übernehmen?`)) return;
        angebotInAuftragUebernehmen(angebot.id);
        setAngebote(angeboteService.getAll());
    };

    const data = angebote.map(angebot => ({
        ...angebot,
        positionenText: angebot.positionen.map(position => `${position.artikel} (${position.menge})`).join(", "),
        gesamt: `${gesamtbetrag(angebot.positionen).toFixed(2)} €`
    }));
    const offeneAngebote = angebote.filter(item => item.status === "offen");
    const auftraegeAusAngeboten = angebote.filter(item => item.status === "beauftragt").length;
    const offenerWert = gesamtbetrag(offeneAngebote.flatMap(item => item.positionen));

    return <>
        <OverviewCards cards={[
            { label: "Angebote gesamt", value: angebote.length },
            { label: "Noch offen", value: offeneAngebote.length },
            { label: "Offener Angebotswert", value: `${offenerWert.toFixed(2)} €` },
            { label: "In Aufträge übernommen", value: auftraegeAusAngeboten }
        ]}/>
        <DataTable title="Angebote" selectableColumns={false} data={data.filter(item => !statusFilter || item.status === statusFilter)}
            columns={[
                { field: "angebotsNr", title: "Angebotsnummer" }, { field: "kunde", title: "Kunde" },
                { field: "datum", title: "Datum" }, { field: "status", title: "Status" },
                { field: "gesamt", title: "Gesamt" }, { field: "positionenText", title: "Positionen" }
            ]}
            toolbarActions={[{ name: "new", label: "Neues Angebot", permission: "verkauf.bearbeiten", onClick: neu }]}
            rowActions={[{ name: "order", label: "In Auftrag übernehmen", permission: "verkauf.bearbeiten", onClick: auftragAnlegen }]}
            filters={[{ name: "status", label: "Status", options: [{ value: "offen", label: "Offen" }, { value: "beauftragt", label: "Beauftragt" }] }]}
            onFilter={filters => setStatusFilter(filters.status || "")}
        />
        <Dialog open={offen} title="Neues Angebot" onClose={() => setOffen(false)}>
            <div><Label required>Kunde</Label><select value={kundeId} onChange={event => setKundeId(event.target.value)}>
                <option value="">Bitte wählen</option>{kunden.map(item => <option key={item.id} value={item.id}>{item.firma}</option>)}</select></div>
            <div><Label>Datum</Label><input type="date" value={heute()} disabled/></div>
            <div className="form-row bestellposition-hinzufuegen"><div><Label>Artikel</Label><select value={artikelId} onChange={event => setArtikelId(event.target.value)}>
                <option value="">Bitte wählen</option>{artikel.map(item => <option key={item.id} value={item.id}>{item.name} ({Number(item.preis).toFixed(2)} €)</option>)}</select></div>
                <div><Label>Menge</Label><NumberField value={menge} min="1" onChange={wert => setMenge(Number(wert))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufügen</button></div>
            <div className="form-row"><Label required>Angebotspositionen</Label>
                {positionen.length === 0 ? <p>Noch keine Position vorhanden.</p> : <ul className="positionsliste">{positionen.map(position => <li key={position.artikelId}>{position.artikel}: {position.menge} × {position.einzelpreis.toFixed(2)} €
                    <button type="button" className="link-button" onClick={() => setPositionen(items => items.filter(item => item.artikelId !== position.artikelId))}>Entfernen</button></li>)}</ul>}
                {positionen.length > 0 && <strong>Gesamt: {gesamtbetrag(positionen).toFixed(2)} €</strong>}
                {fehler && <p className="form-error">{fehler}</p>}</div>
            <div className="form-row"><button onClick={speichern}>Angebot speichern</button></div>
        </Dialog>
    </>;
}

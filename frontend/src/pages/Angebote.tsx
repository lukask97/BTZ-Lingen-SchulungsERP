// @ts-nocheck
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import Label from "../components/form/Label";
import LookupField from "../components/form/LookupField";
import NumberField from "../components/form/NumberField";
import angeboteService, { naechsteAngebotsnummer } from "../services/angeboteService";
import auftraegeService from "../services/auftraegeService";
import customerInquiryService from "../services/customerInquiryService";
import kundenService from "../services/customerService";
import artikelService from "../services/artikelService";
import servicesService from "../services/servicesService";
import { angebotInAuftragUebernehmen } from "../services/verkaufService";
import OverviewCards from "../components/OverviewCards";
import vertriebsdokumenteService from "../services/vertriebsdokumenteService";
import versandService from "../services/versandService";
import { getSalesStep, getSalesStepLabel } from "../utils/processFlow";

const heute = () => new Date().toISOString().slice(0, 10);
const inTagen = tage => {
    const datum = new Date();
    datum.setDate(datum.getDate() + tage);
    return datum.toISOString().slice(0, 10);
};
const gesamtbetrag = positionen => positionen.reduce((summe, position) => summe + position.menge * position.einzelpreis, 0);
const istOffenesAngebot = angebot => !["angenommen", "abgelehnt"].includes(String(angebot?.status || "").toLowerCase());

export default function Angebote() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [angebote, setAngebote] = useState(angeboteService.getAll());
    const [offen, setOffen] = useState(false);
    const [kundeId, setKundeId] = useState("");
    const [leistungId, setLeistungId] = useState("");
    const [menge, setMenge] = useState(1);
    const [positionen, setPositionen] = useState([]);
    const [fehler, setFehler] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sourceInquiryId, setSourceInquiryId] = useState("");
    const [gueltigBis, setGueltigBis] = useState(inTagen(14));
    const kunden = kundenService.getAll();
    const artikel = artikelService.getAll().filter(item => item.artikelTyp !== "Komponente");
    const services = servicesService.getAll();
    const leistungen = useMemo(() => [
        ...artikel.map(item => ({ ...item, leistungTyp: "Artikel" })),
        ...services.map(item => ({ ...item, leistungTyp: "Service" }))
    ], [artikel, services]);
    const auftraege = auftraegeService.getAll();
    const vertriebsdokumente = vertriebsdokumenteService.list();
    const versandauftraege = versandService.list();
    const anfragen = customerInquiryService.list();
    const kundenOptionen = kunden.map(item => ({ value: String(item.id), label: `${item.kundenNr} - ${item.firma}` }));
    const leistungsOptionen = leistungen.map(item => ({
        value: `${item.leistungTyp}:${item.id}`,
        label: `${item.leistungTyp === "Service" ? item.serviceNr : item.artikelNr} - ${item.name} [${item.leistungTyp}] (${Number(item.verkaufspreis ?? item.preis ?? 0).toFixed(2)} €)`
    }));

    useEffect(() => {
        if (searchParams.get("new") !== "fromInquiry") return;
        const kundeIdFromQuery = searchParams.get("kundeId") || String(kunden[0]?.id || "");
        setSourceInquiryId(searchParams.get("anfrageId") || "");
        setKundeId(kundeIdFromQuery);
        setLeistungId(leistungen[0] ? `${leistungen[0].leistungTyp}:${leistungen[0].id}` : "");
        setMenge(1);
        setPositionen([]);
        setGueltigBis(inTagen(14));
        setFehler("");
        setOffen(true);
    }, [searchParams, kunden, leistungen]);

    const neu = () => {
        setSourceInquiryId("");
        setKundeId(kunden[0]?.id ? String(kunden[0].id) : "");
        setLeistungId(leistungen[0] ? `${leistungen[0].leistungTyp}:${leistungen[0].id}` : "");
        setMenge(1);
        setPositionen([]);
        setGueltigBis(inTagen(14));
        setFehler("");
        setOffen(true);
    };

    const positionHinzufuegen = () => {
        const auswahl = leistungen.find(item => `${item.leistungTyp}:${item.id}` === String(leistungId));
        if (!auswahl || Number(menge) <= 0) return;
        setPositionen(vorherige => {
            const vorhanden = vorherige.find(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp);
            if (vorhanden) return vorherige.map(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp
                ? { ...item, menge: item.menge + Number(menge) } : item);
            return [...vorherige, {
                artikelId: auswahl.id,
                artikel: auswahl.name,
                artikelTyp: auswahl.leistungTyp === "Service" ? "Dienstleistung" : auswahl.artikelTyp,
                leistungTyp: auswahl.leistungTyp,
                serviceId: auswahl.leistungTyp === "Service" ? auswahl.id : "",
                menge: Number(menge),
                einzelpreis: Number(auswahl.verkaufspreis ?? auswahl.preis ?? 0)
            }];
        });
    };

    const speichern = () => {
        const kunde = kunden.find(item => item.id === Number(kundeId));
        if (!kunde || positionen.length === 0) {
            setFehler("Bitte einen Kunden und mindestens eine Position auswählen.");
            return;
        }
        if (!gueltigBis) {
            setFehler("Bitte eine Frist für das Angebot angeben.");
            return;
        }
        if (gueltigBis < heute()) {
            setFehler("Die Frist darf nicht in der Vergangenheit liegen.");
            return;
        }
        const neuesAngebot = angeboteService.add({
            angebotsNr: naechsteAngebotsnummer(),
            anfrageId: sourceInquiryId ? Number(sourceInquiryId) : "",
            kundeId: kunde.id,
            kunde: kunde.firma,
            datum: heute(),
            gueltigBis,
            status: "offen",
            positionen
        });
        if (sourceInquiryId) {
            const anfrage = anfragen.find(item => String(item.id) === String(sourceInquiryId));
            if (anfrage) {
                customerInquiryService.update({ ...anfrage, status: "in Bearbeitung", angebotId: neuesAngebot.id });
            }
        }
        setAngebote(angeboteService.getAll());
        setSourceInquiryId("");
        setOffen(false);
    };

    const aufAntwortWarten = angebot => {
        if (angebot.status !== "offen") return;
        angeboteService.update({ ...angebot, status: "wartet auf Antwort" });
        setAngebote(angeboteService.getAll());
    };

    const annahmeBestaetigen = angebot => {
        if (angebot.status !== "wartet auf Antwort") {
            alert("Bitte zuerst auf die Kundenantwort warten.");
            return;
        }
        if (!confirm(`Angebot ${angebot.angebotsNr} als angenommen bestätigen und Auftrag anlegen?`)) return;
        angebotInAuftragUebernehmen(angebot.id);
        setAngebote(angeboteService.getAll());
    };

    const ablehnungBestaetigen = angebot => {
        if (angebot.status !== "wartet auf Antwort") {
            alert("Bitte zuerst auf die Kundenantwort warten.");
            return;
        }
        if (!confirm(`Angebot ${angebot.angebotsNr} als abgelehnt markieren?`)) return;
        angeboteService.update({ ...angebot, status: "abgelehnt" });
        if (angebot.anfrageId) {
            const anfrage = anfragen.find(item => String(item.id) === String(angebot.anfrageId));
            if (anfrage) {
                customerInquiryService.update({ ...anfrage, status: "erledigt", angebotId: angebot.id });
            }
        }
        setAngebote(angeboteService.getAll());
    };

    const findeAuftragZuAngebot = (angebotId) => auftraege.find(item => item.angebotId === angebotId);

    const data = angebote.map(angebot => ({
        ...angebot,
        positionenText: angebot.positionen.map(position => `${position.artikel} (${position.menge})`).join(", "),
        gesamt: `${gesamtbetrag(angebot.positionen).toFixed(2)} €`,
        prozess: getSalesStepLabel(getSalesStep(angebot, auftraege, vertriebsdokumente, versandauftraege))
    }));
    const offeneAngebote = angebote.filter(istOffenesAngebot);
    const auftraegeAusAngeboten = angebote.filter(item => item.status === "angenommen").length;
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
                { field: "angebotsNr", title: "Angebotsnummer" }, { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "datum", title: "Datum" }, { field: "gueltigBis", title: "Gültig bis", render: row => row.gueltigBis || "-" }, { field: "status", title: "Status" },
                { field: "prozess", title: "Prozess" }, { field: "gesamt", title: "Gesamt" }, { field: "positionenText", title: "Positionen" }
            ]}
            focusRowId={searchParams.get("focus") || ""}
            toolbarActions={[{ name: "new", label: "Neues Angebot", permission: "verkauf.bearbeiten", onClick: neu }]}
            rowActions={[
                { name: "wait", label: "Auf Antwort warten", permission: "verkauf.bearbeiten", onClick: aufAntwortWarten, variant: "secondary", isVisible: row => row.status === "offen" },
                { name: "accept", label: "Annahme bestätigen", permission: "verkauf.bearbeiten", onClick: annahmeBestaetigen, variant: "success", isVisible: row => row.status === "wartet auf Antwort" },
                { name: "reject", label: "Ablehnung bestätigen", permission: "verkauf.bearbeiten", onClick: ablehnungBestaetigen, variant: "danger", isVisible: row => row.status === "wartet auf Antwort" },
                { name: "orderOpen", label: "Auftrag öffnen", permission: "verkauf.bearbeiten", onClick: row => {
                    const auftrag = findeAuftragZuAngebot(row.id);
                    if (auftrag) navigate(`/auftraege?focus=${auftrag.id}`);
                }, variant: "secondary", isVisible: row => !!findeAuftragZuAngebot(row.id) },
                { name: "documents", label: "Dokumente", permission: "verkauf.bearbeiten", onClick: row => {
                    const auftrag = findeAuftragZuAngebot(row.id);
                    if (auftrag) navigate(`/vertriebsdokumente?auftrag=${auftrag.id}`);
                }, variant: "secondary", isVisible: row => !!findeAuftragZuAngebot(row.id) }
            ]}
            filters={[{ name: "status", label: "Status", options: [
                { value: "offen", label: "Offen" },
                { value: "wartet auf Antwort", label: "Wartet auf Antwort" },
                { value: "angenommen", label: "Angenommen" },
                { value: "abgelehnt", label: "Abgelehnt" }
            ] }]}
            onFilter={filters => setStatusFilter(filters.status || "")}
            detailLinkResolver={({ field, row, value }) => {
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                if (field === "anfrageId" && value) return `/kundenanfragen?focus=${value}`;
                return null;
            }}
        />
        <Dialog open={offen} title="Neues Angebot" onClose={() => setOffen(false)}>
            <div><Label required>Kunde</Label><LookupField value={kundeId} options={kundenOptionen} onChange={setKundeId} placeholder="Kunde suchen..."/></div>
            <div className="form-row">
                <div><Label>Datum</Label><input type="date" value={heute()} disabled/></div>
                <div><Label required>Gültig bis</Label><input type="date" value={gueltigBis} onChange={event => setGueltigBis(event.target.value)}/></div>
            </div>
            <div className="form-row bestellposition-hinzufuegen"><div><Label>Artikel / Service</Label><LookupField value={leistungId} options={leistungsOptionen} onChange={setLeistungId} placeholder="Artikel oder Service suchen..."/></div>
                <div><Label>Menge</Label><NumberField value={menge} min="1" onChange={wert => setMenge(Number(wert))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufügen</button></div>
            <div className="form-row"><Label required>Angebotspositionen</Label>
                {positionen.length === 0 ? <p>Noch keine Position vorhanden.</p> : <ul className="positionsliste">{positionen.map(position => <li key={`${position.leistungTyp}-${position.artikelId}`}>{position.artikel} [{position.leistungTyp}]: {position.menge} × {position.einzelpreis.toFixed(2)} €
                    <button type="button" className="link-button" onClick={() => setPositionen(items => items.filter(item => !(item.artikelId === position.artikelId && item.leistungTyp === position.leistungTyp)))}>Entfernen</button></li>)}</ul>}
                {positionen.length > 0 && <strong>Gesamt: {gesamtbetrag(positionen).toFixed(2)} €</strong>}
                {fehler && <p className="form-error">{fehler}</p>}</div>
            <div className="form-row"><button onClick={speichern}>Angebot speichern</button></div>
        </Dialog>
    </>;
}

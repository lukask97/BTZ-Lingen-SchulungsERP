// @ts-nocheck
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import TextArea from "../../components/form/TextArea";
import angeboteService, { naechsteAngebotsnummer } from "../../services/verkauf/angeboteService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import kundenService from "../../services/verkauf/customerService";
import artikelService from "../../services/logistik/artikelService";
import servicesService from "../../services/verkauf/servicesService";
import nachrichtenService, { listNachrichtenZuVorgang } from "../../services/verkauf/nachrichtenService";
import { angebotInAuftragUebernehmen } from "../../services/verkauf/verkaufService";
import OverviewCards from "../../components/OverviewCards";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import versandService from "../../services/logistik/versandService";
import { getCustomerName } from "../../utils/customerReferences";
import { getSalesStep, getSalesStepLabel } from "../../utils/processFlow";
import { naechsteAngebotsrevision } from "../../services/verkauf/angeboteService";
import { openDocumentPdf } from "../../utils/documentPdf";

const heute = () => "2026-07-27";
const jetzt = () => new Date().toISOString();
const inTagen = tage => {
    const datum = new Date("2026-07-27");
    datum.setDate(datum.getDate() + tage);
    return datum.toISOString().slice(0, 10);
};
const gesamtbetrag = positionen => positionen.reduce((summe, position) => summe + position.menge * position.einzelpreis, 0);
const gesamtNachAbzug = (positionen, rabattBetrag = 0) => Math.max(0, gesamtbetrag(positionen) - Number(rabattBetrag || 0));
const istOffenesAngebot = angebot => !["angenommen", "abgelehnt", "ersetzt"].includes(String(angebot?.status || "").toLowerCase());

export default function Angebote() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [angebote, setAngebote] = useState(angeboteService.getAll());
    const [offen, setOffen] = useState(false);
    const [verhandlungOpen, setVerhandlungOpen] = useState(false);
    const [editOfferId, setEditOfferId] = useState(null);
    const [kundeId, setKundeId] = useState("");
    const [leistungId, setLeistungId] = useState("");
    const [menge, setMenge] = useState(1);
    const [positionen, setPositionen] = useState([]);
    const [fehler, setFehler] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sourceInquiryId, setSourceInquiryId] = useState("");
    const [gueltigBis, setGueltigBis] = useState(inTagen(14));
    const [rabattBetrag, setRabattBetrag] = useState(0);
    const [verguenstigungsGrund, setVerguenstigungsGrund] = useState("");
    const [angebotsNrDraft, setAngebotsNrDraft] = useState("");
    const [verhandlungsAngebot, setVerhandlungsAngebot] = useState(null);
    const [vorgangsNachrichten, setVorgangsNachrichten] = useState([]);
    const [nachrichtenForm, setNachrichtenForm] = useState({ kanal: "E-Mail", betreff: "", nachricht: "" });
    const kunden = kundenService.getAll();
    const artikel = artikelService.getAll().filter(item => item.istVerkaeuflich);
    const services = servicesService.getAll();
    const leistungen = useMemo(() => [
        ...artikel.map(item => ({ ...item, leistungTyp: "Artikel" })),
        ...services.map(item => ({ ...item, leistungTyp: "Service" }))
    ], [artikel, services]);
    const auftraege = auftraegeService.getAll();
    const vertriebsdokumente = vertriebsdokumenteService.list();
    const versandauftraege = versandService.list();
    const anfragen = customerInquiryService.list();
    const findeAnfrage = anfrageId => anfragen.find(item => String(item.id) === String(anfrageId));
    const angeboteZuVorgang = vorgangId => angebote
        .filter(item => item.vorgangId === vorgangId)
        .sort((a, b) => Number(a.revision || 0) - Number(b.revision || 0));
    const kundenOptionen = kunden.map(item => ({ value: String(item.id), label: `${item.kundenNr} - ${item.firma}` }));
    const leistungsOptionen = leistungen.map(item => ({
        value: `${item.leistungTyp}:${item.id}`,
        label: `${item.leistungTyp === "Service" ? item.serviceNr : item.artikelNr} - ${item.name} [${item.leistungTyp === "Artikel" ? item.artikelTyp : item.leistungTyp}] (${Number(item.verkaufspreis ?? item.preis ?? 0).toFixed(2)} EUR)`
    }));
    const newMode = searchParams.get("new");
    const inquiryIdFromQuery = searchParams.get("anfrageId") || "";
    const kundeIdFromQuery = searchParams.get("kundeId") || "";
    const defaultKundeId = String(kunden[0]?.id || "");
    const defaultLeistungId = leistungen[0] ? `${leistungen[0].leistungTyp}:${leistungen[0].id}` : "";
    const angebotColumns = [
        { field: "angebotsNr", title: "Angebotsnummer" },
        { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
        { field: "datum", title: "Datum" },
        { field: "gueltigBis", title: "Gueltig bis", render: row => row.gueltigBis || "-" },
        { field: "status", title: "Status" },
        { field: "anliegenText", title: "Anliegen" },
        { field: "prozess", title: "Prozess" },
        { field: "gesamt", title: "Gesamt" },
        { field: "positionenText", title: "Positionen" }
    ];

    useEffect(() => {
        if (newMode !== "fromInquiry") return;
        setSourceInquiryId(inquiryIdFromQuery);
        setKundeId(kundeIdFromQuery || defaultKundeId);
        setLeistungId(defaultLeistungId);
        setMenge(1);
        setPositionen([]);
        setGueltigBis(inTagen(14));
        setRabattBetrag(0);
        setVerguenstigungsGrund("");
        setFehler("");
        setAngebotsNrDraft(naechsteAngebotsnummer());
        setEditOfferId(null);
        setOffen(true);
    }, [newMode, inquiryIdFromQuery, kundeIdFromQuery, defaultKundeId, defaultLeistungId]);

    const handleClose = () => {
        setOffen(false);
        setFehler("");
        if (newMode) {
            navigate("/angebote", { replace: true });
        }
    };

    const neu = () => {
        setSourceInquiryId("");
        setKundeId(defaultKundeId);
        setLeistungId(defaultLeistungId);
        setMenge(1);
        setPositionen([]);
        setGueltigBis(inTagen(14));
        setRabattBetrag(0);
        setVerguenstigungsGrund("");
        setFehler("");
        setAngebotsNrDraft(naechsteAngebotsnummer());
        setEditOfferId(null);
        setOffen(true);
    };

    const angebotBearbeiten = angebot => {
        setEditOfferId(angebot.id);
        setSourceInquiryId(String(angebot.anfrageId || ""));
        setKundeId(String(angebot.kundeId || defaultKundeId));
        setLeistungId(defaultLeistungId);
        setMenge(1);
        setPositionen((angebot.positionen || []).map(position => ({ ...position })));
        setGueltigBis(angebot.gueltigBis || inTagen(14));
        setRabattBetrag(Number(angebot.rabattBetrag || 0));
        setVerguenstigungsGrund(angebot.verguenstigungsGrund || "");
        setVorgangsNachrichten(listNachrichtenZuVorgang(angebot.vorgangId));
        setFehler("");
        setAngebotsNrDraft(angebot.angebotsNr);
        setOffen(true);
    };

    const positionHinzufuegen = () => {
        const auswahl = leistungen.find(item => `${item.leistungTyp}:${item.id}` === String(leistungId));
        if (!auswahl || Number(menge) <= 0) return;
        setPositionen(vorherige => {
            const vorhanden = vorherige.find(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp);
            if (vorhanden) {
                return vorherige.map(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp
                    ? { ...item, menge: item.menge + Number(menge) } : item);
            }
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
            setFehler("Bitte einen Kunden und mindestens eine Position auswaehlen.");
            return;
        }
        if (!gueltigBis) {
            setFehler("Bitte eine Frist fuer das Angebot angeben.");
            return;
        }
        if (gueltigBis < heute()) {
            setFehler("Die Frist darf nicht in der Vergangenheit liegen.");
            return;
        }
        const payload = {
            angebotsNr: angebotsNrDraft,
            angebotsBasisNr: String(angebotsNrDraft).replace(/\.\d+$/, ""),
            revision: Number(String(angebotsNrDraft).split(".").at(-1) || 0),
            vorgangId: sourceInquiryId ? `anfrage-${sourceInquiryId}` : `angebot-${String(angebotsNrDraft).replace(/\.\d+$/, "")}`,
            anfrageId: sourceInquiryId ? Number(sourceInquiryId) : "",
            kundeId: kunde.id,
            datum: heute(),
            gueltigBis,
            rabattBetrag: Number(rabattBetrag || 0),
            verguenstigungsGrund: verguenstigungsGrund.trim(),
            gesamtbetrag: gesamtNachAbzug(positionen, rabattBetrag),
            status: "offen",
            positionen
        };
        const neuesAngebot = editOfferId
            ? angeboteService.update(editOfferId, payload)
            : angeboteService.add(payload);
        if (sourceInquiryId && !editOfferId) {
            const anfrage = anfragen.find(item => String(item.id) === String(sourceInquiryId));
            if (anfrage) {
                customerInquiryService.update({ ...anfrage, status: "in Bearbeitung", angebotId: neuesAngebot.id, vorgangId: anfrage.vorgangId || `anfrage-${anfrage.id}` });
                nachrichtenService.create({
                    vorgangId: anfrage.vorgangId || `anfrage-${anfrage.id}`,
                    anfrageId: anfrage.id,
                    angebotId: neuesAngebot.id,
                    datum: heute(),
                    zeitpunkt: jetzt(),
                    senderRolle: "Verkauf",
                    senderName: "Schülerfirma Verkauf",
                    kanal: "E-Mail",
                    betreff: `Angebot ${neuesAngebot.angebotsNr}`,
                    nachricht: "Ein Angebot wurde erstellt und zur Rückmeldung weitergegeben.",
                    typ: "Angebot"
                });
            }
        }
        setAngebote(angeboteService.getAll());
        setSourceInquiryId("");
        setEditOfferId(null);
        handleClose();
    };

    const aufAntwortWarten = angebot => {
        if (angebot.status !== "offen") return;
        angeboteService.update({ ...angebot, status: "wartet auf Antwort" });
        nachrichtenService.create({
            vorgangId: angebot.vorgangId,
            anfrageId: angebot.anfrageId || "",
            angebotId: angebot.id,
            datum: heute(),
            zeitpunkt: jetzt(),
            senderRolle: "Verkauf",
            senderName: "Schülerfirma Verkauf",
            kanal: "E-Mail",
            betreff: `Angebot ${angebot.angebotsNr} versendet`,
            nachricht: "Das Angebot wurde zur Prüfung an den Kunden weitergegeben. Es wird auf Rückmeldung gewartet.",
            typ: "Status"
        });
        setAngebote(angeboteService.getAll());
    };

    const annahmeBestaetigen = angebot => {
        if (angebot.status !== "wartet auf Antwort") {
            alert("Bitte zuerst auf die Kundenantwort warten.");
            return;
        }
        if (!confirm(`Angebot ${angebot.angebotsNr} als angenommen bestaetigen und Auftrag anlegen?`)) return;
        angebotInAuftragUebernehmen(angebot.id);
        nachrichtenService.create({
            vorgangId: angebot.vorgangId,
            anfrageId: angebot.anfrageId || "",
            angebotId: angebot.id,
            datum: heute(),
            zeitpunkt: jetzt(),
            senderRolle: "Kunde",
            senderName: angebot.kunde || getCustomerName(angebot.kundeId, ""),
            kanal: "E-Mail",
            betreff: `Annahme ${angebot.angebotsNr}`,
            nachricht: "Der Kunde hat das Angebot angenommen.",
            typ: "Antwort"
        });
        setAngebote(angeboteService.getAll());
    };

    const ablehnungBestaetigen = angebot => {
        if (angebot.status !== "wartet auf Antwort") {
            alert("Bitte zuerst auf die Kundenantwort warten.");
            return;
        }
        if (!confirm(`Angebot ${angebot.angebotsNr} als abgelehnt markieren?`)) return;
        angeboteService.update({ ...angebot, status: "abgelehnt" });
        nachrichtenService.create({
            vorgangId: angebot.vorgangId,
            anfrageId: angebot.anfrageId || "",
            angebotId: angebot.id,
            datum: heute(),
            zeitpunkt: jetzt(),
            senderRolle: "Kunde",
            senderName: angebot.kunde || getCustomerName(angebot.kundeId, ""),
            kanal: "E-Mail",
            betreff: `Ablehnung ${angebot.angebotsNr}`,
            nachricht: "Der Kunde hat das Angebot abgelehnt.",
            typ: "Antwort"
        });
        if (angebot.anfrageId) {
            const anfrage = anfragen.find(item => String(item.id) === String(angebot.anfrageId));
            if (anfrage) {
                customerInquiryService.update({ ...anfrage, status: "erledigt", angebotId: angebot.id });
            }
        }
        setAngebote(angeboteService.getAll());
    };

    const verhandlungOeffnen = angebot => {
        setVerhandlungsAngebot(angebot);
        setVorgangsNachrichten(listNachrichtenZuVorgang(angebot.vorgangId));
        setNachrichtenForm({
            kanal: "E-Mail",
            betreff: `Rückfrage zu ${angebot.angebotsNr}`,
            nachricht: ""
        });
        setVerhandlungOpen(true);
    };

    const nachrichtSpeichern = () => {
        if (!verhandlungsAngebot || !nachrichtenForm.nachricht.trim()) return;
        nachrichtenService.create({
            vorgangId: verhandlungsAngebot.vorgangId,
            anfrageId: verhandlungsAngebot.anfrageId || "",
            angebotId: verhandlungsAngebot.id,
            datum: heute(),
            zeitpunkt: jetzt(),
            senderRolle: "Kunde",
            senderName: verhandlungsAngebot.kunde,
            kanal: nachrichtenForm.kanal,
            betreff: nachrichtenForm.betreff.trim() || "Nachricht",
            nachricht: nachrichtenForm.nachricht.trim(),
            typ: "Nachricht"
        });
        if (verhandlungsAngebot.status !== "angenommen") {
            angeboteService.update({ ...verhandlungsAngebot, status: "neu verhandeln" });
            setAngebote(angeboteService.getAll());
            setVerhandlungsAngebot(current => current ? { ...current, status: "neu verhandeln" } : current);
        }
        setVorgangsNachrichten(listNachrichtenZuVorgang(verhandlungsAngebot.vorgangId));
        setNachrichtenForm(form => ({ ...form, nachricht: "" }));
    };

    const neuesVerhandlungsangebot = () => {
        if (!verhandlungsAngebot) return;
        const revisionInfo = naechsteAngebotsrevision(verhandlungsAngebot.vorgangId);
        angeboteService.update({ ...verhandlungsAngebot, status: "ersetzt" });
        const neuesAngebot = angeboteService.add({
            ...verhandlungsAngebot,
            id: undefined,
            angebotsBasisNr: revisionInfo.angebotsBasisNr,
            revision: revisionInfo.revision,
            angebotsNr: `${revisionInfo.angebotsBasisNr}.${revisionInfo.revision}`,
            datum: heute(),
            status: "offen"
        });
        if (verhandlungsAngebot.anfrageId) {
            const anfrage = customerInquiryService.list().find(item => String(item.id) === String(verhandlungsAngebot.anfrageId));
            if (anfrage) customerInquiryService.update({ ...anfrage, angebotId: neuesAngebot.id, status: "in Bearbeitung" });
        }
        nachrichtenService.create({
            vorgangId: neuesAngebot.vorgangId,
            anfrageId: neuesAngebot.anfrageId || "",
            angebotId: neuesAngebot.id,
            datum: heute(),
            zeitpunkt: jetzt(),
            senderRolle: "Verkauf",
            senderName: "Schülerfirma Verkauf",
            kanal: "E-Mail",
            betreff: `Neues Angebot ${neuesAngebot.angebotsNr}`,
            nachricht: "Auf Basis der Verhandlung wurde ein überarbeitetes Angebot erstellt.",
            typ: "Angebot"
        });
        setAngebote(angeboteService.getAll());
        setVerhandlungsAngebot(neuesAngebot);
        setVorgangsNachrichten(listNachrichtenZuVorgang(neuesAngebot.vorgangId));
    };

    const angebotAlsPdf = angebot => {
        openDocumentPdf({
            title: `Angebot ${angebot.angebotsNr}`,
            subject: "Automatisch erzeugtes Angebotsdokument für den Schulungseinsatz.",
            date: angebot.datum,
            note: angebot.verguenstigungsGrund || "Kein zusätzlicher Hinweis hinterlegt.",
            referenceLabel: "Angebot",
            referenceValue: angebot.angebotsNr,
            partnerLabel: "Kunde",
            partnerValue: angebot.kunde,
            positions: angebot.positionen || [],
            deductionAmount: angebot.rabattBetrag || 0,
            deductionReason: angebot.verguenstigungsGrund || ""
        });
    };

    const angebotAusVerhandlungBearbeiten = angebot => {
        setVerhandlungOpen(false);
        angebotBearbeiten(angebot);
    };

    const data = angebote
        .filter(angebot => String(angebot.status || "").toLowerCase() !== "ersetzt")
        .map(angebot => ({
        ...angebot,
        kunde: getCustomerName(angebot.kundeId, angebot.kunde),
        anliegenText: findeAnfrage(angebot.anfrageId)?.anliegen || "-",
        positionenText: angebot.positionen.map(position => `${position.artikel} (${position.menge})`).join(", "),
        gesamt: `${gesamtNachAbzug(angebot.positionen, angebot.rabattBetrag).toFixed(2)} EUR`,
        prozess: getSalesStepLabel(getSalesStep(angebot, auftraege, vertriebsdokumente, versandauftraege))
    }));
    const offeneAngebote = angebote.filter(istOffenesAngebot);
    const auftraegeAusAngeboten = angebote.filter(item => item.status === "angenommen").length;
    const offenerWert = offeneAngebote.reduce((summe, angebot) => summe + gesamtNachAbzug(angebot.positionen, angebot.rabattBetrag), 0);

    return <>
        <OverviewCards cards={[
            { label: "Angebote gesamt", value: angebote.length },
            { label: "Noch offen", value: offeneAngebote.length },
            { label: "Offener Angebotswert", value: `${offenerWert.toFixed(2)} EUR` },
            { label: "In Auftraege uebernommen", value: auftraegeAusAngeboten }
        ]}/>
        <DataTable title="Angebote" selectableColumns data={data.filter(item => !statusFilter || item.status === statusFilter)}
            columns={angebotColumns}
            allColumns={angebotColumns}
            focusRowId={searchParams.get("focus") || ""}
            toolbarActions={[{ name: "new", label: "Neues Angebot", permission: "verkauf.bearbeiten", onClick: neu }]}
            rowActions={[
                { name: "thread", label: "Verhandlung", permission: "verkauf.bearbeiten", onClick: verhandlungOeffnen, variant: "secondary" },
                { name: "edit", label: "Bearbeiten", permission: "verkauf.bearbeiten", onClick: angebotBearbeiten, variant: "secondary", isVisible: row => !["angenommen", "abgelehnt"].includes(String(row.status || "").toLowerCase()) },
                { name: "pdf", label: "PDF", permission: "verkauf.bearbeiten", onClick: angebotAlsPdf, variant: "secondary" },
                { name: "wait", label: "Auf Antwort warten", permission: "verkauf.bearbeiten", onClick: aufAntwortWarten, variant: "secondary", isVisible: row => row.status === "offen" },
                { name: "accept", label: "Annahme bestaetigen", permission: "verkauf.bearbeiten", onClick: annahmeBestaetigen, variant: "success", isVisible: row => row.status === "wartet auf Antwort" },
                { name: "reject", label: "Ablehnung bestaetigen", permission: "verkauf.bearbeiten", onClick: ablehnungBestaetigen, variant: "danger", isVisible: row => row.status === "wartet auf Antwort" }
            ]}
            filters={[{ name: "status", label: "Status", options: [
                { value: "offen", label: "Offen" },
                { value: "wartet auf Antwort", label: "Wartet auf Antwort" },
                { value: "neu verhandeln", label: "Neu verhandeln" },
                { value: "ersetzt", label: "Ersetzt" },
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
        <Dialog open={offen} title={editOfferId ? "Angebot bearbeiten" : "Neues Angebot"} onClose={handleClose}>
            {sourceInquiryId && findeAnfrage(sourceInquiryId) && <div className="module-panel">
                <div><Label>Ausgangsanfrage</Label><p>{findeAnfrage(sourceInquiryId)?.anliegen}</p></div>
            </div>}
            {editOfferId && vorgangsNachrichten.length > 0 && <div className="module-panel">
                <div><Label>Nachrichtenverlauf zum Vorgang</Label></div>
                <ul className="positionsliste">
                    {vorgangsNachrichten.map(item => <li key={item.id}><strong>{String(item.zeitpunkt || item.datum).replace("T", " ").slice(0, 16)}</strong> - {item.senderRolle}: {item.betreff}<br/>{item.nachricht}</li>)}
                </ul>
            </div>}
            <div><Label required>Kunde</Label><LookupField value={kundeId} options={kundenOptionen} onChange={setKundeId} placeholder="Kunde suchen..."/></div>
            <div className="form-row">
                <div><Label>Angebotsnummer</Label><input type="text" value={angebotsNrDraft} disabled/></div>
                <div><Label required>Gueltig bis</Label><input type="date" value={gueltigBis} onChange={event => setGueltigBis(event.target.value)}/></div>
            </div>
            <div className="form-row bestellposition-hinzufuegen"><div><Label>Artikel / Service</Label><LookupField value={leistungId} options={leistungsOptionen} onChange={setLeistungId} placeholder="Artikel oder Service suchen..."/></div>
                <div><Label>Menge</Label><NumberField value={menge} min="1" onChange={wert => setMenge(Number(wert))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufuegen</button></div>
            <div className="form-row"><p>Es werden nur Artikel mit VK-Preis angezeigt. Komponenten und Baugruppen koennen verkauft werden, wenn ein VK-Preis hinterlegt ist.</p></div>
            <div className="form-row"><Label required>Angebotspositionen</Label>
                {positionen.length === 0 ? <p>Noch keine Position vorhanden.</p> : <ul className="positionsliste">{positionen.map(position => <li key={`${position.leistungTyp}-${position.artikelId}`}>{position.artikel} [{position.leistungTyp}]: {position.menge} x {position.einzelpreis.toFixed(2)} EUR
                    <button type="button" className="link-button" onClick={() => setPositionen(items => items.filter(item => !(item.artikelId === position.artikelId && item.leistungTyp === position.leistungTyp)))}>Entfernen</button></li>)}</ul>}
                {positionen.length > 0 && <>
                    <strong>Zwischensumme: {gesamtbetrag(positionen).toFixed(2)} EUR</strong>
                    <div className="form-row">
                        <div>
                            <Label>Verguenstigung</Label>
                            <NumberField value={rabattBetrag} min="0" step="0.01" format="currency" onChange={wert => setRabattBetrag(Number(wert || 0))}/>
                        </div>
                    </div>
                    <div className="form-row">
                        <div>
                            <Label>Grund fuer Verguenstigung</Label>
                            <TextArea rows={2} value={verguenstigungsGrund} onChange={setVerguenstigungsGrund} placeholder="z. B. Spar-Paket, Mengenrabatt, Familienrabatt..."/>
                        </div>
                    </div>
                    <strong>Gesamt nach Verguenstigung: {gesamtNachAbzug(positionen, rabattBetrag).toFixed(2)} EUR</strong>
                </>}
                {fehler && <p className="form-error">{fehler}</p>}</div>
            <div className="form-row"><button onClick={speichern}>Angebot speichern</button></div>
        </Dialog>
        <Dialog open={verhandlungOpen} title={verhandlungsAngebot ? `Verhandlung zu ${verhandlungsAngebot.angebotsNr}` : "Verhandlung"} onClose={() => setVerhandlungOpen(false)}>
            {verhandlungsAngebot && <>
                <div className="module-panel">
                    <div><Label>Vorgang</Label><strong>{verhandlungsAngebot.vorgangId}</strong></div>
                    <div><Label>Kunde</Label><strong>{verhandlungsAngebot.kunde}</strong></div>
                    <div><Label>Aktueller Angebotsstand</Label><strong>{verhandlungsAngebot.angebotsNr}</strong></div>
                    <div><Label>Status</Label><strong>{verhandlungsAngebot.status}</strong></div>
                </div>
                <div className="form-row">
                    <Label>Angebotsstaende</Label>
                    <ul className="positionsliste">
                        {angeboteZuVorgang(verhandlungsAngebot.vorgangId).map(item => <li key={item.id}>{item.angebotsNr} - {item.status}</li>)}
                    </ul>
                </div>
                <div className="form-row">
                    <Label>Nachrichtenverlauf</Label>
                    {vorgangsNachrichten.length === 0 ? <p>Noch keine Nachrichten vorhanden.</p> : <ul className="positionsliste">
                    {vorgangsNachrichten.map(item => <li key={item.id}><strong>{String(item.zeitpunkt || item.datum).replace("T", " ").slice(0, 16)}</strong> - {item.senderRolle}: {item.betreff}<br/>{item.nachricht}</li>)}
                    </ul>}
                </div>
                <div className="form-row">
                    <div><Label>Kanal</Label><select value={nachrichtenForm.kanal} onChange={event => setNachrichtenForm(value => ({ ...value, kanal: event.target.value }))}><option>E-Mail</option><option>Telefon</option><option>Portal</option></select></div>
                </div>
                <div><Label>Betreff</Label><input type="text" value={nachrichtenForm.betreff} onChange={event => setNachrichtenForm(value => ({ ...value, betreff: event.target.value }))}/></div>
                <div className="form-row"><Label>Nachricht</Label><TextArea rows={4} value={nachrichtenForm.nachricht} onChange={value => setNachrichtenForm(form => ({ ...form, nachricht: value }))} placeholder="Rueckfrage, Aenderungswunsch oder Antwort erfassen..."/></div>
                <div className="form-row">
                    <button type="button" className="button-secondary" onClick={nachrichtSpeichern}>Nachricht speichern</button>
                    <button type="button" className="button-secondary" onClick={() => angebotAusVerhandlungBearbeiten(verhandlungsAngebot)}>Aktuelles Angebot bearbeiten</button>
                    <button type="button" className="button-secondary" onClick={() => angebotAlsPdf(verhandlungsAngebot)}>PDF öffnen</button>
                    <button type="button" onClick={neuesVerhandlungsangebot}>Neues Angebotsupdate anlegen</button>
                </div>
            </>}
        </Dialog>
    </>;
}

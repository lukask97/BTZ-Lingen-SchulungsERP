import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import TextArea from "../../components/form/TextArea";
import OverviewCards from "../../components/OverviewCards";
import auftraegeService from "../../services/verkauf/auftraegeService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import kundenService from "../../services/verkauf/customerService";
import artikelService from "../../services/logistik/artikelService";
import servicesService from "../../services/verkauf/servicesService";
import versandService from "../../services/logistik/versandService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import { kundenanfrageInAuftragUebernehmen, naechsteAuftragsnummer } from "../../services/verkauf/verkaufService";
import { getCustomerName } from "../../utils/customerReferences";
import { canStartShipping, getConfirmationDocument, getSalesStepLabel, SALES_STEPS } from "../../utils/processFlow";

const heute = "2026-07-27";
const gesamtbetrag = positionen => positionen.reduce((summe, position) => summe + Number(position.menge) * Number(position.einzelpreis), 0);
const inTagen = tage => {
    const datum = new Date("2026-07-27");
    datum.setDate(datum.getDate() + tage);
    return datum.toISOString().slice(0, 10);
};
const toLeistung = (item, typ) => ({
    id: item.id,
    leistungTyp: typ,
    nummer: typ === "Service" ? item.serviceNr : item.artikelNr,
    name: item.name,
    preis: Number(item.verkaufspreis ?? item.preis ?? 0),
    artikelTyp: typ === "Service" ? "Dienstleistung" : item.artikelTyp
});

export default function Auftraege() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [open, setOpen] = useState(false);
    const [sourceInquiryId, setSourceInquiryId] = useState("");
    const [kundeId, setKundeId] = useState("");
    const [leistungId, setLeistungId] = useState("");
    const [menge, setMenge] = useState(1);
    const [positionenDraft, setPositionenDraft] = useState([]);
    const [faelligAm, setFaelligAm] = useState(inTagen(14));
    const [rabattBetrag, setRabattBetrag] = useState(0);
    const [verguenstigungsGrund, setVerguenstigungsGrund] = useState("");
    const [fehler, setFehler] = useState("");
    const [auftragNrDraft, setAuftragNrDraft] = useState("");

    const auftraege = useMemo(() => auftraegeService.getAll(), [refreshKey]);
    const versandauftraege = versandService.list();
    const vertriebsdokumente = vertriebsdokumenteService.list();
    const anfragen = customerInquiryService.list();
    const kunden = kundenService.list();
    const artikel = artikelService.getAll().filter(item => item.istVerkaeuflich);
    const services = servicesService.getAll();
    const leistungen = [
        ...artikel.map(item => toLeistung(item, "Artikel")),
        ...services.map(item => toLeistung(item, "Service"))
    ];
    const kundenOptionen = kunden.map(item => ({ value: String(item.id), label: `${item.kundenNr} - ${item.firma}` }));
    const leistungsOptionen = leistungen.map(item => ({
        value: `${item.leistungTyp}:${item.id}`,
        label: `${item.nummer} - ${item.name} (${item.preis.toFixed(2)} EUR)`
    }));
    const findeAnfrage = anfrageId => anfragen.find(item => String(item.id) === String(anfrageId));
    const newMode = searchParams.get("new");
    const inquiryIdFromQuery = searchParams.get("anfrageId") || "";
    const kundeIdFromQuery = searchParams.get("kundeId") || "";
    const defaultKundeId = String(kunden[0]?.id || "");
    const defaultLeistungId = leistungen[0] ? `${leistungen[0].leistungTyp}:${leistungen[0].id}` : "";

    useEffect(() => {
        if (newMode !== "fromInquiry") return;
        setSourceInquiryId(inquiryIdFromQuery);
        setKundeId(kundeIdFromQuery || defaultKundeId);
        setLeistungId(defaultLeistungId);
        setMenge(1);
        setPositionenDraft([]);
        setFaelligAm(inTagen(14));
        setRabattBetrag(0);
        setVerguenstigungsGrund("");
        setFehler("");
        setAuftragNrDraft(naechsteAuftragsnummer());
        setOpen(true);
    }, [newMode, inquiryIdFromQuery, kundeIdFromQuery, defaultKundeId, defaultLeistungId]);

    const findeVersandZuAuftrag = (auftragId) => versandauftraege.find(item => String(item.auftragId) === String(auftragId));

    const data = auftraege.map(auftrag => {
        const anfrageId = "anfrageId" in auftrag ? auftrag.anfrageId : "";
        return {
            ...auftrag,
            kunde: getCustomerName(auftrag.kundeId, auftrag.kunde),
            anliegenText: findeAnfrage(anfrageId)?.anliegen || "-",
            positionenText: (auftrag.positionen || []).map(position => `${position.artikel} (${position.menge})`).join(", "),
            prozess: getSalesStepLabel(
                findeVersandZuAuftrag(auftrag.id)?.status === "versendet"
                    ? SALES_STEPS.VERSAND_VERSENDET
                    : findeVersandZuAuftrag(auftrag.id)
                        ? SALES_STEPS.VERSAND_ERSTELLT
                        : getConfirmationDocument(auftrag.id, vertriebsdokumente)?.status === "versendet"
                            ? SALES_STEPS.AUFTRAGSBESTAETIGUNG_GESENDET
                            : getConfirmationDocument(auftrag.id, vertriebsdokumente)
                                ? SALES_STEPS.AUFTRAGSBESTAETIGUNG_ERSTELLT
                                : SALES_STEPS.ANGEBOT_ANGENOMMEN
            )
        };
    });

    const offeneAuftraege = auftraege.filter(auftrag => auftrag.status === "offen");
    const positionen = auftraege.reduce((summe, auftrag) => summe + (auftrag.positionen || []).length, 0);

    const neu = () => {
        setSourceInquiryId("");
        setKundeId(defaultKundeId);
        setLeistungId(defaultLeistungId);
        setMenge(1);
        setPositionenDraft([]);
        setFaelligAm(inTagen(14));
        setRabattBetrag(0);
        setVerguenstigungsGrund("");
        setFehler("");
        setAuftragNrDraft(naechsteAuftragsnummer());
        setOpen(true);
    };

    const positionHinzufuegen = () => {
        const auswahl = leistungen.find(item => `${item.leistungTyp}:${item.id}` === String(leistungId));
        if (!auswahl || Number(menge) <= 0) return;
        setPositionenDraft(vorherige => {
            const vorhanden = vorherige.find(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp);
            if (vorhanden) {
                return vorherige.map(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp
                    ? { ...item, menge: Number(item.menge) + Number(menge) }
                    : item);
            }
            return [...vorherige, {
                artikelId: auswahl.id,
                artikel: auswahl.name,
                artikelTyp: auswahl.artikelTyp,
                leistungTyp: auswahl.leistungTyp,
                serviceId: auswahl.leistungTyp === "Service" ? auswahl.id : "",
                menge: Number(menge),
                einzelpreis: auswahl.preis
            }];
        });
    };

    const speichern = () => {
        const kunde = kunden.find(item => item.id === Number(kundeId));
        if (!kunde || positionenDraft.length === 0) {
            setFehler("Bitte einen Kunden und mindestens eine Position auswählen.");
            return;
        }

        if (sourceInquiryId) {
            kundenanfrageInAuftragUebernehmen(sourceInquiryId, {
                positionen: positionenDraft,
                rabattBetrag: Number(rabattBetrag || 0),
                verguenstigungsGrund: verguenstigungsGrund.trim(),
                gesamtbetrag: Math.max(0, gesamtbetrag(positionenDraft) - Number(rabattBetrag || 0)),
                faelligAm
            });
        } else {
            auftraegeService.add({
                auftragNr: auftragNrDraft,
                kundeId: kunde.id,
                datum: heute,
                status: "offen",
                faelligAm,
                rabattBetrag: Number(rabattBetrag || 0),
                verguenstigungsGrund: verguenstigungsGrund.trim(),
                gesamtbetrag: Math.max(0, gesamtbetrag(positionenDraft) - Number(rabattBetrag || 0)),
                positionen: positionenDraft,
                angebotId: "",
                anfrageId: ""
            });
        }

        setRefreshKey(value => value + 1);
        handleClose();
        setSourceInquiryId("");
    };

    const handleClose = () => {
        setOpen(false);
        setFehler("");
        if (newMode) {
            navigate("/auftraege", { replace: true });
        }
    };

    return <>
        <OverviewCards cards={[
            { label: "Aufträge gesamt", value: auftraege.length },
            { label: "Noch offen", value: offeneAuftraege.length },
            { label: "Auftragspositionen", value: positionen }
        ]}/>
        <DataTable title="Aufträge" selectableColumns={false} data={data.filter(item => !statusFilter || item.status === statusFilter)}
            columns={[
                { field: "auftragNr", title: "Auftragsnummer" },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{row.kunde}</Link> : row.kunde },
                { field: "datum", title: "Datum" },
                { field: "status", title: "Status" },
                { field: "anliegenText", title: "Anliegen" },
                { field: "prozess", title: "Prozess" },
                { field: "positionenText", title: "Positionen" }
            ]}
            focusRowId={searchParams.get("focus") || ""}
            detailLinkResolver={({ field, row }) => {
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                if (field === "angebotId" && row.angebotId) return `/angebote?focus=${row.angebotId}`;
                if (field === "anfrageId" && row.anfrageId) return `/kundenanfragen?focus=${row.anfrageId}`;
                return null;
            }}
            filters={[{ name: "status", label: "Status", options: [{ value: "offen", label: "Offen" }, { value: "abgerechnet", label: "Abgerechnet" }, { value: "bezahlt", label: "Bezahlt" }] }]}
            onFilter={filters => setStatusFilter(filters.status || "")}
            toolbarActions={[{ name: "new", label: "Neuer Auftrag", permission: "verkauf.bearbeiten", onClick: neu }]}
            rowActions={[
                { name: "offerOpen", label: "Angebot öffnen", permission: "verkauf.bearbeiten", onClick: row => row.angebotId && navigate(`/angebote?focus=${row.angebotId}`), variant: "secondary", isVisible: row => !!row.angebotId },
                { name: "inquiryOpen", label: "Anfrage öffnen", permission: "verkauf.bearbeiten", onClick: row => row.anfrageId && navigate(`/kundenanfragen?focus=${row.anfrageId}`), variant: "secondary", isVisible: row => !!row.anfrageId },
                { name: "confirm", label: "Dokumente öffnen", permission: "verkauf.bearbeiten", onClick: row => navigate(`/vertriebsdokumente?auftrag=${row.id}`), variant: "secondary" },
                { name: "ship", label: "Versand starten", permission: "logistik.bearbeiten", onClick: row => navigate(`/versand?new=fromOrder&auftragId=${row.id}`), variant: "secondary", isVisible: row => canStartShipping(row.id, vertriebsdokumente) && !findeVersandZuAuftrag(row.id) },
                { name: "shipOpen", label: "Versand öffnen", permission: "logistik.bearbeiten", onClick: row => {
                    const versand = findeVersandZuAuftrag(row.id);
                    if (versand) navigate(`/versand?focus=${versand.id}`);
                }, variant: "secondary", isVisible: row => !!findeVersandZuAuftrag(row.id) }
            ]}
        />
        <Dialog open={open} title={sourceInquiryId ? "Direkten Auftrag aus Kundenanfrage anlegen" : "Neuen Auftrag anlegen"} onClose={handleClose}>
            {sourceInquiryId && findeAnfrage(sourceInquiryId) && <div className="module-panel">
                <div><Label>Ausgangsanfrage</Label><p>{findeAnfrage(sourceInquiryId)?.anliegen}</p></div>
            </div>}
            <div><Label required>Kunde</Label><LookupField value={kundeId} options={kundenOptionen} onChange={setKundeId} placeholder="Kunde suchen..."/></div>
            <div className="form-row">
                <div><Label>Auftragsnummer</Label><input type="text" value={auftragNrDraft} disabled/></div>
                <div><Label>Fällig am</Label><input type="date" value={faelligAm} onChange={event => setFaelligAm(event.target.value)}/></div>
            </div>
            <div className="form-row bestellposition-hinzufuegen">
                <div><Label>Artikel / Service</Label><LookupField value={leistungId} options={leistungsOptionen} onChange={setLeistungId} placeholder="Artikel oder Service suchen..."/></div>
                <div><Label>Menge</Label><NumberField value={menge} min="1" onChange={wert => setMenge(Number(wert))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufügen</button>
            </div>
            <div className="form-row">
                <Label>Auftragspositionen</Label>
                {positionenDraft.length === 0 ? <p>Noch keine Position vorhanden.</p> : <ul className="positionsliste">
                    {positionenDraft.map(position => <li key={`${position.leistungTyp}-${position.artikelId}`}>{position.artikel}: {position.menge} × {position.einzelpreis.toFixed(2)} EUR
                        <button type="button" className="link-button" onClick={() => setPositionenDraft(items => items.filter(item => !(item.artikelId === position.artikelId && item.leistungTyp === position.leistungTyp)))}>Entfernen</button>
                    </li>)}
                </ul>}
            </div>
            <div className="form-row">
                <div><Label>Vergünstigung</Label><NumberField value={rabattBetrag} min="0" step="0.01" format="currency" onChange={wert => setRabattBetrag(Number(wert || 0))}/></div>
            </div>
            <div className="form-row">
                <div><Label>Grund für Vergünstigung</Label><TextArea rows={2} value={verguenstigungsGrund} onChange={setVerguenstigungsGrund}/></div>
            </div>
            <div className="form-row"><strong>Gesamt: {Math.max(0, gesamtbetrag(positionenDraft) - Number(rabattBetrag || 0)).toFixed(2)} EUR</strong></div>
            {fehler && <p className="form-error">{fehler}</p>}
            <div className="form-row"><button onClick={speichern}>Auftrag speichern</button></div>
        </Dialog>
    </>;
}

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import useAuth from "../../auth/useAuth";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import SaveButton from "../../components/SaveButton";
import TextArea from "../../components/form/TextArea";
import OverviewCards from "../../components/OverviewCards";
import SalesFlowBar from "../../components/SalesFlowBar";
import auftraegeService from "../../services/verkauf/auftraegeService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import kundenService from "../../services/verkauf/customerService";
import artikelService from "../../services/logistik/artikelService";
import servicesService from "../../services/verkauf/servicesService";
import versandService from "../../services/logistik/versandService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import fristenOptionenService from "../../services/verwaltung/fristenOptionenService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import { kundenanfrageInAuftragUebernehmen, naechsteAuftragsnummer } from "../../services/verkauf/verkaufService";
import { getCustomerName } from "../../utils/customerReferences";
import { getBerlinDate, getRelativeBerlinDate } from "../../utils/dateTime";
import { canCreateOutgoingInvoice, canStartShipping, getInquiryForOrder, getSalesStepForOrder, getSalesStepLabel } from "../../utils/processFlow";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";
import { ACCESS, PERMISSIONS } from "../../constants/permissions";

const gesamtbetrag = positionen => positionen.reduce((summe, position) => summe + Number(position.menge) * Number(position.einzelpreis), 0);
const inTagen = tage => getRelativeBerlinDate(tage);
const toLeistung = (item, typ) => ({
    id: item.id,
    leistungTyp: typ,
    nummer: typ === "Service" ? item.serviceNr : item.artikelNr,
    name: item.name,
    preis: Number(item.verkaufspreis || item.preis || 0),
    artikelTyp: typ === "Service" ? "Dienstleistung" : item.artikelTyp
});

function createAuftragspositionDraft(auswahl, menge) {
    return {
        artikelId: auswahl.id,
        artikel: auswahl.name,
        artikelTyp: auswahl.artikelTyp,
        leistungTyp: auswahl.leistungTyp,
        serviceId: auswahl.leistungTyp === "Service" ? auswahl.id : "",
        menge: Number(menge),
        einzelpreis: auswahl.preis
    };
}

function createAuftragDraft(defaultKundeId, defaultLeistungId) {
    const fristen = fristenOptionenService.get();
    return {
        sourceInquiryId: "",
        kundeId: defaultKundeId,
        leistungId: defaultLeistungId,
        menge: 1,
        positionenDraft: [],
        faelligAm: inTagen(fristen.zahlungszielTage),
        rabattBetrag: 0,
        verguenstigungsGrund: "",
        auftragNrDraft: naechsteAuftragsnummer()
    };
}

export default function Auftraege() {
    const today = getBerlinDate();
    const syncTick = useDataSyncRefresh([
        "auftraege", "versandauftraege", "vertriebsdokumente",
        "kundenanfragen", "kunden", "artikel", "services"
    ]);
    const { hasAccess } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [open, setOpen] = useState(false);
    const [fehler, setFehler] = useState("");

    const canReadLogistik = hasAccess(ACCESS.LOGISTIK);
    const auftraege = useMemo(() => auftraegeService.getAll(), [refreshKey, syncTick]);
    const versandauftraege = canReadLogistik ? versandService.list() : [];
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
    const newMode = searchParams.get("new");
    const inquiryIdFromQuery = searchParams.get("anfrageId") || "";
    const kundeIdFromQuery = searchParams.get("kundeId") || "";
    const defaultKundeId = String(kunden[0]?.id || "");
    const defaultLeistungId = leistungen[0] ? `${leistungen[0].leistungTyp}:${leistungen[0].id}` : "";
    const [draft, setDraft] = useState(() => createAuftragDraft(defaultKundeId, defaultLeistungId));

    function resetDraft(overrides = {}) {
        setDraft({
            ...createAuftragDraft(defaultKundeId, defaultLeistungId),
            ...overrides
        });
    }

    useEffect(() => {
        if (newMode !== "fromInquiry") return;
        resetDraft({
            sourceInquiryId: inquiryIdFromQuery,
            kundeId: kundeIdFromQuery || defaultKundeId
        });
        setFehler("");
        setOpen(true);
    }, [newMode, inquiryIdFromQuery, kundeIdFromQuery, defaultKundeId, defaultLeistungId]);

    const findeVersandZuAuftrag = (auftragId) => versandauftraege.find(item => String(item.auftragId) === String(auftragId));
    const kannMietvertragAbschliessen = auftrag => (auftrag.positionen || []).some(position =>
        position.leistungTyp === "Service"
        && position.vertragsEnde
        && String(position.vertragsEnde) <= today
    ) && !["beendet", "abgeschlossen"].includes(String(auftrag.status || "").toLowerCase());
    const mietvertragAbschliessen = auftrag => {
        if (!kannMietvertragAbschliessen(auftrag)) return;
        if (!window.confirm(`Mietvertrag ${auftrag.auftragNr} abschliessen? Die reservierte Baugruppe wird wieder verfuegbar.`)) return;
        auftraegeService.update({ ...auftrag, status: "beendet", abgeschlossenAm: today });
        setRefreshKey(value => value + 1);
    };

    const data = auftraege.map(auftrag => {
        const anfrage = getInquiryForOrder(auftrag, [], anfragen);
        const rechnung = rechnungenService.getByAuftragId(auftrag.id);
        return {
            ...auftrag,
            kunde: getCustomerName(auftrag.kundeId, auftrag.kunde),
            anfrageId: auftrag.anfrageId || anfrage?.id || "",
            anliegenText: anfrage?.anliegen || "-",
            positionenText: (auftrag.positionen || []).map(position => `${position.artikel} (${position.menge})`).join(", "),
            prozess: getSalesStepLabel(getSalesStepForOrder(auftrag, vertriebsdokumente, versandauftraege)),
            rechnungNr: rechnung?.rechnungsnr || "-",
            buchhaltungStatus: rechnung?.lifecycleStatus || "noch nicht fakturiert",
            buchhaltungAktion: rechnung?.nextAction || "Rechnung erzeugen"
        };
    });

    const offeneAuftraege = auftraege.filter(auftrag => auftrag.status === "offen");
    const positionen = auftraege.reduce((summe, auftrag) => summe + (auftrag.positionen || []).length, 0);

    const neu = () => {
        resetDraft();
        setFehler("");
        setOpen(true);
    };

    const positionHinzufuegen = () => {
        const auswahl = leistungen.find(item => `${item.leistungTyp}:${item.id}` === String(draft.leistungId));
        if (!auswahl || Number(draft.menge) <= 0) return;
        setDraft(vorherige => {
            const vorhanden = vorherige.positionenDraft.find(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp);
            if (vorhanden) {
                return {
                    ...vorherige,
                    positionenDraft: vorherige.positionenDraft.map(item => item.artikelId === auswahl.id && item.leistungTyp === auswahl.leistungTyp
                         ? { ...item, menge: Number(item.menge) + Number(draft.menge) }
                        : item)
                };
            }
            return {
                ...vorherige,
                positionenDraft: [...vorherige.positionenDraft, createAuftragspositionDraft(auswahl, draft.menge)]
            };
        });
    };

    const speichern = () => {
        const kunde = kunden.find(item => item.id === Number(draft.kundeId));
        if (!kunde || draft.positionenDraft.length === 0) {
            setFehler("Bitte einen Kunden und mindestens eine Position auswählen.");
            return false;
        }

        if (draft.sourceInquiryId) {
            kundenanfrageInAuftragUebernehmen(draft.sourceInquiryId, {
                positionen: draft.positionenDraft,
                rabattBetrag: Number(draft.rabattBetrag || 0),
                verguenstigungsGrund: draft.verguenstigungsGrund.trim(),
                gesamtbetrag: Math.max(0, gesamtbetrag(draft.positionenDraft) - Number(draft.rabattBetrag || 0)),
                faelligAm: draft.faelligAm
            });
        } else {
            auftraegeService.add({
                auftragNr: draft.auftragNrDraft,
                kundeId: kunde.id,
                datum: today,
                status: "offen",
                faelligAm: draft.faelligAm,
                rabattBetrag: Number(draft.rabattBetrag || 0),
                verguenstigungsGrund: draft.verguenstigungsGrund.trim(),
                gesamtbetrag: Math.max(0, gesamtbetrag(draft.positionenDraft) - Number(draft.rabattBetrag || 0)),
                positionen: draft.positionenDraft,
                angebotId: "",
                anfrageId: ""
            });
        }

        setRefreshKey(value => value + 1);
        resetDraft();
        return true;
    };

    const handleClose = () => {
        setOpen(false);
        setFehler("");
        if (newMode) {
            navigate("/auftraege", { replace: true });
        }
    };

    return <>
        <SalesFlowBar currentStep="auftraege"/>
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
                { field: "status", title: "Status", helpText: "Zeigt, ob der Auftrag noch offen ist oder bereits weiterverarbeitet wurde." },
                { field: "anliegenText", title: "Anliegen", helpText: "Kurzbeschreibung der ursprünglichen Kundenanfrage oder des Auslösers." },
                { field: "prozess", title: "Prozess", helpText: "Zeigt, an welcher Stelle sich der Auftrag im Vertriebs- und Versandablauf befindet." },
                { field: "rechnungNr", title: "Rechnung" },
                { field: "buchhaltungStatus", title: "Buchhaltung" },
                { field: "buchhaltungAktion", title: "Naechster Schritt" },
                { field: "positionenText", title: "Positionen" }
            ]}
            focusRowId={searchParams.get("focus") || ""}
            detailLinkResolver={({ field, row }) => {
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                if (field === "angebotId" && row.angebotId) return `/angebote?focus=${row.angebotId}`;
                if (field === "anfrageId" && row.anfrageId) return `/kundenanfragen?focus=${row.anfrageId}`;
                return null;
            }}
            filters={[{ name: "status", label: "Status", options: [{ value: "offen", label: "Offen" }, { value: "abgerechnet", label: "Abgerechnet" }, { value: "bezahlt", label: "Bezahlt" }, { value: "beendet", label: "Beendet" }] }]}
            onFilter={filters => setStatusFilter(filters.status || "")}
            toolbarActions={[{ name: "new", label: "Neuer Auftrag", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: neu }]}
            rowActions={[
                { name: "thread", label: "Chat", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: row => row.anfrageId && navigate(`/kundenanfragen?focus=${row.anfrageId}`), variant: "secondary", isDisabled: row => !row.anfrageId },
                { name: "confirm", label: "Dokumente", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: row => navigate(`/vertriebsdokumente/auftrag/${row.id}`), variant: "secondary" },
                {
                    name: "invoice",
                    label: "Rechnung erzeugen",
                    permission: PERMISSIONS.RECHNUNG_ANLEGEN,
                    onClick: row => {
                        rechnungenService.createFromAuftrag(row.id);
                        setRefreshKey(value => value + 1);
                    },
                    variant: "success",
                    isVisible: row => row.rechnungNr === "-" && canCreateOutgoingInvoice(row.id, vertriebsdokumente)
                },
                {
                    name: "invoice-open",
                    label: "Zur Rechnung",
                    permission: PERMISSIONS.RECHNUNG_LESEN,
                    onClick: row => row.rechnungNr !== "-" && navigate(`/ausgangsrechnungen?focus=${row.rechnungNr}`),
                    variant: "secondary",
                    isVisible: row => row.rechnungNr !== "-"
                },
                {
                    name: "close-rental",
                    label: "Mietvertrag abschliessen",
                    permission: PERMISSIONS.VERKAUF_BEARBEITEN,
                    onClick: mietvertragAbschliessen,
                    variant: "success",
                    isVisible: kannMietvertragAbschliessen
                }
            ]}
        />
        <Dialog
            open={open}
            title={draft.sourceInquiryId ? "Direktauftrag aus Kundenanfrage anlegen" : "Neuen Auftrag anlegen"}
            onClose={handleClose}
            footer={<SaveButton onSave={speichern} onSuccess={handleClose}>Auftrag speichern</SaveButton>}
        >
            {draft.sourceInquiryId && getInquiryForOrder({ anfrageId: draft.sourceInquiryId }, [], anfragen) && <div className="module-panel">
                <div><Label>Ausgangsanfrage</Label><p>{getInquiryForOrder({ anfrageId: draft.sourceInquiryId }, [], anfragen).anliegen}</p></div>
            </div>}
            <div><Label required>Kunde</Label><LookupField value={draft.kundeId} options={kundenOptionen} onChange={value => setDraft(item => ({ ...item, kundeId: value }))} placeholder="Kunde suchen..."/></div>
            <div className="form-row">
                <div><Label>Auftragsnummer</Label><input name="auftragsnummer" type="text" value={draft.auftragNrDraft} disabled/></div>
                <div><Label>Fällig am</Label><input name="faellig-am" type="date" value={draft.faelligAm} onChange={event => setDraft(item => ({ ...item, faelligAm: event.target.value }))}/></div>
            </div>
            <div className="form-row bestellposition-hinzufuegen">
                <div><Label>Artikel / Service</Label><LookupField value={draft.leistungId} options={leistungsOptionen} onChange={value => setDraft(item => ({ ...item, leistungId: value }))} placeholder="Artikel oder Service suchen..."/></div>
                <div><Label glossaryKey="auftragspositionen">Menge</Label><NumberField value={draft.menge} min="1" onChange={wert => setDraft(item => ({ ...item, menge: Number(wert) }))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufügen</button>
            </div>
            <div className="form-row">
                <Label glossaryKey="auftragspositionen">Auftragspositionen</Label>
                {draft.positionenDraft.length === 0 ? <p>Noch keine Position vorhanden.</p> : <ul className="positionsliste">
                    {draft.positionenDraft.map(position => <li key={`${position.leistungTyp}-${position.artikelId}`}>{position.artikel}: {position.menge} × {position.einzelpreis.toFixed(2)} EUR
                        <button type="button" className="link-button" onClick={() => setDraft(items => ({ ...items, positionenDraft: items.positionenDraft.filter(item => !(item.artikelId === position.artikelId && item.leistungTyp === position.leistungTyp)) }))}>Entfernen</button>
                    </li>)}
                </ul>}
            </div>
            <div className="form-row">
                <div><Label glossaryKey="rabatt">Vergünstigung</Label><NumberField value={draft.rabattBetrag} min="0" step="0.01" format="currency" onChange={wert => setDraft(item => ({ ...item, rabattBetrag: Number(wert || 0) }))}/></div>
            </div>
            <div className="form-row">
                <div><Label glossaryKey="rabatt">Grund für Vergünstigung</Label><TextArea rows={2} value={draft.verguenstigungsGrund} onChange={value => setDraft(item => ({ ...item, verguenstigungsGrund: value }))}/></div>
            </div>
            <div className="form-row"><strong>Gesamt: {Math.max(0, gesamtbetrag(draft.positionenDraft) - Number(draft.rabattBetrag || 0)).toFixed(2)} EUR</strong></div>
            {fehler && <p className="form-error">{fehler}</p>}
        </Dialog>
    </>;
}

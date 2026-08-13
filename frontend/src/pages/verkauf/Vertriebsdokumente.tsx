import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import TextArea from "../../components/form/TextArea";
import SalesFlowBar from "../../components/SalesFlowBar";
import auftraegeService from "../../services/verkauf/auftraegeService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import nachrichtenService, { listNachrichtenZuVorgang } from "../../services/verkauf/nachrichtenService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import angeboteService from "../../services/verkauf/angeboteService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import { openDocumentPdf } from "../../utils/documentPdf";
import { formatTimestampForDisplay, getBerlinDate } from "../../utils/dateTime";
import { getConfirmationDocument, getInquiryForOrder, getOfferForOrder, getOffersForVorgang, getProcessContextForDocument } from "../../utils/processFlow";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getLieferscheinnummer } from "../../services/core/documentNumbering";
import kundenService from "../../services/verkauf/customerService";

const dokumentTypen = ["Auftragsbestaetigung", "Lieferschein", "Warenbegleitpapier", "Transportpapier"];
const AUFTRAGS_FILTER = [
    { value: "alle", label: "Alle Auftraege" },
    { value: "offen", label: "Nur offene Auftraege" },
    { value: "ohne_bestaetigung", label: "Ohne Auftragsbestaetigung" },
    { value: "bestaetigt", label: "Bestaetigung versendet" }
];
const ARBEITSLISTE_TABS = [
    { key: "offen", label: "Alle offen" },
    { key: "bestaetigung_fehlend", label: "Auftragsbestaetigung fehlt" },
    { key: "bestaetigung_versenden", label: "Nicht versendet" },
    { key: "lieferschein", label: "Lieferschein" }
] as const;
const euro = (value) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));

function berechneAuftragswert(positionen = []) {
    return positionen.reduce((sum, item) => sum + Number(item.menge || 0) * Number(item.einzelpreis || 0), 0);
}

function createDokumentTitel(dokumentTyp, auftrag) {
    if (!auftrag) return dokumentTyp;
    if (dokumentTyp === "Lieferschein") {
        return `${dokumentTyp} ${getLieferscheinnummer(auftrag.auftragNr, auftrag.datum)}`;
    }
    return `${dokumentTyp} ${auftrag.auftragNr}`;
}

function createVertriebsdokument(auftragId, today, dokumentTyp = "Auftragsbestaetigung") {
    return {
        auftragId,
        dokumentTyp,
        datum: today,
        notiz: ""
    };
}

function sortOffersByRevisionDescending(a, b) {
    return Number(b.revision || 0) - Number(a.revision || 0);
}

function hatUnvollstaendigeKundenadresse(kunde) {
    if (!kunde) return false;
    return !String(kunde.anschrift || "").trim() || !String(kunde.plz || "").trim() || !String(kunde.ort || "").trim();
}

function getDokumentStatusByTyp(dokumente = [], dokumentTyp) {
    const dokument = dokumente.find(item => item.dokumentTyp === dokumentTyp);
    if (!dokument) return "fehlt";
    return dokument.status === "versendet" ? "versendet" : "erstellt";
}

function getNaechstenDokumentSchritt(auftrag, dokumente = []) {
    const bestaetigung = getDokumentStatusByTyp(dokumente, "Auftragsbestaetigung");
    const lieferschein = getDokumentStatusByTyp(dokumente, "Lieferschein");
    const warenbegleitpapier = getDokumentStatusByTyp(dokumente, "Warenbegleitpapier");
    const transportpapier = getDokumentStatusByTyp(dokumente, "Transportpapier");

    if (bestaetigung === "fehlt") {
        return {
            status: "Aktion noetig",
            schritt: "Auftragsbestaetigung erstellen",
            detail: "Bevor weitere Unterlagen vorbereitet werden, muss zuerst die Auftragsbestaetigung angelegt werden.",
            tone: "warn"
        };
    }
    if (bestaetigung === "erstellt") {
        return {
            status: "Aktion noetig",
            schritt: "Auftragsbestaetigung versenden",
            detail: "Die Auftragsbestaetigung ist vorhanden, wurde aber noch nicht an den Kunden versendet.",
            tone: "warn"
        };
    }
    if (lieferschein === "fehlt") {
        return {
            status: "Vorbereiten",
            schritt: "Lieferschein erstellen",
            detail: "Nach der versendeten Auftragsbestaetigung sollte der Lieferschein vorbereitet werden.",
            tone: "good"
        };
    }
    if (warenbegleitpapier === "fehlt") {
        return {
            status: "Vorbereiten",
            schritt: "Warenbegleitpapier pruefen",
            detail: "Zum Versand fehlt noch das Warenbegleitpapier.",
            tone: "good"
        };
    }
    if (transportpapier === "fehlt") {
        return {
            status: "Optional offen",
            schritt: "Transportpapier ergaenzen",
            detail: "Die Kernunterlagen sind da. Jetzt kann bei Bedarf noch das Transportpapier ergaenzt werden.",
            tone: "good"
        };
    }

    return {
        status: "Komplett",
        schritt: "Dokumentenkette vollstaendig",
        detail: "Fuer diesen Auftrag sind alle Vertriebsdokumente bereits angelegt.",
        tone: "good"
    };
}

export default function Vertriebsdokumente() {
    const today = getBerlinDate();
    const navigate = useNavigate();
    const { auftragId: routeAuftragId } = useParams();
    const auftraege = auftraegeService.list();
    const anfragen = customerInquiryService.list();
    const angebote = angeboteService.getAll();
    const kunden = kundenService.list();
    const rechnungen = rechnungenService.list();
    const initialAuftragId = routeAuftragId || "";
    const [selectedAuftragId, setSelectedAuftragId] = useState(initialAuftragId);
    const [auftragsFilter, setAuftragsFilter] = useState("alle");
    const [dokumente, setDokumente] = useSyncedServiceData(
        ["vertriebsdokumente", "auftraege", "angebote", "kundenanfragen", "nachrichten"],
        () => vertriebsdokumenteService.list()
    );
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState(createVertriebsdokument(initialAuftragId, today));
    const [aktiveArbeitsliste, setAktiveArbeitsliste] = useState<(typeof ARBEITSLISTE_TABS)[number]["key"]>("offen");

    const gefilterteAuftraegeFuerAuswahl = useMemo(
        () => auftraege.filter(item => {
            const bestaetigung = getConfirmationDocument(item.id, dokumente);

            if (auftragsFilter === "offen") {
                return String(item.status || "").toLowerCase() === "offen";
            }
            if (auftragsFilter === "ohne_bestaetigung") {
                return !bestaetigung;
            }
            if (auftragsFilter === "bestaetigt") {
                return bestaetigung?.status === "versendet";
            }
            return true;
        }),
        [auftraege, dokumente, auftragsFilter]
    );

    const selectedAuftrag = auftraege.find(item => String(item.id) === String(selectedAuftragId));
    const selectedAnfrage = selectedAuftrag ? getInquiryForOrder(selectedAuftrag, angebote, anfragen) : null;
    const selectedAngebot = selectedAuftrag ? getOfferForOrder(selectedAuftrag, angebote) : null;
    const vorgangAngebote = useMemo(() => {
        if (!selectedAuftrag) return [];
        const vorgangId = String(selectedAuftrag.vorgangId || selectedAngebot?.vorgangId || selectedAnfrage?.vorgangId || "");
        if (!vorgangId) return selectedAngebot ? [selectedAngebot] : [];
        return getOffersForVorgang(vorgangId, angebote).slice().sort(sortOffersByRevisionDescending);
    }, [angebote, selectedAnfrage, selectedAngebot, selectedAuftrag]);
    const verlaufNachrichten = useMemo(
        () => selectedAuftrag ? listNachrichtenZuVorgang(String(selectedAuftrag.vorgangId || selectedAnfrage?.vorgangId || "")) : [],
        [selectedAnfrage, selectedAuftrag]
    );
    const gefilterteDokumente = useMemo(
        () => dokumente.filter(item => !selectedAuftragId || String(item.auftragId) === String(selectedAuftragId)),
        [dokumente, selectedAuftragId]
    );
    const selectedRechnung = useMemo(
        () => rechnungen.find(item => String(item.auftragId || "") === String(selectedAuftragId) && item.rechnungstyp === "Ausgangsrechnung") || null,
        [rechnungen, selectedAuftragId]
    );
    const selectedKunde = useMemo(
        () => kunden.find(item => String(item.id) === String(selectedAuftrag?.kundeId || "")) || null,
        [kunden, selectedAuftrag]
    );
    const auftragswert = berechneAuftragswert(selectedAuftrag?.positionen || []);
    const arbeitsliste = useMemo(
        () => auftraege.map(auftrag => {
            const auftragDokumente = dokumente.filter(item => String(item.auftragId) === String(auftrag.id));
            const schritt = getNaechstenDokumentSchritt(auftrag, auftragDokumente);
            return {
                id: auftrag.id,
                auftragId: auftrag.id,
                auftragNr: auftrag.auftragNr,
                kunde: auftrag.kunde,
                status: schritt.status,
                naechsterSchritt: schritt.schritt,
                hinweis: schritt.detail,
                dokumente: auftragDokumente.length,
                tone: schritt.tone
            };
        }),
        [auftraege, dokumente]
    );
    const offeneArbeitsliste = useMemo(
        () => arbeitsliste.filter(item => item.status !== "Komplett"),
        [arbeitsliste]
    );
    const sichtbareArbeitsliste = useMemo(
        () => offeneArbeitsliste.filter(item => {
            if (aktiveArbeitsliste === "bestaetigung_fehlend") {
                return item.naechsterSchritt === "Auftragsbestaetigung erstellen";
            }
            if (aktiveArbeitsliste === "bestaetigung_versenden") {
                return item.naechsterSchritt === "Auftragsbestaetigung versenden";
            }
            if (aktiveArbeitsliste === "lieferschein") {
                return item.naechsterSchritt === "Lieferschein erstellen";
            }
            return true;
        }),
        [aktiveArbeitsliste, offeneArbeitsliste]
    );
    const arbeitsTabs = useMemo(
        () => [
            { key: "offen", label: "Alle offen", value: offeneArbeitsliste.length },
            { key: "bestaetigung_fehlend", label: "Auftragsbestaetigung fehlt", value: offeneArbeitsliste.filter(item => item.naechsterSchritt === "Auftragsbestaetigung erstellen").length },
            { key: "bestaetigung_versenden", label: "Nicht versendet", value: offeneArbeitsliste.filter(item => item.naechsterSchritt === "Auftragsbestaetigung versenden").length },
            { key: "lieferschein", label: "Lieferschein", value: offeneArbeitsliste.filter(item => item.naechsterSchritt === "Lieferschein erstellen").length }
        ] as const,
        [offeneArbeitsliste]
    );
    const selectedArbeitsstatus = selectedAuftrag
        ? getNaechstenDokumentSchritt(selectedAuftrag, gefilterteDokumente)
        : null;
    const vorgangsverbindungen = useMemo(() => {
        if (!selectedAuftrag) return [];
        const dokumentReihenfolge = ["Auftragsbestaetigung", "Lieferschein", "Warenbegleitpapier", "Transportpapier"];
        const dokumentEintraege = dokumentReihenfolge.map(typ => {
            const dokument = gefilterteDokumente.find(item => item.dokumentTyp === typ);
            return {
                id: `dokument-${typ}`,
                bereich: "Dokument",
                element: typ,
                stand: dokument ? (dokument.status || "erstellt") : "fehlt",
                detail: dokument ? (dokument.versendetAm ? `Versendet am ${dokument.versendetAm}` : dokument.datum || "-") : "Noch nicht angelegt",
                inhalt: dokument?.notiz || "Kein zusaetzlicher Hinweis hinterlegt.",
                sourceType: "dokument",
                source: dokument || null
            };
        });

        return [
            {
                id: "anfrage",
                bereich: "Ausgang",
                element: "Kundenanfrage",
                stand: selectedAnfrage?.status || "nicht verknuepft",
                detail: selectedAnfrage?.anliegen || "Keine direkte Anfrage verknuepft",
                inhalt: selectedAnfrage?.nachricht || selectedAnfrage?.anliegen || "Keine weitere Beschreibung hinterlegt.",
                sourceType: "anfrage"
            },
            {
                id: "chat",
                bereich: "Kommunikation",
                element: "Chatverlauf",
                stand: `${verlaufNachrichten.length} Nachricht(en)`,
                detail: verlaufNachrichten.length > 0 ? String(verlaufNachrichten[verlaufNachrichten.length - 1]?.betreff || "Letzte Nachricht vorhanden") : "Noch kein Verlauf hinterlegt",
                inhalt: verlaufNachrichten.length > 0
                    ? verlaufNachrichten.slice(-3).reverse().map(item => `${item.senderRolle || "Nachricht"}: ${item.nachricht || item.betreff || ""}`).join("\n")
                    : "Noch kein Verlauf hinterlegt",
                sourceType: "chat"
            },
            {
                id: "angebot",
                bereich: "Vertrieb",
                element: "Angebot",
                stand: vorgangAngebote.length > 0 ? `${vorgangAngebote.length} Stand/Staende` : "nicht vorhanden",
                detail: vorgangAngebote.length > 0 ? vorgangAngebote.map(item => item.angebotsNr).join(", ") : "Kein Angebot verknuepft",
                inhalt: vorgangAngebote.length > 0
                    ? vorgangAngebote.map(item => `${item.angebotsNr} | ${item.status || "-"} | ${item.datum || "-"}`).join("\n")
                    : "Noch kein Angebot vorhanden",
                sourceType: "angebot",
                source: vorgangAngebote[0] || null
            },
            ...dokumentEintraege,
            {
                id: "rechnung",
                bereich: "Buchhaltung",
                element: "Rechnung",
                stand: selectedRechnung?.status || "nicht erstellt",
                detail: selectedRechnung?.rechnungsnr || "Noch keine Rechnung vorhanden",
                inhalt: selectedRechnung?.notiz || selectedRechnung?.leistungsbeschreibung || "Noch keine Rechnung vorhanden",
                sourceType: "rechnung"
            }
        ];
    }, [gefilterteDokumente, selectedAnfrage, selectedAuftrag, selectedRechnung, verlaufNachrichten, vorgangAngebote]);
    const resetCurrentDocument = (auftragId = selectedAuftragId || String(auftraege[0]?.id || ""), dokumentTyp = "Auftragsbestaetigung") => {
        setCurrent(createVertriebsdokument(auftragId, today, dokumentTyp));
    };

    const refreshDokumente = () => {
        setDokumente(vertriebsdokumenteService.list());
    };

    const auftragAuswaehlen = (value) => {
        setSelectedAuftragId(value);
        navigate(`/vertriebsdokumente/auftrag/${value}`);
    };

    const neu = () => {
        const vorbelegterAuftragId = selectedAuftragId || String(sichtbareArbeitsliste[0]?.auftragId || auftraege[0]?.id || "");
        const bestaetigung = getConfirmationDocument(vorbelegterAuftragId, dokumente);
        resetCurrentDocument(vorbelegterAuftragId, bestaetigung ? "Lieferschein" : "Auftragsbestaetigung");
        setOpen(true);
    };

    const createDokumentPayload = () => {
        const auftrag = auftraege.find(item => String(item.id) === String(current.auftragId));
        if (!auftrag) return null;
        const vorhandeneBestaetigung = getConfirmationDocument(auftrag.id, dokumente);
        if (current.dokumentTyp === "Auftragsbestaetigung" && vorhandeneBestaetigung) {
            alert("Fuer diesen Auftrag wurde die Auftragsbestaetigung bereits erstellt.");
            return null;
        }
        if (current.dokumentTyp !== "Auftragsbestaetigung" && !vorhandeneBestaetigung) {
            alert("Bitte zuerst die Auftragsbestaetigung erstellen.");
            return null;
        }

        const titel = createDokumentTitel(current.dokumentTyp, auftrag);
        return {
            ...current,
            auftragId: Number(current.auftragId),
            dokumentNr: current.dokumentTyp === "Lieferschein" ? getLieferscheinnummer(auftrag.auftragNr, auftrag.datum) : (current.dokumentNr || ""),
            titel,
            versendetAm: current.versendetAm || "",
            status: current.status || "erstellt",
            notiz: current.notiz.trim()
        };
    };

    const speichern = () => {
        const payload = createDokumentPayload();
        if (!payload) return;

        vertriebsdokumenteService.create(payload);
        refreshDokumente();
        setOpen(false);
        resetCurrentDocument();
    };

    const loeschen = (dokument) => {
        vertriebsdokumenteService.remove(dokument.id);
        refreshDokumente();
    };

    const alsPdf = (dokument) => {
        const auftrag = auftraege.find(item => String(item.id) === String(dokument.auftragId));
        openDocumentPdf({
            title: dokument.titel || createDokumentTitel(dokument.dokumentTyp, { auftragNr: dokument.auftragNr }),
            subject: "Automatisch erzeugtes Vertriebsdokument fuer den Schulungseinsatz.",
            date: dokument.datum,
            note: dokument.notiz,
            referenceLabel: "Auftrag",
            referenceValue: dokument.auftragNr,
            partnerLabel: "Kunde",
            partnerValue: dokument.kunde,
            positions: auftrag?.positionen || dokument.positionen || [],
            preispositionen: auftrag?.preispositionen || dokument.preispositionen || [],
            deductionAmount: auftrag?.rabattBetrag || 0,
            deductionReason: auftrag?.verguenstigungsGrund || ""
        });
    };

    const angebotHistorieAlsPdf = () => {
        if (!vorgangAngebote.length) return;
        const neuestesAngebot = vorgangAngebote[0];
        openDocumentPdf({
            title: `Angebot ${neuestesAngebot.angebotsNr}`,
            subject: "Alle Angebotsstaende zu diesem Auftrag als PDF-Uebersicht.",
            date: neuestesAngebot.datum || today,
            note: "Die erste Seite zeigt den neuesten Stand. Danach folgen aeltere Versionen.",
            referenceLabel: "Angebot",
            referenceValue: neuestesAngebot.angebotsNr,
            partnerLabel: "Kunde",
            partnerValue: neuestesAngebot.kunde || selectedAuftrag?.kunde || "-",
            positions: neuestesAngebot.positionen || [],
            preispositionen: neuestesAngebot.preispositionen || [],
            deductionAmount: neuestesAngebot.rabattBetrag || 0,
            deductionReason: neuestesAngebot.verguenstigungsGrund || "",
            appendixPages: vorgangAngebote.slice(1).map(angebot => ({
                title: `Angebot ${angebot.angebotsNr}`,
                subject: "Frueherer Angebotsstand aus demselben Vorgang.",
                date: angebot.datum || today,
                note: angebot.verguenstigungsGrund || angebot.status || "Kein zusaetzlicher Hinweis hinterlegt.",
                referenceLabel: "Angebot",
                referenceValue: angebot.angebotsNr,
                partnerLabel: "Kunde",
                partnerValue: angebot.kunde || selectedAuftrag?.kunde || "-",
                positions: angebot.positionen || [],
                preispositionen: angebot.preispositionen || [],
                deductionAmount: angebot.rabattBetrag || 0,
                deductionReason: angebot.verguenstigungsGrund || ""
            }))
        });
    };

    const chatverlaufAlsPdf = () => {
        if (!selectedAuftrag) return;
        openDocumentPdf({
            title: `Chatverlauf ${selectedAuftrag.auftragNr}`,
            subject: "Chronologischer Nachrichtenverlauf zu diesem Auftrag.",
            date: today,
            note: "Die Seite zeigt alle Nachrichten aus dem verbundenen Vorgang.",
            referenceLabel: "Auftrag",
            referenceValue: selectedAuftrag.auftragNr,
            partnerLabel: "Kunde",
            partnerValue: selectedAuftrag.kunde || "-",
            positions: selectedAuftrag.positionen || [],
            preispositionen: [],
            appendixPages: [{
                pageType: "history",
                title: "Nachrichtenverlauf",
                subject: "Kompletter Chatverlauf zum Auftrag und den verbundenen Vorgangsdokumenten.",
                date: today,
                note: "Chronologisch sortiert fuer die Einsicht auf einer Seite.",
                referenceValue: selectedAuftrag.vorgangId || selectedAnfrage?.vorgangId || selectedAuftrag.auftragNr,
                partnerLabel: "Kunde",
                partnerValue: selectedAuftrag.kunde || "-",
                historyEntries: verlaufNachrichten.map((entry) => ({
                    date: formatTimestampForDisplay(entry.zeitpunkt || entry.datum),
                    label: `${entry.senderRolle || "Nachricht"}: ${entry.betreff || "-"}`,
                    text: entry.nachricht || ""
                }))
            }]
        });
    };

    const versenden = (dokument) => {
        vertriebsdokumenteService.update(dokument.id, {
            ...dokument,
            status: "versendet",
            versendetAm: today
        });

        if (dokument.dokumentTyp === "Auftragsbestaetigung") {
            const { auftrag, angebot, anfrage, vorgangId } = getProcessContextForDocument(dokument, auftraege, angebote, anfragen);

            if (vorgangId) {
                nachrichtenService.create({
                    vorgangId,
                    anfrageId: anfrage?.id || "",
                    angebotId: angebot?.id || auftrag?.angebotId || "",
                    auftragId: auftrag?.id || "",
                    dokumentId: dokument.id,
                    kundeId: auftrag?.kundeId || "",
                    datum: today,
                    senderRolle: "Verkauf",
                    senderName: "Schuelerfirma Verkauf",
                    kanal: "E-Mail",
                    betreff: dokument.titel || `Auftragsbestaetigung ${auftrag?.auftragNr || ""}`.trim(),
                    nachricht: `Die Auftragsbestaetigung ${dokument.titel || ""} wurde an den Kunden versendet.`,
                    typ: "Auftragsbestaetigung"
                });
            }
        }

        refreshDokumente();
    };

    const speichernUndVersenden = () => {
        const payload = createDokumentPayload();
        if (!payload) return;

        const createdDokument = vertriebsdokumenteService.create(payload);
        versenden(createdDokument);
        setOpen(false);
        resetCurrentDocument();
    };

    const arbeitslistenTitel = aktiveArbeitsliste === "offen"
        ? "Offene Aufgaben je Auftrag"
        : aktiveArbeitsliste === "bestaetigung_fehlend"
            ? "Auftraege ohne Auftragsbestaetigung"
            : aktiveArbeitsliste === "bestaetigung_versenden"
                ? "Erstellte, aber nicht versendete Auftragsbestaetigungen"
                : "Auftraege mit naechstem Schritt Lieferschein";

    return <>
        {!selectedAuftrag && <SalesFlowBar currentStep="auftragsbestaetigung"/>}
        <h1>Vertriebsdokumente</h1>
        {selectedAuftrag ? <>
            <p>Hier findest du alle Vertriebsdokumente zu einem Auftrag gesammelt.</p>
            <section className="module-panel">
                <div className="personalakte-toolbar">
                    <div className="personalakte-links">
                        <Link className="button-link" to="/vertriebsdokumente">Zur Aufgabenliste</Link>
                    </div>
                </div>
                <div className="personalakte-summary">
                    <div><span>Auftrag</span><strong>{selectedAuftrag.auftragNr}</strong></div>
                    <div><span>Kunde</span><strong>{selectedAuftrag.kunde}</strong></div>
                    <div><span>Status</span><strong>{selectedAuftrag.status}</strong></div>
                    <div><span>Auftragswert</span><strong>{euro(auftragswert)}</strong></div>
                </div>
                {hatUnvollstaendigeKundenadresse(selectedKunde) && <p className="form-error">
                    Beim Kunden fehlen Adressdaten. Bitte vor Angebot, Auftragsbestaetigung oder Lieferschein Anschrift, PLZ und Ort pruefen und beim Kunden nachfragen.
                </p>}
            </section>

            <DataTable
            title={`Verbindungen zu ${selectedAuftrag.auftragNr}`}
            selectableColumns={false}
            data={vorgangsverbindungen}
            columns={[
                { field: "bereich", title: "Bereich" },
                { field: "element", title: "Element" },
                { field: "stand", title: "Stand" },
                { field: "detail", title: "Detail" }
            ]}
            rowActions={[
                { name: "pdf-chat", label: "Chat-PDF", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: () => chatverlaufAlsPdf(), variant: "secondary", isVisible: row => row.sourceType === "chat" && verlaufNachrichten.length > 0 },
                { name: "pdf-angebot", label: "Angebots-PDF", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: () => angebotHistorieAlsPdf(), variant: "secondary", isVisible: row => row.sourceType === "angebot" && vorgangAngebote.length > 0 },
                { name: "pdf-dokument", label: "PDF", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: row => row.source && alsPdf(row.source), variant: "secondary", isVisible: row => row.sourceType === "dokument" && !!row.source }
            ]}
            showDetails={false}
            />

            <DataTable
            title={`Dokumente zu ${selectedAuftrag.auftragNr}`}
            selectableColumns={false}
            data={gefilterteDokumente}
            columns={[
                { field: "dokumentTyp", title: "Dokumenttyp" },
                { field: "status", title: "Stand" },
                { field: "datum", title: "Datum" },
                { field: "versendetAm", title: "Versendet am", render: row => row.versendetAm || "-" }
            ]}
            toolbarActions={[{ name: "new", label: "Dokument erstellen", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "pdf", label: "PDF", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: alsPdf, variant: "secondary" },
                { name: "send", label: "Versenden", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: versenden, variant: "secondary", isVisible: row => !["versendet", "entgegengenommen"].includes(String(row.status || "").toLowerCase()) },
                { name: "delete", label: "Loeschen", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: loeschen, variant: "danger" }
            ]}
            />
        </> : <>
            <p>Hier sehen Schueler, welches Vertriebsdokument als Naechstes noetig ist.</p>

            <div className="kennzahlen" role="tablist" aria-label="Offene Dokumentaufgaben">
                {arbeitsTabs.map(tab => <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={aktiveArbeitsliste === tab.key}
                    className={`kennzahl kennzahl-button${aktiveArbeitsliste === tab.key ? " is-active" : ""}`}
                    onClick={() => setAktiveArbeitsliste(tab.key)}
                >
                    <span>{tab.label}</span>
                    <strong>{tab.value}</strong>
                </button>)}
            </div>

            <DataTable
                title={arbeitslistenTitel}
                selectableColumns={false}
                data={sichtbareArbeitsliste}
                columns={[
                    { field: "auftragNr", title: "Auftrag", render: row => <Link className="detail-link" to={`/vertriebsdokumente/auftrag/${row.auftragId}`}>{row.auftragNr}</Link> },
                    { field: "kunde", title: "Kunde" },
                    { field: "naechsterSchritt", title: "Naechster Schritt" },
                    { field: "dokumente", title: "Dokumente" }
                ]}
                rowActions={[
                    { name: "new", label: "Dokument anlegen", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: row => {
                        auftragAuswaehlen(String(row.auftragId));
                        const bestehendeDokumente = dokumente.filter(item => String(item.auftragId) === String(row.auftragId));
                        const bestaetigung = getConfirmationDocument(row.auftragId, bestehendeDokumente);
                        resetCurrentDocument(String(row.auftragId), bestaetigung ? "Lieferschein" : "Auftragsbestaetigung");
                        setOpen(true);
                    }, variant: "success" }
                ]}
                detailLinkResolver={({ field, row }) => field === "auftragNr" ? `/vertriebsdokumente/auftrag/${row.auftragId}` : null}
            />
        </>}

        <Dialog open={open} title="Vertriebsdokument erstellen" onClose={() => setOpen(false)}>
            <div><Label>Auftrag</Label><input type="text" value={auftraege.find(item => String(item.id) === String(current.auftragId))?.auftragNr || "-"} disabled/></div>
            <div><Label>Dokumenttyp</Label><select value={current.dokumentTyp} onChange={event => setCurrent(item => ({ ...item, dokumentTyp: event.target.value }))}>
                {(getConfirmationDocument(current.auftragId, dokumente) ? dokumentTypen : ["Auftragsbestaetigung"]).map(item => <option key={item} value={item}>{item}</option>)}
            </select></div>
            <div><Label>Datum</Label><input type="date" value={current.datum} onChange={event => setCurrent(item => ({ ...item, datum: event.target.value }))}/></div>
            <div className="form-row"><Label>Hinweis</Label><TextArea rows={3} value={current.notiz} onChange={value => setCurrent(item => ({ ...item, notiz: value }))}/></div>
            <div className="form-row">
                <button type="button" onClick={speichern}>Speichern</button>
                <button type="button" onClick={speichernUndVersenden}>Direkt versenden</button>
            </div>
        </Dialog>
    </>;
}

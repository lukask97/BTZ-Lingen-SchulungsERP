import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import ChatDialogBoundary from "../../components/ChatDialogBoundary";
import ThreadChatDialog from "../../components/ThreadChatDialog";
import Label from "../../components/form/Label";
import SalesFlowBar from "../../components/SalesFlowBar";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import nachrichtenService, { listNachrichtenZuVorgang } from "../../services/verkauf/nachrichtenService";
import angeboteService from "../../services/verkauf/angeboteService";
import { subscribeToDataSync } from "../../services/seed/dataSync";
import auftraegeService from "../../services/verkauf/auftraegeService";
import { naechsteAuftragsnummer } from "../../services/verkauf/verkaufService";
import { addDaysToIsoDate, getBerlinDate, getBerlinTimestamp } from "../../utils/dateTime";
import { getCustomerName } from "../../utils/customerReferences";
import { openDocumentPdf } from "../../utils/documentPdf";
import useAuth from "../../auth/useAuth";
import { ACCESS, PERMISSIONS } from "../../constants/permissions";
import { getOffersForVorgang, getOrderForOffer, getVorgangId } from "../../utils/processFlow";
import { getUserDisplayNameWithRole } from "../../utils/userDisplay";

function sortByRevisionAscending(a: any, b: any) {
    return Number(a.revision || 0) - Number(b.revision || 0);
}

function getThreadMessages(threadItem: any, fallbackDate: string) {
    if (!threadItem) return [];
    const vorgangId = getVorgangId(threadItem);
    const nachrichten = listNachrichtenZuVorgang(vorgangId);
    const hatVerkaufAntwort = nachrichten.some(item => item.senderRolle === "Verkauf");

    if (!hatVerkaufAntwort && threadItem.antwort) {
        return [...nachrichten, {
            id: `synthetic-verkauf-${threadItem.id || vorgangId}`,
            datum: threadItem.beantwortetAm || threadItem.datum || fallbackDate,
            zeitpunkt: `${threadItem.beantwortetAm || threadItem.datum || fallbackDate}T12:00:00`,
            senderRolle: "Verkauf",
            senderName: "Schuelerfirma Verkauf",
            betreff: "Antwort der Schuelerfirma",
            nachricht: threadItem.antwort
        }].sort((a, b) => String(a.zeitpunkt || a.datum).localeCompare(String(b.zeitpunkt || b.datum)));
    }

    return nachrichten;
}

export default function Kundenanfragen() {
    const today = getBerlinDate();
    const navigate = useNavigate();
    const { user, hasAccess } = useAuth();
    const canReadCustomers = hasAccess(ACCESS.KUNDE);
    const [searchParams] = useSearchParams();
    const focusId = searchParams.get("focus") || "";
    const [anfragen, setAnfragen] = useState(customerInquiryService.list());
    const [activeTab, setActiveTab] = useState("offen");
    const [threadOpen, setThreadOpen] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [wiedervorlageTage, setWiedervorlageTage] = useState(7);
    const [threadItem, setThreadItem] = useState<any>(null);
    const [selectedOfferId, setSelectedOfferId] = useState<string>("");
    const angebote = angeboteService.getAll();
    const auftraege = auftraegeService.getAll();
    const verkaufAbsenderName = getUserDisplayNameWithRole(user, String(user.username || "Schuelerfirma Verkauf"));

    const refreshInquiryState = () => {
        setAnfragen(customerInquiryService.list());
    };

    const angeboteZuVorgang = (vorgangId: string) => getOffersForVorgang(vorgangId, angebote).sort(sortByRevisionAscending);

    const vorgangOeffnen = (item) => {
        setThreadItem(item);
        setReplyText("");
        setWiedervorlageTage(7);
        setThreadOpen(true);
    };

    const getSelectedOffer = (angeboteImVorgang = []) => {
        if (angeboteImVorgang.length === 0) return null;
        return angeboteImVorgang.find(item => String(item.id) === String(selectedOfferId)) || angeboteImVorgang[angeboteImVorgang.length - 1] || null;
    };

    const angebotWurdeBereitsGesendet = (angebot) => {
        if (!angebot || !threadItem?.vorgangId) return false;
        return listNachrichtenZuVorgang(threadItem.vorgangId).some(item =>
            String(item.angebotId || "") === String(angebot.id) && item.typ === "Angebot"
        );
    };

    const angebotAlsPdf = (angebot) => {
        if (!angebot) return;
        openDocumentPdf({
            title: `Angebot ${angebot.angebotsNr}`,
            subject: "Automatisch erzeugtes Angebotsdokument fuer den Schulungseinsatz.",
            date: angebot.datum,
            note: angebot.verguenstigungsGrund || "Kein zusaetzlicher Hinweis hinterlegt.",
            referenceLabel: "Angebot",
            referenceValue: angebot.angebotsNr,
            partnerLabel: "Kunde",
            partnerValue: getCustomerName(angebot.kundeId, angebot.kunde),
            positions: angebot.positionen || [],
            preispositionen: angebot.preispositionen || [],
            deductionAmount: angebot.rabattBetrag || 0,
            deductionReason: angebot.verguenstigungsGrund || ""
        });
    };

    const angebotSenden = () => {
        if (!threadItem?.vorgangId) return;
        const angebot = getSelectedOffer(angeboteZuVorgang(threadItem.vorgangId));
        if (!threadItem || !angebot || angebotWurdeBereitsGesendet(angebot)) return;

        const text = `Wir senden Ihnen das Angebot ${angebot.angebotsNr} zur Pruefung zu.`;
        const aktualisierteAnfrage = {
            ...threadItem,
            status: "beantwortet",
            angebotId: angebot.id,
            antwort: text,
            beantwortetAm: today
        };

        customerInquiryService.update(aktualisierteAnfrage);
        nachrichtenService.create({
            vorgangId: getVorgangId(threadItem),
            anfrageId: threadItem.id,
            angebotId: angebot.id,
            kundeId: threadItem.kundeId || angebot.kundeId || "",
            datum: today,
            zeitpunkt: getBerlinTimestamp(),
            senderRolle: "Verkauf",
            senderName: verkaufAbsenderName,
            kanal: threadItem.kanal || "E-Mail",
            betreff: `Angebot ${angebot.angebotsNr}`,
            nachricht: text,
            typ: "Angebot"
        });

        refreshInquiryState();
        setThreadItem(aktualisierteAnfrage);
    };

    const dokumentiereAngebotsentscheidung = (angebot, betreff: string, nachricht: string, extra: Record<string, any> = {}) => {
        if (!threadItem || !angebot) return;
        nachrichtenService.create({
            vorgangId: getVorgangId(threadItem),
            anfrageId: threadItem.id,
            angebotId: angebot.id,
            kundeId: threadItem.kundeId || angebot.kundeId || "",
            auftragId: threadItem.auftragId || "",
            datum: today,
            zeitpunkt: getBerlinTimestamp(),
            senderRolle: "Verkauf",
            senderName: verkaufAbsenderName,
            kanal: "Intern",
            betreff,
            nachricht,
            typ: "Interne Notiz",
            ...extra
        });
    };

    const aktualisiereAngebotsstatus = (angebot, status) => {
        if (!threadItem) return;
        const vorgangAngebote = angeboteZuVorgang(angebot.vorgangId);
        let neuerAuftragId = threadItem.auftragId || "";

        if (status === "angenommen") {
            const bestehenderAuftrag = getOrderForOffer(angebot.id, auftraegeService.list());
            if (bestehenderAuftrag) {
                neuerAuftragId = bestehenderAuftrag.id;
            } else {
                const auftrag = auftraegeService.add({
                    auftragNr: naechsteAuftragsnummer(),
                    kundeId: angebot.kundeId,
                    datum: today,
                    status: "offen",
                    positionen: angebot.positionen || [],
                    rabattBetrag: Number(angebot.rabattBetrag || 0),
                    verguenstigungsGrund: angebot.verguenstigungsGrund || "",
                    gesamtbetrag: Number(angebot.gesamtbetrag || 0),
                    angebotId: angebot.id
                });
                neuerAuftragId = auftrag.id;
            }
        }

        vorgangAngebote.forEach(item => {
            let nextStatus = item.status;
            if (String(item.id) === String(angebot.id)) {
                nextStatus = status;
            } else if (status === "angenommen" && item.status !== "abgelehnt") {
                nextStatus = "beendet";
            }
            if (nextStatus !== item.status) {
                angeboteService.update({ ...item, status: nextStatus });
            }
        });

        const aktualisierteAnfrage = {
            ...threadItem,
            angebotId: angebot.id,
            auftragId: status === "angenommen" ? neuerAuftragId : (threadItem.auftragId || ""),
            status: status === "angenommen" ? "erledigt" : threadItem.status
        };

        if (status === "angenommen") {
            dokumentiereAngebotsentscheidung(
                angebot,
                `Angebot ${angebot.angebotsNr} intern als angenommen vermerkt`,
                `Die Angebotsentscheidung wurde intern dokumentiert: ${angebot.angebotsNr} wurde als angenommen markiert.${neuerAuftragId ? ` Auftrag ${neuerAuftragId} wurde zugeordnet.` : ""}`,
                { auftragId: neuerAuftragId || "" }
            );
        } else if (status === "abgelehnt") {
            dokumentiereAngebotsentscheidung(
                angebot,
                `Angebot ${angebot.angebotsNr} intern als abgelehnt vermerkt`,
                `Die Angebotsentscheidung wurde intern dokumentiert: ${angebot.angebotsNr} wurde als abgelehnt markiert.`
            );
        } else if (status === "beendet") {
            dokumentiereAngebotsentscheidung(
                angebot,
                `Angebot ${angebot.angebotsNr} intern als beendet vermerkt`,
                `Die Angebotsentscheidung wurde intern dokumentiert: ${angebot.angebotsNr} wurde als beendet markiert.`
            );
        }

        customerInquiryService.update(aktualisierteAnfrage);
        refreshInquiryState();
        setThreadItem(aktualisierteAnfrage);
    };

    const angebotAufWiedervorlageSetzen = (angebot) => {
        if (!threadItem || !angebot) return;
        const tage = Math.max(1, Number(wiedervorlageTage || 0));
        const pruefdatum = addDaysToIsoDate(today, tage);
        const aktualisiertesAngebot = {
            ...angebot,
            status: "Wiedervorlage",
            freigabeStatus: "angefragt",
            direktSendenGewuenscht: false,
            freigabeNotiz: `Kunde bittet um Wiedervorlage am ${pruefdatum}.`,
            wiedervorlageTage: tage,
            wiedervorlageAm: pruefdatum
        };
        angeboteService.update(aktualisiertesAngebot);

        const aktualisierteAnfrage = {
            ...threadItem,
            angebotId: angebot.id,
            status: "beantwortet",
            wiedervorlageAngebotId: angebot.id,
            wiedervorlageAm: pruefdatum,
            beantwortetAm: today
        };

        dokumentiereAngebotsentscheidung(
            angebot,
            `Angebot ${angebot.angebotsNr} intern auf Wiedervorlage gesetzt`,
            `Die Angebotsentscheidung wurde intern dokumentiert: ${angebot.angebotsNr} wurde auf Wiedervorlage zum ${pruefdatum} gesetzt.`,
            { wiedervorlageAm: pruefdatum }
        );

        customerInquiryService.update(aktualisierteAnfrage);
        refreshInquiryState();
        setThreadItem(aktualisierteAnfrage);
    };

    const antwortSpeichern = () => {
        if (!threadItem || !replyText.trim()) return;
        const vorgangId = getVorgangId(threadItem);
        const aktualisierteAnfrage = {
            ...threadItem,
            status: "beantwortet",
            antwort: replyText.trim(),
            beantwortetAm: today
        };

        customerInquiryService.update(aktualisierteAnfrage);
        nachrichtenService.create({
            vorgangId,
            anfrageId: threadItem.id,
            angebotId: threadItem.angebotId || "",
            kundeId: threadItem.kundeId || "",
            auftragId: threadItem.auftragId || "",
            datum: today,
            zeitpunkt: getBerlinTimestamp(),
            senderRolle: "Verkauf",
            senderName: verkaufAbsenderName,
            kanal: threadItem.kanal || "E-Mail",
            betreff: "Antwort der Schuelerfirma",
            nachricht: replyText.trim(),
            typ: "Antwort"
        });

        refreshInquiryState();
        setThreadItem(aktualisierteAnfrage);
        setReplyText("");
    };

    const offene = anfragen.filter(item => item.status === "offen").length;
    const wartetAufRueckmeldung = anfragen.filter(item => item.status === "beantwortet").length;
    const threadVorgangId = String(threadItem?.vorgangId || "");
    const istLaufenderAuftrag = (auftragId) => {
        if (!auftragId) return false;
        const auftrag = auftraege.find(item => String(item.id) === String(auftragId));
        if (!auftrag) return false;
        return !["abgerechnet", "bezahlt", "storniert", "beendet", "abgeschlossen"].includes(String(auftrag.status || "").toLowerCase());
    };
    const laufendeAuftraege = anfragen.filter(item => istLaufenderAuftrag(item.auftragId)).length;
    const vorgangAngebote = useMemo(
        () => threadVorgangId ? angeboteZuVorgang(threadVorgangId) : [],
        [threadVorgangId, angebote]
    );
    const dashboardTabs = useMemo(() => ([
        { key: "offen", label: "Offene Anfragen", value: offene },
        { key: "rueckmeldung", label: "Warte auf Rueckmeldung", value: wartetAufRueckmeldung },
        {
            key: "auftraege",
            label: "Laufende Auftraege",
            value: laufendeAuftraege
        },
        { key: "alle", label: "Alle", value: anfragen.length }
    ]), [anfragen.length, laufendeAuftraege, offene, wartetAufRueckmeldung]);
    const sichtbareAnfragen = useMemo(() => {
        if (activeTab === "offen") {
            return anfragen.filter(item => item.status === "offen");
        }

        if (activeTab === "rueckmeldung") {
            return anfragen.filter(item => item.status === "beantwortet");
        }

        if (activeTab === "auftraege") {
            return anfragen.filter(item => istLaufenderAuftrag(item.auftragId));
        }

        return anfragen;
    }, [activeTab, anfragen]);
    const aktuellesAngebot = vorgangAngebote[vorgangAngebote.length - 1];
    const ausgewaehltesAngebot = getSelectedOffer(vorgangAngebote);
    const ausgewaehltesAngebotLabel = ausgewaehltesAngebot?.angebotsNr || "kein Angebot ausgewaehlt";
    const kannAngebotErstellen = !!threadItem?.kundeId && (vorgangAngebote.length === 0 || aktuellesAngebot?.status === "abgelehnt");
    const kannAngebotSenden = !!aktuellesAngebot && !angebotWurdeBereitsGesendet(aktuellesAngebot);
    const angebotIstInternVorbereitet = String(aktuellesAngebot?.status || "").toLowerCase() === "in vorbereitung";
    const threadActionLinks = [
        ...(kannAngebotErstellen ? [{
            id: "prepare-offer",
            label: aktuellesAngebot?.status === "abgelehnt" ? "Neues Angebot vorbereiten" : "Angebot erstellen",
            onClick: () => navigate(`/angebote?new=fromInquiry&kundeId=${threadItem?.kundeId || ""}&anfrageId=${threadItem?.id || ""}`)
        }] : []),
        ...(kannAngebotSenden ? [{
            id: "send-offer",
            label: angebotIstInternVorbereitet ? "Angebot pruefen" : "Angebot senden",
            onClick: angebotIstInternVorbereitet
                ? () => navigate(`/angebote?approveOfferId=${aktuellesAngebot?.id || ""}`)
                : angebotSenden
        }] : [])
    ];

    useEffect(() => subscribeToDataSync(["kundenanfragen", "nachrichten", "angebote", "auftraege", "kunden"], () => {
        refreshInquiryState();
        if (threadItem?.id) {
            const aktuelleAnfrage = customerInquiryService.list().find(item => String(item.id) === String(threadItem.id));
            if (aktuelleAnfrage) setThreadItem(aktuelleAnfrage);
        }
    }), [threadItem]);

    useEffect(() => {
        if (!focusId) return;
        const anfrage = customerInquiryService.list().find(item => String(item.id) === String(focusId));
        if (!anfrage) return;
        setThreadItem(anfrage);
        setReplyText("");
        setThreadOpen(true);
    }, [focusId]);

    useEffect(() => {
        if (!threadVorgangId) {
            setSelectedOfferId("");
            return;
        }
        const alleAngebote = angeboteZuVorgang(threadVorgangId);
        if (alleAngebote.length === 0) {
            setSelectedOfferId("");
            return;
        }
        const existiert = alleAngebote.some(item => String(item.id) === String(selectedOfferId));
        if (!existiert) {
            setSelectedOfferId(String(alleAngebote[alleAngebote.length - 1].id));
        }
    }, [threadVorgangId, angebote, selectedOfferId]);

    return <>
        <SalesFlowBar currentStep="kundenanfragen" />
        <div className="kennzahlen">
            {dashboardTabs.map(card => <button key={card.key} type="button" className={`kennzahl kennzahl-button${activeTab === card.key ? " is-active" : ""}`} onClick={() => setActiveTab(card.key)}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
            </button>)}
        </div>
        <DataTable
            title={activeTab === "offen"
                ? "Offene Anfragen"
                : activeTab === "rueckmeldung"
                    ? "Warte auf Rueckmeldung"
                    : activeTab === "auftraege"
                        ? "Laufende Auftraege"
                        : "Alle Kundenanfragen"}
            selectableColumns={false}
            data={sichtbareAnfragen}
            focusRowId={threadOpen ? "" : focusId}
            columns={[
                { field: "datum", title: "Datum" },
                {
                    field: "kunde",
                    title: "Kunde",
                    render: row => {
                        const kundenname = getCustomerName(row.kundeId, row.kunde);
                        if (row.kundeId && canReadCustomers) {
                            return <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{kundenname}</Link>;
                        }

                        return kundenname;
                    }
                },
                { field: "typ", title: "Typ" },
                { field: "kanal", title: "Kanal" },
                { field: "status", title: "Status" },
                {
                    field: "betreff",
                    title: "Betreff",
                    render: row => String(row.betreff || row.anliegen || "-")
                }
            ]}
            detailLinkResolver={({ field, row, value }) => {
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                if (field === "angebotId" && value) return `/angebote?focus=${value}`;
                if (field === "auftragId" && value) return `/auftraege?focus=${value}`;
                return null;
            }}
            rowActions={[
                { name: "thread", label: "Nachrichten", permission: PERMISSIONS.VERKAUF_BEARBEITEN, onClick: vorgangOeffnen, variant: "secondary", isVisible: row => !!row.vorgangId || !!row.kundeId }
            ]}
        />
        {threadItem && <ChatDialogBoundary
            open={threadOpen}
            title="Vorgang zur Kundenanfrage"
            onClose={() => setThreadOpen(false)}
        >
            <ThreadChatDialog
                open={threadOpen}
                title="Vorgang zur Kundenanfrage"
                onClose={() => setThreadOpen(false)}
                vorgangId={threadItem.vorgangId}
                kundeLabel={getCustomerName(threadItem.kundeId, threadItem.kunde)}
                statusLabel={threadItem.status}
                anliegen={threadItem.anliegen}
                offers={vorgangAngebote}
                messages={getThreadMessages(threadItem, today)}
                ownRole="Verkauf"
                offerClickResolver={angebotAlsPdf}
                actionLinks={threadActionLinks}
                customActionSection={vorgangAngebote.length > 0 ? <>
                    <div className="form-row">
                        <Label>Angebotsentscheidung</Label>
                        <div className="thread-decision-panel">
                            <div className="thread-decision-row thread-decision-row-select">
                                <span className="thread-decision-row-label">Angebot</span>
                                <select value={selectedOfferId} onChange={event => setSelectedOfferId(event.target.value)}>
                                    {vorgangAngebote.map(item => <option key={item.id} value={String(item.id)}>
                                        {item.angebotsNr}
                                    </option>)}
                                </select>
                                <p className="thread-decision-hint">Aktionen fuer <strong>{ausgewaehltesAngebotLabel}</strong>.</p>
                            </div>
                            <div className="thread-decision-row thread-decision-row-actions">
                                <button
                                    type="button"
                                    className="thread-document-link"
                                    onClick={() => ausgewaehltesAngebot && aktualisiereAngebotsstatus(ausgewaehltesAngebot, "angenommen")}
                                    disabled={!ausgewaehltesAngebot || ausgewaehltesAngebot.status === "angenommen"}
                                >
                                    {ausgewaehltesAngebot ? `${ausgewaehltesAngebot.angebotsNr} als angenommen markieren` : "Als angenommen markieren"}
                                </button>
                                <button
                                    type="button"
                                    className="thread-document-link"
                                    onClick={() => ausgewaehltesAngebot && aktualisiereAngebotsstatus(ausgewaehltesAngebot, "abgelehnt")}
                                    disabled={!ausgewaehltesAngebot || ausgewaehltesAngebot.status === "abgelehnt"}
                                >
                                    {ausgewaehltesAngebot ? `${ausgewaehltesAngebot.angebotsNr} als abgelehnt markieren` : "Als abgelehnt markieren"}
                                </button>
                                <button
                                    type="button"
                                    className="thread-document-link"
                                    onClick={() => ausgewaehltesAngebot && aktualisiereAngebotsstatus(ausgewaehltesAngebot, "beendet")}
                                    disabled={!ausgewaehltesAngebot || ausgewaehltesAngebot.status === "beendet"}
                                >
                                    {ausgewaehltesAngebot ? `${ausgewaehltesAngebot.angebotsNr} als beendet markieren` : "Als beendet markieren"}
                                </button>
                            </div>
                            <div className="thread-decision-row thread-decision-row-followup">
                                <span className="thread-decision-row-label">Wiedervorlage</span>
                                <label className="thread-decision-followup">
                                    <span>in</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={wiedervorlageTage}
                                        onChange={event => setWiedervorlageTage(Math.max(1, Number(event.target.value || 1)))}
                                    />
                                    <span>Tagen</span>
                                    <button
                                        type="button"
                                        className="thread-inline-link"
                                        onClick={() => ausgewaehltesAngebot && angebotAufWiedervorlageSetzen(ausgewaehltesAngebot)}
                                        disabled={!ausgewaehltesAngebot}
                                    >
                                        markieren
                                    </button>
                                </label>
                            </div>
                        </div>
                    </div>
                </> : null}
                replyLabel="Antwort der Schuelerfirma"
                replyValue={replyText}
                replyPlaceholder="Antwort, Rueckfrage oder Information an den Kunden direkt im Chat erfassen..."
                onReplyChange={setReplyText}
                onReplySend={antwortSpeichern}
                showReplyBox
            />
        </ChatDialogBoundary>}
    </>;
}

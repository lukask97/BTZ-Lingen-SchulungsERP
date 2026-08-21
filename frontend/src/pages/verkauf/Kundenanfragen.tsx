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
import { subscribeToStorageSync } from "../../services/mockup/mockStorage";
import auftraegeService from "../../services/verkauf/auftraegeService";
import { naechsteAuftragsnummer } from "../../services/verkauf/verkaufService";
import { getBerlinDate, getBerlinTimestamp } from "../../utils/dateTime";
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
            senderName: "Schülerfirma Verkauf",
            betreff: "Antwort der Schülerfirma",
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
    const [threadItem, setThreadItem] = useState<any>(null);
    const [selectedOfferId, setSelectedOfferId] = useState<string>("");
    const angebote = angeboteService.getAll();
    const auftraege = auftraegeService.getAll();
    const verkaufAbsenderName = getUserDisplayNameWithRole(user, String(user.username || "Schülerfirma Verkauf"));

    const refreshInquiryState = () => {
        setAnfragen(customerInquiryService.list());
    };

    const angeboteZuVorgang = (vorgangId: string) => getOffersForVorgang(vorgangId, angebote).sort(sortByRevisionAscending);

    const vorgangOeffnen = (item) => {
        setThreadItem(item);
        setReplyText("");
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

    const angebotAlsPdf = angebot => {
        if (!angebot) return;
        openDocumentPdf({
            title: `Angebot ${angebot.angebotsNr}`,
            subject: "Automatisch erzeugtes Angebotsdokument für den Schulungseinsatz.",
            date: angebot.datum,
            note: angebot.verguenstigungsGrund || "Kein zusätzlicher Hinweis hinterlegt.",
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

        const text = `Wir senden Ihnen das Angebot ${angebot.angebotsNr} zur Prüfung zu.`;
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
            betreff: "Antwort der Schülerfirma",
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
    const laufendeAuftraege = anfragen.filter(item => {
        return istLaufenderAuftrag(item.auftragId);
    }).length;
    const vorgangAngebote = useMemo(
        () => threadVorgangId ? angeboteZuVorgang(threadVorgangId) : [],
        [threadVorgangId, angebote]
    );
    const dashboardTabs = useMemo(() => ([
        { key: "offen", label: "Offene Anfragen", value: offene },
        { key: "rueckmeldung", label: "Warte auf Rückmeldung", value: wartetAufRueckmeldung },
        {
            key: "auftraege",
            label: "Laufende Aufträge",
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
            label: angebotIstInternVorbereitet ? "Angebot prüfen" : "Angebot senden",
            onClick: angebotIstInternVorbereitet
                ? () => navigate(`/angebote?approveOfferId=${aktuellesAngebot?.id || ""}`)
                : angebotSenden
        }] : [])
    ];

    useEffect(() => subscribeToStorageSync(["kundenanfragen", "nachrichten", "angebote", "auftraege", "kunden"], () => {
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
        <SalesFlowBar currentStep="kundenanfragen"/>
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
                     ? "Warte auf Rückmeldung"
                    : activeTab === "auftraege"
                         ? "Laufende Aufträge"
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
                            <div className="thread-decision-inline">
                                <button
                                    type="button"
                                    className="thread-document-link"
                                    onClick={() => aktuellesAngebot && aktualisiereAngebotsstatus(aktuellesAngebot, "abgelehnt")}
                                    disabled={!aktuellesAngebot || aktuellesAngebot.status === "abgelehnt"}
                                >
                                    Als abgelehnt markieren
                                </button>
                                <button
                                    type="button"
                                    className="thread-document-link"
                                    onClick={() => aktuellesAngebot && aktualisiereAngebotsstatus(aktuellesAngebot, "beendet")}
                                    disabled={!aktuellesAngebot || aktuellesAngebot.status === "beendet"}
                                >
                                    Als beendet markieren
                                </button>
                            </div>
                            <div className="thread-decision-inline thread-decision-inline-accept">
                                <span>Angebot</span>
                                <select value={selectedOfferId} onChange={event => setSelectedOfferId(event.target.value)}>
                                    {vorgangAngebote.map(item => <option key={item.id} value={String(item.id)}>
                                        {item.angebotsNr}
                                    </option>)}
                                </select>
                                <button
                                    type="button"
                                    className="thread-document-link"
                                    onClick={() => {
                                        if (!ausgewaehltesAngebot) return;
                                        aktualisiereAngebotsstatus(ausgewaehltesAngebot, "angenommen");
                                    }}
                                    disabled={!ausgewaehltesAngebot || ausgewaehltesAngebot.status === "angenommen"}
                                >
                                    als akzeptiert markieren
                                </button>
                            </div>
                        </div>
                    </div>
                </> : null}
                replyLabel="Antwort der Schülerfirma"
                replyValue={replyText}
                replyPlaceholder="Antwort, Rückfrage oder Information an den Kunden direkt im Chat erfassen..."
                onReplyChange={setReplyText}
                onReplySend={antwortSpeichern}
                showReplyBox
            />
        </ChatDialogBoundary>}
    </>;
}

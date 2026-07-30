import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import ChatDialogBoundary from "../../components/ChatDialogBoundary";
import ThreadChatDialog from "../../components/ThreadChatDialog";
import Label from "../../components/form/Label";
import OverviewCards from "../../components/OverviewCards";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import nachrichtenService, { listNachrichtenZuVorgang } from "../../services/verkauf/nachrichtenService";
import angeboteService from "../../services/verkauf/angeboteService";
import { subscribeToStorageSync } from "../../services/mockup/mockStorage";
import auftraegeService from "../../services/verkauf/auftraegeService";
import { getBerlinDate, getBerlinTimestamp } from "../../utils/dateTime";
import { getCustomerName } from "../../utils/customerReferences";
import { openDocumentPdf } from "../../utils/documentPdf";

const today = getBerlinDate();

function getThreadMessages(threadItem: any) {
    if (!threadItem) return [];
    const vorgangId = threadItem.vorgangId || `anfrage-${threadItem.id}`;
    const nachrichten = listNachrichtenZuVorgang(vorgangId);
    const hatVerkaufAntwort = nachrichten.some(item => item.senderRolle === "Verkauf");

    if (!hatVerkaufAntwort && threadItem.antwort) {
        return [...nachrichten, {
            id: `synthetic-verkauf-${threadItem.id || vorgangId}`,
            datum: threadItem.beantwortetAm || threadItem.datum || today,
            zeitpunkt: `${threadItem.beantwortetAm || threadItem.datum || today}T12:00:00`,
            senderRolle: "Verkauf",
            senderName: "Schuelerfirma Verkauf",
            betreff: "Antwort der Schuelerfirma",
            nachricht: threadItem.antwort
        }].sort((a, b) => String(a.zeitpunkt || a.datum).localeCompare(String(b.zeitpunkt || b.datum)));
    }

    return nachrichten;
}

export default function Kundenanfragen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const focusId = searchParams.get("focus") || "";
    const [anfragen, setAnfragen] = useState(customerInquiryService.list());
    const [threadOpen, setThreadOpen] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [threadItem, setThreadItem] = useState<any>(null);
    const [selectedOfferId, setSelectedOfferId] = useState<string>("");
    const angebote = angeboteService.getAll();
    const angeboteZuVorgang = vorgangId => angebote
        .filter(item => item.vorgangId === vorgangId)
        .sort((a, b) => Number(a.revision || 0) - Number(b.revision || 0));

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
            subject: "Automatisch erzeugtes Angebotsdokument fuer den Schulungseinsatz.",
            date: angebot.datum,
            note: angebot.verguenstigungsGrund || "Kein zusaetzlicher Hinweis hinterlegt.",
            referenceLabel: "Angebot",
            referenceValue: angebot.angebotsNr,
            partnerLabel: "Kunde",
            partnerValue: getCustomerName(angebot.kundeId, angebot.kunde),
            positions: angebot.positionen || [],
            deductionAmount: angebot.rabattBetrag || 0,
            deductionReason: angebot.verguenstigungsGrund || ""
        });
    };

    const angebotSenden = () => {
        const angebot = getSelectedOffer(angeboteZuVorgang(threadItem?.vorgangId));
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
            vorgangId: threadItem.vorgangId || `anfrage-${threadItem.id}`,
            anfrageId: threadItem.id,
            angebotId: angebot.id,
            datum: today,
            zeitpunkt: getBerlinTimestamp(),
            senderRolle: "Verkauf",
            senderName: "Schuelerfirma Verkauf",
            kanal: threadItem.kanal || "E-Mail",
            betreff: `Angebot ${angebot.angebotsNr}`,
            nachricht: text,
            typ: "Angebot"
        });

        setAnfragen(customerInquiryService.list());
        setThreadItem(aktualisierteAnfrage);
    };

    const aktualisiereAngebotsstatus = (angebot, status) => {
        const vorgangAngebote = angeboteZuVorgang(angebot.vorgangId);
        let neuerAuftragId = threadItem?.auftragId || "";

        if (status === "angenommen") {
            const bestehenderAuftrag = auftraegeService.list().find(item => String(item.angebotId) === String(angebot.id));
            if (bestehenderAuftrag) {
                neuerAuftragId = bestehenderAuftrag.id;
            } else {
                const auftrag = auftraegeService.add({
                    auftragNr: `VK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
                    kundeId: angebot.kundeId,
                    kunde: angebot.kunde,
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
            auftragId: status === "angenommen" ? neuerAuftragId : (threadItem?.auftragId || ""),
            status: status === "angenommen" ? "erledigt" : threadItem?.status
        };

        customerInquiryService.update(aktualisierteAnfrage);
        setAnfragen(customerInquiryService.list());
        setThreadItem(aktualisierteAnfrage);
    };

    const antwortSpeichern = () => {
        if (!threadItem || !replyText.trim()) return;
        const vorgangId = threadItem.vorgangId || `anfrage-${threadItem.id}`;
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
            datum: today,
            zeitpunkt: getBerlinTimestamp(),
            senderRolle: "Verkauf",
            senderName: "Schuelerfirma Verkauf",
            kanal: threadItem.kanal || "E-Mail",
            betreff: "Antwort der Schuelerfirma",
            nachricht: replyText.trim(),
            typ: "Antwort"
        });

        setAnfragen(customerInquiryService.list());
        setThreadItem(aktualisierteAnfrage);
        setReplyText("");
    };

    const offene = anfragen.filter(item => item.status === "offen").length;

    const vorgangAngebote = useMemo(
        () => threadItem?.vorgangId ? angeboteZuVorgang(threadItem.vorgangId) : [],
        [threadItem, angebote]
    );
    const aktuellesAngebot = vorgangAngebote[vorgangAngebote.length - 1];
    const ausgewaehltesAngebot = getSelectedOffer(vorgangAngebote);
    const kannAngebotErstellen = !!threadItem?.kundeId && (vorgangAngebote.length === 0 || aktuellesAngebot?.status === "abgelehnt");
    const kannAngebotSenden = !!aktuellesAngebot && !angebotWurdeBereitsGesendet(aktuellesAngebot);

    useEffect(() => subscribeToStorageSync(["kundenanfragen", "nachrichten", "angebote", "auftraege", "kunden"], () => {
        setAnfragen(customerInquiryService.list());
        if (threadItem) {
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
        if (!threadItem?.vorgangId) {
            setSelectedOfferId("");
            return;
        }
        const alleAngebote = angeboteZuVorgang(threadItem.vorgangId);
        if (alleAngebote.length === 0) {
            setSelectedOfferId("");
            return;
        }
        const existiert = alleAngebote.some(item => String(item.id) === String(selectedOfferId));
        if (!existiert) {
            setSelectedOfferId(String(alleAngebote[alleAngebote.length - 1].id));
        }
    }, [threadItem, angebote, selectedOfferId]);

    return <>
        <OverviewCards cards={[
            { label: "Anfragen gesamt", value: anfragen.length },
            { label: "Offen", value: offene },
            { label: "Beantwortet", value: anfragen.filter(item => item.status === "beantwortet").length }
        ]}/>
        <DataTable
            title="Kundenanfragen"
            selectableColumns={false}
            data={anfragen}
            focusRowId={threadOpen ? "" : focusId}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "kunde", title: "Kunde", render: row => row.kundeId ? <Link className="detail-link" to={`/kunden?focus=${row.kundeId}`}>{getCustomerName(row.kundeId, row.kunde)}</Link> : row.kunde },
                { field: "typ", title: "Typ" },
                { field: "kanal", title: "Kanal" },
                { field: "status", title: "Status" },
                { field: "anliegen", title: "Anliegen" }
            ]}
            detailLinkResolver={({ field, row, value }) => {
                if (field === "kunde" && row.kundeId) return `/kunden?focus=${row.kundeId}`;
                if (field === "angebotId" && value) return `/angebote?focus=${value}`;
                if (field === "auftragId" && value) return `/auftraege?focus=${value}`;
                return null;
            }}
            rowActions={[
                { name: "openOffer", label: "Angebot oeffnen", permission: "verkauf.bearbeiten", onClick: row => row.angebotId && navigate(`/angebote?focus=${row.angebotId}`), variant: "secondary", isVisible: row => !!row.angebotId },
                { name: "thread", label: "Nachrichten", permission: "verkauf.bearbeiten", onClick: vorgangOeffnen, variant: "secondary", isVisible: row => !!row.vorgangId },
                { name: "openOrder", label: "Auftrag oeffnen", permission: "verkauf.bearbeiten", onClick: row => row.auftragId && navigate(`/auftraege?focus=${row.auftragId}`), variant: "secondary", isVisible: row => !!row.auftragId },
                { name: "threadOrder", label: "Nachrichten", permission: "verkauf.bearbeiten", onClick: vorgangOeffnen, variant: "secondary", isVisible: row => !row.vorgangId && !!row.kundeId }
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
                messages={getThreadMessages(threadItem)}
                ownRole="Verkauf"
                offerClickResolver={angebotAlsPdf}
                actionLinks={[
                ...(kannAngebotErstellen ? [{
                    id: "prepare-offer",
                    label: aktuellesAngebot?.status === "abgelehnt" ? "Neues Angebot vorbereiten" : "Angebot erstellen",
                    onClick: () => navigate(`/angebote?new=fromInquiry&kundeId=${threadItem.kundeId}&anfrageId=${threadItem.id}`)
                }] : []),
                    ...(kannAngebotSenden ? [{
                        id: "send-offer",
                        label: "Angebot senden",
                        onClick: angebotSenden
                    }] : [])
                ]}
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
                replyLabel="Antwort der Schuelerfirma"
                replyValue={replyText}
                replyPlaceholder="Antwort, Rueckfrage oder Information an den Kunden direkt im Chat erfassen..."
                onReplyChange={setReplyText}
                onReplySend={antwortSpeichern}
                showReplyBox={threadItem.status !== "beantwortet"}
            />
        </ChatDialogBoundary>}
    </>;
}

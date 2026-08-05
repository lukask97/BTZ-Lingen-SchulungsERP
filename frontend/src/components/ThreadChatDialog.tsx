import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Dialog from "./Dialog";
import Label from "./form/Label";
import TextArea from "./form/TextArea";
import { formatTimestampForDisplay } from "../utils/dateTime";

type ThreadMessage = {
    id: string | number;
    datum?: string;
    zeitpunkt?: string;
    senderRolle?: string;
    senderName?: string;
    betreff?: string;
    nachricht?: string;
};

type ThreadOffer = {
    id: string | number;
    angebotsNr: string;
    status: string;
};

type ThreadDocumentLink = {
    id: string | number;
    label: string;
    onClick: () => void;
};

type ThreadActionLink = {
    id: string | number;
    label: string;
    onClick: () => void;
};

function toSafeArray<T>(value: T[] | undefined) {
    return Array.isArray(value) ? value : [];
}

function getHeaderText(value: string | undefined, fallback = "-") {
    return String(value || fallback);
}

function renderActionButton(item: ThreadActionLink | ThreadDocumentLink) {
    return <button key={item.id} type="button" className="thread-document-link" onClick={item.onClick}>
        {item.label}
    </button>;
}

function getThreadMessageVariant(item: ThreadMessage, ownRole: string) {
    const rolle = String(item.senderRolle || "").toLowerCase();
    const betreff = String(item.betreff || "").toLowerCase();
    const eigeneNachricht = String(item.senderRolle || "") === String(ownRole || "");

    if (rolle.includes("kunde")) return "customer";
    if (betreff.includes("angebot") || betreff.includes("an kunden")) return "outbound";
    if (eigeneNachricht) return "outbound";
    if (rolle.includes("verkauf") || rolle.includes("geschaeftsfuehrung") || rolle.includes("lehrkraft")) return "internal";
    return "internal";
}

function getThreadMessageLabel(item: ThreadMessage, ownRole: string) {
    const variant = getThreadMessageVariant(item, ownRole);
    if (variant === "customer") return "Vom Kunden";
    if (variant === "outbound") return "Zum Kunden";
    return "Intern";
}

type ThreadChatDialogProps = {
    open: boolean;
    title: string;
    onClose: () => void;
    vorgangId?: string;
    kundeLabel: string;
    statusLabel?: string;
    anliegen?: string;
    offers: ThreadOffer[];
    messages: ThreadMessage[];
    ownRole: string;
    offerHrefResolver?: (offer: ThreadOffer) => string;
    offerClickResolver?: (offer: ThreadOffer) => void;
    documentLinks?: ThreadDocumentLink[];
    headerActionLink?: ThreadActionLink;
    actionLinks?: ThreadActionLink[];
    customActionSection?: JSX.Element | null;
    replyLabel?: string;
    replyValue?: string;
    replyPlaceholder?: string;
    onReplyChange?: (value: string) => void;
    onReplySend?: () => void;
    showReplyBox?: boolean;
    documentsLabel?: string;
    actionSectionLabel?: string;
};

export default function ThreadChatDialog({
    open,
    title,
    onClose,
    vorgangId,
    kundeLabel,
    statusLabel,
    anliegen,
    offers,
    messages,
    ownRole,
    offerHrefResolver,
    offerClickResolver,
    documentLinks = [],
    headerActionLink,
    actionLinks = [],
    customActionSection,
    replyLabel,
    replyValue = "",
    replyPlaceholder,
    onReplyChange,
    onReplySend,
    showReplyBox = false,
    documentsLabel = "Dokumente",
    actionSectionLabel = "Aktionen"
}: ThreadChatDialogProps) {
    const [chatExpanded, setChatExpanded] = useState(false);
    const chatWrapperRef = useRef<HTMLDivElement | null>(null);
    const sichereNachrichten = toSafeArray(messages);
    const sichereAngebote = toSafeArray(offers);
    const sichereAktionslinks = toSafeArray(actionLinks);
    const sichereDokumentlinks = toSafeArray(documentLinks);
    const kundeText = getHeaderText(kundeLabel);
    const vorgangText = getHeaderText(vorgangId);
    const statusText = statusLabel ? String(statusLabel) : "";
    const originalNachricht = String(anliegen || "Keine Originalnachricht hinterlegt.");
    const chatCollapsed = sichereNachrichten.length > 3 && !chatExpanded;
    const chatSectionClassName = useMemo(
        () => `thread-chat-wrapper${chatCollapsed ? " is-collapsed" : ""}${chatExpanded ? " is-expanded" : ""}`,
        [chatCollapsed, chatExpanded]
    );

    useEffect(() => {
        if (!open || !chatWrapperRef.current) return;
        chatWrapperRef.current.scrollTop = chatWrapperRef.current.scrollHeight;
    }, [open, sichereNachrichten.length, chatExpanded]);

    function handleReplyKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (!onReplySend) return;
        if (!event.ctrlKey || event.key !== "Enter") return;
        event.preventDefault();
        onReplySend();
    }

    function renderMessage(item: ThreadMessage) {
        const variant = getThreadMessageVariant(item, ownRole);

        return <div
            key={item.id}
            className={`thread-message-row ${variant === "customer" ? "thread-message-row-customer" : variant === "outbound" ? "thread-message-row-outbound" : "thread-message-row-internal"}`}
        >
            <article className={`thread-message ${variant === "customer" ? "thread-message-customer" : variant === "outbound" ? "thread-message-outbound" : "thread-message-internal"}`}>
                <div className="thread-message-meta">
                    <strong>{String(item.senderName || item.senderRolle || "Nachricht")}</strong>
                    <span>{getThreadMessageLabel(item, ownRole)} | {formatTimestampForDisplay(item.zeitpunkt || item.datum)} | {String(item.betreff || "")}</span>
                </div>
                <p className="thread-message-text">{String(item.nachricht || "")}</p>
            </article>
        </div>;
    }

    function renderOfferLink(item: ThreadOffer) {
        const label = String(item.angebotsNr || "-");

        if (offerClickResolver) {
            return <button type="button" className="thread-inline-link" onClick={() => offerClickResolver(item)}>{label}</button>;
        }

        if (offerHrefResolver) {
            return <Link className="detail-link" to={offerHrefResolver(item)}>{label}</Link>;
        }

        return label;
    }

    return <Dialog open={open} title={title} onClose={onClose}>
        <div className="thread-header-card form-row">
            <div className="thread-header-top">
                <div>
                    <Label>Kunde</Label>
                    <strong>{kundeText}</strong>
                </div>
                {headerActionLink && renderActionButton(headerActionLink)}
            </div>
            <div className="thread-header-body">
                <div>
                    <Label>Originale Nachricht</Label>
                    <p>{originalNachricht}</p>
                </div>
                <div className="thread-header-meta">
                    <div><Label>Vorgang</Label><strong>{vorgangText}</strong></div>
                    {statusText && <div><Label>Status</Label><strong>{statusText}</strong></div>}
                </div>
            </div>
        </div>
        <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label>Nachrichtenverlauf</Label>
                <div className="thread-message-legend">
                    <span className="thread-message-legend-item"><span className="thread-message-legend-chip thread-message-legend-chip-outbound"/>Zum Kunden</span>
                    <span className="thread-message-legend-item"><span className="thread-message-legend-chip thread-message-legend-chip-internal"/>Intern</span>
                    <span className="thread-message-legend-item"><span className="thread-message-legend-chip thread-message-legend-chip-customer"/>Vom Kunden</span>
                </div>
                {sichereNachrichten.length > 3 && <button
                    type="button"
                    className="thread-inline-link"
                    onClick={() => setChatExpanded(value => !value)}
                >
                    {chatExpanded ? "Weniger anzeigen" : "Alle Nachrichten anzeigen"}
                </button>}
            </div>
            {sichereNachrichten.length === 0 ? <p>Noch keine Nachrichten vorhanden.</p> : <div ref={chatWrapperRef} className={chatSectionClassName}>
                <div className="thread-chat">
                    {sichereNachrichten.map(renderMessage)}
                </div>
            </div>}
        </div>
        <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label>{documentsLabel}</Label>
            </div>
            {sichereAngebote.length === 0 && sichereDokumentlinks.length === 0 ? <p>Noch keine Dokumente vorhanden.</p> : <>
                {sichereAngebote.length > 0 && <ul className="positionsliste">
                {sichereAngebote.map(item => <li key={item.id} className="thread-offer-item">
                    <div className="thread-offer-row">
                        <span>
                            {renderOfferLink(item)} - {String(item.status || "")}
                        </span>
                    </div>
                </li>)}
                </ul>}
            {sichereDokumentlinks.length > 0 && <div className="thread-document-links thread-offer-documents">
                {sichereDokumentlinks.map(renderActionButton)}
            </div>}
            </>}
        </div>
        {customActionSection}
        {sichereAktionslinks.length > 0 && <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label>{actionSectionLabel}</Label>
            </div>
            <div className="thread-document-links">
                {sichereAktionslinks.map(renderActionButton)}
            </div>
        </div>}
        {showReplyBox && onReplyChange && onReplySend && <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label>{replyLabel || "Nachricht"}</Label>
            </div>
            <TextArea rows={5} value={replyValue} onChange={onReplyChange} placeholder={replyPlaceholder} onKeyDown={handleReplyKeyDown}/>
            <div className="thread-reply-actions">
                <button type="button" onClick={onReplySend}>Nachricht senden</button>
            </div>
        </div>}
    </Dialog>;
}

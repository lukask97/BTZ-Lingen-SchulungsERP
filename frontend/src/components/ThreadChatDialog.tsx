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
    showReplyBox = false
}: ThreadChatDialogProps) {
    const [chatExpanded, setChatExpanded] = useState(false);
    const chatWrapperRef = useRef<HTMLDivElement | null>(null);
    const sichereNachrichten = Array.isArray(messages) ? messages : [];
    const sichereAngebote = Array.isArray(offers) ? offers : [];
    const sichereAktionslinks = Array.isArray(actionLinks) ? actionLinks : [];
    const sichereDokumentlinks = Array.isArray(documentLinks) ? documentLinks : [];
    const kundeText = String(kundeLabel || "-");
    const vorgangText = String(vorgangId || "-");
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

    return <Dialog open={open} title={title} onClose={onClose}>
        <div className="thread-header-card form-row">
            <div className="thread-header-top">
                <div>
                    <Label>Kunde</Label>
                    <strong>{kundeText}</strong>
                </div>
                {headerActionLink && <button type="button" className="thread-document-link" onClick={headerActionLink.onClick}>
                    {headerActionLink.label}
                </button>}
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
                    {sichereNachrichten.map(item => {
                        const eigeneNachricht = item.senderRolle === ownRole;
                        return <article key={item.id} className={`thread-message${eigeneNachricht ? " thread-message-own" : " thread-message-remote"}`}>
                            <div className="thread-message-meta">
                                <strong>{String(item.senderName || item.senderRolle || "Nachricht")}</strong>
                                <span>{formatTimestampForDisplay(item.zeitpunkt || item.datum)} | {String(item.betreff || "")}</span>
                            </div>
                            <p className="thread-message-text">{String(item.nachricht || "")}</p>
                        </article>;
                    })}
                </div>
            </div>}
        </div>
        <div className="form-row thread-section">
            <Label>Angebotsstaende</Label>
            {sichereAngebote.length === 0 ? <p>Noch kein Angebot vorhanden.</p> : <ul className="positionsliste">
                {sichereAngebote.map(item => <li key={item.id} className="thread-offer-item">
                    <div className="thread-offer-row">
                        <span>
                            {offerClickResolver
                                ? <button type="button" className="thread-inline-link" onClick={() => offerClickResolver(item)}>{String(item.angebotsNr || "-")}</button>
                                : offerHrefResolver
                                    ? <Link className="detail-link" to={offerHrefResolver(item)}>{String(item.angebotsNr || "-")}</Link>
                                    : String(item.angebotsNr || "-")} - {String(item.status || "")}
                        </span>
                    </div>
                </li>)}
            </ul>}
            {sichereDokumentlinks.length > 0 && <div className="thread-document-links thread-offer-documents">
                {sichereDokumentlinks.map(item => <button key={item.id} type="button" className="thread-document-link" onClick={item.onClick}>
                    {item.label}
                </button>)}
            </div>}
        </div>
        {customActionSection}
        {sichereAktionslinks.length > 0 && <div className="form-row thread-section">
            <Label>Aktionen</Label>
            <div className="thread-document-links">
                {sichereAktionslinks.map(item => <button key={item.id} type="button" className="thread-document-link" onClick={item.onClick}>
                    {item.label}
                </button>)}
            </div>
        </div>}
        {showReplyBox && onReplyChange && onReplySend && <div className="form-row thread-section">
            <Label>{replyLabel || "Nachricht"}</Label>
            <TextArea rows={5} value={replyValue} onChange={onReplyChange} placeholder={replyPlaceholder}/>
            <div className="thread-reply-actions">
                <button type="button" onClick={onReplySend}>Nachricht senden</button>
            </div>
        </div>}
    </Dialog>;
}

import { useEffect, useMemo, useRef, useState } from "react";
import Dialog from "./Dialog";
import Label from "./form/Label";
import TextArea from "./form/TextArea";
import { formatTimestampForDisplay } from "../utils/dateTime";
import unternehmenService from "../services/verwaltung/unternehmenService";

type ApprovalMessage = {
    id: string | number;
    datum: string;
    zeitpunkt: string;
    senderRolle: string;
    senderName: string;
    ansprechpartnerName?: string;
    ansprechpartnerAbteilung?: string;
    betreff: string;
    nachricht: string;
    typ?: string;
};

function getApprovalMessageVariant(item: ApprovalMessage) {
    const rolle = String(item.senderRolle || "").toLowerCase();
    const betreff = String(item.betreff || "").toLowerCase();
    const typ = String(item.typ || "").toLowerCase();
    const nachricht = String(item.nachricht || "").toLowerCase();

    if (rolle.includes("kunde")) return "customer";
    if (typ.includes("intern") || betreff.includes("intern") || nachricht.includes("wurde intern")) return "internal";
    if (
        typ === "angebot"
        || typ === "antwort"
        || betreff.startsWith("angebot ")
        || betreff.includes("an kunden")
        || betreff.includes("antwort der schülerfirma")
    ) return "outbound";
    if (rolle.includes("verkauf") || rolle.includes("geschaeftsfuehrung")) return "internal";
    return "internal";
}

function getApprovalMessageLabel(item: ApprovalMessage) {
    const variant = getApprovalMessageVariant(item);
    if (variant === "customer") return "Vom Kunden";
    if (variant === "outbound") return "Zum Kunden";
    return "Intern";
}

function getFirmenname() {
    return String(unternehmenService.get().firmenname || "Schülerfirma").trim();
}

function getPersonName(senderName: string, firmenname: string, senderRolle: string) {
    const cleaned = String(senderName || "").trim();
    if (!cleaned) return String(senderRolle || "-");
    if (cleaned === firmenname || cleaned === "Schülerfirma Verkauf") return String(senderRolle || "-");

    const roleMatch = cleaned.match(/\(([^()]+)\)\s*$/);
    if (roleMatch) {
        return cleaned.slice(0, cleaned.length - roleMatch[0].length).trim();
    }

    return cleaned;
}

function getPersonRole(senderName: string, senderRolle: string) {
    const cleaned = String(senderName || "").trim();
    const roleMatch = cleaned.match(/\(([^()]+)\)\s*$/);
    if (roleMatch?.[1]) return roleMatch[1].trim();
    return String(senderRolle || "---");
}

function getApprovalMessageHeading(item: ApprovalMessage) {
    const variant = getApprovalMessageVariant(item);
    const firmenname = getFirmenname();
    if (variant === "customer") return String(item.senderName || "Kunde");
    if (variant === "internal") return `${firmenname} (Intern)`;
    return firmenname;
}

function getApprovalMessageMeta(item: ApprovalMessage) {
    const variant = getApprovalMessageVariant(item);
    const timestamp = formatTimestampForDisplay(item.zeitpunkt || item.datum);
    const firmenname = getFirmenname();

    if (variant === "customer") {
        return [
            String(item.ansprechpartnerName || "Ansprechpartner"),
            String(item.ansprechpartnerAbteilung || "---"),
            timestamp
        ].join(" | ");
    }

    return [
        getPersonName(String(item.senderName || ""), firmenname, String(item.senderRolle || "")),
        getPersonRole(String(item.senderName || ""), String(item.senderRolle || "")),
        timestamp
    ].join(" | ");
}

type ApprovalOfferLink = {
    id: string | number;
    label: string;
    onClick: () => void;
};

type ApprovalPositionInfo = {
    id: string | number;
    label: string;
    quantityLabel: string;
    availabilityText: string;
    isCritical: boolean;
    lineTotal: string;
};

type OfferApprovalDialogProps = {
    open: boolean;
    title: string;
    onClose: () => void;
    kunde: string;
    vorgangId: string;
    status: string;
    currentOfferLabel: string;
    currentOfferAmount: string;
    currentOfferNote: string;
    discountLabel: string;
    totalAmountLabel: string;
    onOpenCurrentOffer: () => void;
    positionInfos: ApprovalPositionInfo[];
    previousOffers: ApprovalOfferLink[];
    messages: ApprovalMessage[];
    noteValue: string;
    onNoteChange: (value: string) => void;
    onApprove: () => void;
    onReject: () => void;
    onRevise: () => void;
    onForward: () => void;
    notePlaceholder: string;
    approveLabel: string;
    rejectLabel: string;
    forwardLabel: string;
};

export default function OfferApprovalDialog({
    open,
    title,
    onClose,
    kunde,
    vorgangId,
    status,
    currentOfferLabel,
    currentOfferAmount,
    currentOfferNote,
    discountLabel,
    totalAmountLabel,
    onOpenCurrentOffer,
    positionInfos = [],
    previousOffers,
    messages,
    noteValue,
    onNoteChange,
    onApprove,
    onReject,
    onRevise,
    onForward,
    notePlaceholder = "Interne Begründung oder Rückfrage notieren...",
    approveLabel = "Freigeben",
    rejectLabel = "Ablehnen",
    forwardLabel = "Zur Geschäftsführung weiterleiten"
}: OfferApprovalDialogProps) {
    const [chatExpanded, setChatExpanded] = useState(false);
    const chatWrapperRef = useRef<HTMLDivElement | null>(null);
    const noteMissing = !noteValue.trim();
    const chatCollapsed = messages.length > 3 && !chatExpanded;
    const chatSectionClassName = useMemo(
        () => `thread-chat-wrapper${chatCollapsed ? " is-collapsed" : ""}${chatExpanded ? " is-expanded" : ""}`,
        [chatCollapsed, chatExpanded]
    );

    useEffect(() => {
        const wrapper = chatWrapperRef.current;
        if (!open || !wrapper) return;
        wrapper.scrollTop = wrapper.scrollHeight;
    }, [open, messages.length, chatExpanded]);

    return <Dialog open={open} title={title} onClose={onClose}>
        <div className="thread-header-card form-row">
            <div className="thread-header-top">
                <div>
                    <Label>Kunde</Label>
                    <strong>{kunde || "-"}</strong>
                </div>
            </div>
            <div className="thread-header-body">
                <div>
                    <Label>Interne Angebotsprüfung</Label>
                    <p>{currentOfferLabel}</p>
                    {currentOfferAmount && <p><strong>{currentOfferAmount}</strong></p>}
                    <p>{currentOfferNote || "Kein interner Hinweis hinterlegt."}</p>
                </div>
                <div className="thread-header-meta">
                    <div><Label>Vorgang</Label><strong>{vorgangId || "-"}</strong></div>
                    {status && <div><Label>Status</Label><strong>{status}</strong></div>}
                </div>
            </div>
        </div>

        <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label>Prüfdetails</Label>
            </div>
            {positionInfos.length === 0 ? <p>Keine positionsbezogenen Bestandsdaten vorhanden.</p> : <ul className="positionsliste">
                {positionInfos.map(item => <li key={item.id} className="position-entry">
                    <div>
                        <div>{item.label}{item.quantityLabel ? `: ${item.quantityLabel}` : ""}</div>
                        {item.lineTotal && <p className="position-availability position-availability-meta">Gesamtpreis: {item.lineTotal}</p>}
                        <p className={`position-availability${item.isCritical ? " position-availability-critical" : ""}`}>
                            {item.availabilityText}
                        </p>
                    </div>
                </li>)}
            </ul>}
            <div className="thread-header-meta">
                {discountLabel && <div><Label>Vergünstigung</Label><strong>{discountLabel}</strong></div>}
                <div><Label>Gesamtbetrag</Label><strong>{totalAmountLabel || currentOfferAmount || "-"}</strong></div>
            </div>
            {currentOfferNote && <div className="thread-header-meta">
                <div>
                    <Label>Grund</Label>
                    <strong>{currentOfferNote}</strong>
                </div>
            </div>}
        </div>

        <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label>Nachrichtenverlauf</Label>
                <div className="thread-message-legend">
                    <span className="thread-message-legend-item"><span className="thread-message-legend-chip thread-message-legend-chip-outbound"/>Zum Kunden</span>
                    <span className="thread-message-legend-item"><span className="thread-message-legend-chip thread-message-legend-chip-internal"/>Intern</span>
                    <span className="thread-message-legend-item"><span className="thread-message-legend-chip thread-message-legend-chip-customer"/>Vom Kunden</span>
                </div>
                {messages.length > 3 && <button
                    type="button"
                    className="thread-inline-link"
                    onClick={() => setChatExpanded(value => !value)}
                >
                    {chatExpanded ? "Weniger anzeigen" : "Alle Nachrichten anzeigen"}
                </button>}
            </div>
            {messages.length === 0 ? <p>Noch keine Nachrichten vorhanden.</p> : <div ref={chatWrapperRef} className={chatSectionClassName}>
                <div className="thread-chat">
                    {messages.map(item => {
                        const variant = getApprovalMessageVariant(item);
                        return <div
                            key={item.id}
                            className={`thread-message-row ${variant === "customer" ? "thread-message-row-customer" : variant === "outbound" ? "thread-message-row-outbound" : "thread-message-row-internal"}`}
                        >
                            <article
                                className={`thread-message ${variant === "customer" ? "thread-message-customer" : variant === "outbound" ? "thread-message-outbound" : "thread-message-internal"}`}
                            >
                                <div className="thread-message-meta">
                                    <strong>{getApprovalMessageHeading(item)}</strong>
                                    <span>{getApprovalMessageMeta(item)}</span>
                                </div>
                                <p className="thread-message-text">{String(item.nachricht || "")}</p>
                            </article>
                        </div>;
                    })}
                </div>
            </div>}
        </div>

        <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label>Dokumente</Label>
            </div>
            <ul className="positionsliste">
                <li className="thread-offer-item">
                    <div className="thread-offer-row">
                        <button type="button" className="thread-document-link" onClick={onOpenCurrentOffer}>
                            {currentOfferLabel} - Aktuelle Fassung
                        </button>
                    </div>
                </li>
                {previousOffers.map(item => <li key={item.id} className="thread-offer-item">
                    <div className="thread-offer-row">
                        <button type="button" className="thread-document-link" onClick={item.onClick}>
                            {item.label}
                        </button>
                    </div>
                </li>)}
            </ul>
        </div>

        <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label>Interne Freigabenotiz</Label>
            </div>
            <TextArea rows={4} value={noteValue} onChange={onNoteChange} placeholder={notePlaceholder}/>
            <div className="thread-section-header">
                <Label>Aktionen</Label>
            </div>
            <div className="thread-document-links">
                <button type="button" onClick={onApprove}>{approveLabel}</button>
                {onRevise && <button type="button" className="button-secondary" onClick={onRevise} disabled={noteMissing}>Überarbeiten</button>}
                <button type="button" className="button-danger" onClick={onReject} disabled={noteMissing}>{rejectLabel}</button>
                {onForward && <button type="button" className="button-secondary" onClick={onForward} disabled={noteMissing}>{forwardLabel}</button>}
            </div>
            <p>Für Überarbeiten, Ablehnen oder Weiterleiten bitte eine Notiz eintragen.</p>
        </div>
    </Dialog>;
}

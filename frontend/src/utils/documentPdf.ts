export function openDocumentPdf({
    title,
    subject,
    date,
    note,
    referenceLabel,
    referenceValue,
    partnerLabel,
    partnerValue,
    positions = [],
    preispositionen = [],
    deductionAmount = 0,
    deductionReason = "",
    appendixPages = []
}) {
    const popup = window.open("", "_blank", "width=900,height=1200");
    if (!popup) return;

    const safe = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    const formatCurrency = (value) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));
    const getPositionDetail = (position) => {
        if (String(position?.leistungTyp || "") !== "Service") return "";
        const berechnungstyp = String(position?.berechnungstyp || "Pauschal");
        const zeEinheit = String(position?.zeEinheit || "").trim();

        return berechnungstyp === "ZE" && zeEinheit
            ? `${berechnungstyp} | ${zeEinheit}`
            : berechnungstyp;
    };

    const renderPositionsHtml = (pagePositions = []) => pagePositions.length === 0
        ? "<p>Keine Positionen vorhanden.</p>"
        : `<table>
            <thead>
                <tr>
                    <th>Position</th>
                    <th>Menge</th>
                    <th>Einzelpreis</th>
                    <th>Gesamt</th>
                </tr>
            </thead>
            <tbody>
                ${pagePositions.map((position) => `<tr>
                    <td>${safe(position.artikel)}${getPositionDetail(position) ? `<div class="position-detail">${safe(getPositionDetail(position))}</div>` : ""}</td>
                    <td>${safe(position.menge)}</td>
                    <td>${safe(formatCurrency(position.einzelpreis ?? 0))}</td>
                    <td>${safe(formatCurrency(Number(position.menge || 0) * Number(position.einzelpreis || 0)))}</td>
                </tr>`).join("")}
            </tbody>
        </table>`;

    const renderPreispositionenHtml = (pagePreispositionen = [], pagePositions = []) => {
        if (!pagePreispositionen || pagePreispositionen.length === 0) return "";

        const positionsTotal = pagePositions.reduce((sum, position) => sum + Number(position.menge || 0) * Number(position.einzelpreis || 0), 0);

        return `<section class="preispositionen">
            <strong>Zu- und Abschläge</strong>
            <table>
                <thead>
                    <tr>
                        <th>Beschreibung</th>
                        <th>Typ</th>
                        <th>Wert</th>
                    </tr>
                </thead>
                <tbody>
                    ${pagePreispositionen.map(position => {
                        const wert = Number(position.wert || 0);
                        if (position.typ === "percent") {
                            const euro = (positionsTotal * wert) / 100;
                            return `<tr>
                                <td>${safe(position.beschreibung || "")}</td>
                                <td>%</td>
                                <td>${safe(`${wert.toFixed(2)} % ≙ ${formatCurrency(euro)}`)}</td>
                            </tr>`;
                        }
                        return `<tr>
                            <td>${safe(position.beschreibung || "")}</td>
                            <td>Betrag</td>
                            <td>${safe(formatCurrency(wert))}</td>
                        </tr>`;
                    }).join("")}
                </tbody>
            </table>
        </section>`;
    };

    const renderDeductionHtml = (pageDeductionAmount = 0, pageDeductionReason = "") => {
        const deduction = Number(pageDeductionAmount || 0);
        if (deduction <= 0) return "";
        return `<section class="deduction">
            <strong>Zusaetzlicher Abzug</strong>
            <p>Betrag: ${safe(formatCurrency(deduction))}</p>
            <p>Grund: ${safe(pageDeductionReason || "Kein Grund hinterlegt.")}</p>
        </section>`;
    };

    const renderHistoryHtml = (historyEntries = []) => historyEntries.length === 0
        ? "<p>Keine Verlaufseinträge vorhanden.</p>"
        : `<ul class="history-list">
            ${historyEntries.map((entry) => `<li>
                <strong>${safe(entry.date || "")}</strong>
                <span>${safe(entry.label || "")}</span>
                <p>${safe(entry.text || "")}</p>
            </li>`).join("")}
        </ul>`;

    const renderDocumentPage = ({
        pageTitle,
        pageSubject,
        pageDate,
        pageNote,
        pageReferenceLabel,
        pageReferenceValue,
        pagePartnerLabel,
        pagePartnerValue,
        pagePositions = [],
        pagePreispositionen = [],
        pageDeductionAmount = 0,
        pageDeductionReason = ""
    }) => {
        const positionsTotal = pagePositions.reduce((sum, position) => sum + Number(position.menge || 0) * Number(position.einzelpreis || 0), 0);
        const adjustmentsTotal = (pagePreispositionen || []).reduce((sum, position) => {
            const wert = Number(position.wert || 0);
            return sum + (position.typ === "percent" ? (positionsTotal * wert) / 100 : wert);
        }, 0);
        const deduction = Number(pageDeductionAmount || 0);
        const nettoTotal = Math.max(0, positionsTotal + adjustmentsTotal - deduction);
        const vatAmount = Math.max(0, nettoTotal * 0.19);
        const finalTotal = Math.max(0, nettoTotal + vatAmount);

        return `<section class="pdf-page">
            <h1>${safe(pageTitle)}</h1>
            <p>${safe(pageSubject)}</p>
            <section class="meta">
                <div><span>Datum</span><strong>${safe(pageDate)}</strong></div>
                <div><span>${safe(pageReferenceLabel)}</span><strong>${safe(pageReferenceValue)}</strong></div>
                <div><span>${safe(pagePartnerLabel)}</span><strong>${safe(pagePartnerValue)}</strong></div>
                <div><span>Quelle</span><strong>Automatisch aus ERP-Daten erzeugt</strong></div>
            </section>
            <section class="content">
                <strong>Hinweis / Inhalt</strong>
                <p>${safe(pageNote || "Kein zusaetzlicher Hinweis hinterlegt.")}</p>
                <strong>Positionen</strong>
                ${renderPositionsHtml(pagePositions)}
                ${renderPreispositionenHtml(pagePreispositionen, pagePositions)}
                <div class="totals">
                    <strong>Zwischensumme: ${safe(formatCurrency(positionsTotal))}</strong>
                </div>
                ${renderDeductionHtml(pageDeductionAmount, pageDeductionReason)}
                <div class="totals">
                    <div class="offer-total"><strong style="font-size:1.15em;">Gesamtbetrag exkl. MwSt: ${safe(formatCurrency(nettoTotal))}</strong></div>
                </div>
                <div class="totals">
                    <strong>MwSt (19%): ${safe(formatCurrency(vatAmount))}</strong>
                </div>
                <div class="totals">
                    <div class="offer-total"><strong style="font-size:1.15em;">Gesamt: ${safe(formatCurrency(finalTotal))}</strong></div>
                </div>
            </section>
        </section>`;
    };

    const renderHistoryPage = ({
        pageTitle,
        pageSubject,
        pageDate,
        pageNote,
        pageReferenceValue,
        pagePartnerLabel,
        pagePartnerValue,
        historyEntries = []
    }) => `<section class="pdf-page">
        <h1>${safe(pageTitle)}</h1>
        <p>${safe(pageSubject)}</p>
        <section class="meta">
            <div><span>Stand</span><strong>${safe(pageDate)}</strong></div>
            <div><span>Vorgang</span><strong>${safe(pageReferenceValue)}</strong></div>
            <div><span>${safe(pagePartnerLabel)}</span><strong>${safe(pagePartnerValue)}</strong></div>
            <div><span>Quelle</span><strong>Automatisch aus ERP-Daten erzeugt</strong></div>
        </section>
        <section class="content">
            <strong>Verlauf</strong>
            <p>${safe(pageNote || "Kein zusätzlicher Hinweis hinterlegt.")}</p>
            ${renderHistoryHtml(historyEntries)}
        </section>
    </section>`;

    const allPagesHtml = [
        renderDocumentPage({
            pageTitle: title,
            pageSubject: subject,
            pageDate: date,
            pageNote: note,
            pageReferenceLabel: referenceLabel,
            pageReferenceValue: referenceValue,
            pagePartnerLabel: partnerLabel,
            pagePartnerValue: partnerValue,
            pagePositions: positions,
            pagePreispositionen: preispositionen,
            pageDeductionAmount: deductionAmount,
            pageDeductionReason: deductionReason
        }),
        ...appendixPages.map((page) => page.pageType === "history"
            ? renderHistoryPage({
                pageTitle: page.title,
                pageSubject: page.subject || subject,
                pageDate: page.date || date,
                pageNote: page.note || "",
                pageReferenceValue: page.referenceValue || referenceValue,
                pagePartnerLabel: page.partnerLabel || partnerLabel,
                pagePartnerValue: page.partnerValue || partnerValue,
                historyEntries: page.historyEntries || []
            })
            : renderDocumentPage({
                pageTitle: page.title,
                pageSubject: page.subject || subject,
                pageDate: page.date || date,
                pageNote: page.note || "",
                pageReferenceLabel: page.referenceLabel || referenceLabel,
                pageReferenceValue: page.referenceValue || referenceValue,
                pagePartnerLabel: page.partnerLabel || partnerLabel,
                pagePartnerValue: page.partnerValue || partnerValue,
                pagePositions: page.positions || [],
                pagePreispositionen: page.preispositionen || [],
                pageDeductionAmount: page.deductionAmount || 0,
                pageDeductionReason: page.deductionReason || ""
            }))
    ].join("");

    popup.document.write(`<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8" />
    <title>${safe(title)}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }
        h1 { margin-bottom: 8px; }
        .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin: 24px 0; }
        .meta div { padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; background: #f9fafb; }
        .meta span { display: block; font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
        .content { border: 1px solid #d1d5db; border-radius: 8px; padding: 18px; min-height: 280px; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        th, td { border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; }
        th { background: #f3f4f6; }
        .deduction { margin-top: 18px; padding: 14px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff7ed; }
        .totals { margin-top: 18px; display: grid; gap: 8px; }
        .totals .offer-total strong { font-size: 1.15em; background: #f7f7f7; padding: 6px; border-radius: 4px; display: inline-block; }
        .position-detail { margin-top: 4px; font-size: 12px; color: #6b7280; }
        .actions { display: flex; gap: 12px; margin: 0 0 24px; }
        .actions button { border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; background: #111827; color: white; font-size: 14px; }
        .actions .secondary { background: #e5e7eb; color: #111827; }
        .pdf-page + .pdf-page { page-break-before: always; margin-top: 48px; }
        .history-list { list-style: none; padding: 0; margin: 18px 0 0; display: grid; gap: 12px; }
        .history-list li { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px 14px; background: #f9fafb; }
        .history-list span { display: block; font-size: 12px; text-transform: uppercase; color: #6b7280; margin-top: 4px; }
        .history-list p { margin: 8px 0 0; }
        .footer { margin-top: 24px; font-size: 12px; color: #6b7280; }
        @media print {
            .actions { display: none; }
            body { margin: 16px; }
        }
    </style>
</head>
<body>
    <div class="actions">
        <button onclick="window.print()">Drucken</button>
        <button class="secondary" onclick="window.close()">Schliessen</button>
    </div>
    ${allPagesHtml}
    <p class="footer">Automatisch erzeugtes Schulungsdokument</p>
</body>
</html>`);
    popup.document.close();
    popup.focus();
}

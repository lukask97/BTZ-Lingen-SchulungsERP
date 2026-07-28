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
    deductionAmount = 0,
    deductionReason = ""
}) {
    const popup = window.open("", "_blank", "width=900,height=1200");
    if (!popup) return;

    const safe = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    const formatCurrency = (value) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));
    const positionsTotal = positions.reduce((sum, position) => sum + Number(position.menge || 0) * Number(position.einzelpreis || 0), 0);
    const deduction = Number(deductionAmount || 0);
    const finalTotal = Math.max(0, positionsTotal - deduction);

    const positionsHtml = positions.length === 0
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
                ${positions.map((position) => `<tr>
                    <td>${safe(position.artikel)}</td>
                    <td>${safe(position.menge)}</td>
                    <td>${safe(formatCurrency(position.einzelpreis ?? 0))}</td>
                    <td>${safe(formatCurrency(Number(position.menge || 0) * Number(position.einzelpreis || 0)))}</td>
                </tr>`).join("")}
            </tbody>
        </table>`;

    const deductionHtml = deduction > 0
        ? `<section class="deduction">
            <strong>Zusaetzlicher Abzug</strong>
            <p>Betrag: ${safe(formatCurrency(deduction))}</p>
            <p>Grund: ${safe(deductionReason || "Kein Grund hinterlegt.")}</p>
        </section>`
        : "";

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
        .actions { display: flex; gap: 12px; margin: 0 0 24px; }
        .actions button { border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; background: #111827; color: white; font-size: 14px; }
        .actions .secondary { background: #e5e7eb; color: #111827; }
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
    <h1>${safe(title)}</h1>
    <p>${safe(subject)}</p>
    <section class="meta">
        <div><span>Datum</span><strong>${safe(date)}</strong></div>
        <div><span>${safe(referenceLabel)}</span><strong>${safe(referenceValue)}</strong></div>
        <div><span>${safe(partnerLabel)}</span><strong>${safe(partnerValue)}</strong></div>
        <div><span>Quelle</span><strong>Automatisch aus ERP-Daten erzeugt</strong></div>
    </section>
    <section class="content">
        <strong>Hinweis / Inhalt</strong>
        <p>${safe(note || "Kein zusaetzlicher Hinweis hinterlegt.")}</p>
        <strong>Positionen</strong>
        ${positionsHtml}
        <div class="totals">
            <strong>Zwischensumme: ${safe(formatCurrency(positionsTotal))}</strong>
        </div>
        ${deductionHtml}
        <div class="totals">
            ${deduction > 0 ? `<strong>Gesamt nach Abzug: ${safe(formatCurrency(finalTotal))}</strong>` : ""}
        </div>
    </section>
    <p class="footer">Automatisch erzeugtes Schulungsdokument</p>
</body>
</html>`);
    popup.document.close();
    popup.focus();
}

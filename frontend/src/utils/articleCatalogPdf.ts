type CatalogImage = {
    url: string;
    filename: string;
};

type CatalogArticle = {
    artikelNr: string;
    name: string;
    verkaufspreis: number;
    beschreibung: string;
    kategoriePfad: string;
    bilder: CatalogImage[];
};

function safe(value: unknown) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function formatCurrency(value: unknown) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

export function openArticleCatalogPdf({
    title,
    articles
}: {
    title: string;
    articles: CatalogArticle[];
}) {
    const popup = window.open("", "_blank", "width=1100,height=1400");
    if (!popup) return;

    const groups = articles.reduce((map, article) => {
        const key = String(article.kategoriePfad || "Ohne Kategorie").trim() || "Ohne Kategorie";
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(article);
        return map;
    }, new Map<string, CatalogArticle[]>());

    const categorySections = [...groups.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], "de"))
        .map(([category, categoryArticles]) => `
            <section class="catalog-category">
                <div class="category-header">
                    <h2>${safe(category)}</h2>
                    <span>${categoryArticles.length} Artikel</span>
                </div>
                <div class="catalog-grid">
                    ${categoryArticles.map(article => `
                        <article class="catalog-card">
                            <div class="catalog-card-meta">
                                <span class="article-number">${safe(article.artikelNr)}</span>
                                <strong>${safe(article.name)}</strong>
                                <div class="article-price">${safe(formatCurrency(article.verkaufspreis))}</div>
                            </div>
                            <p class="article-description">${safe(article.beschreibung || "Keine Beschreibung hinterlegt.")}</p>
                            ${(article.bilder || []).length > 0
                                ? `<div class="article-images">
                                    ${(article.bilder || []).map(image => `
                                        <figure class="article-image-frame">
                                            <img src="${safe(image.url)}" alt="${safe(image.filename || article.name)}" />
                                        </figure>
                                    `).join("")}
                                </div>`
                                : `<div class="article-images article-images-empty">Keine Bilder hinterlegt.</div>`}
                        </article>
                    `).join("")}
                </div>
            </section>
        `)
        .join("");

    popup.document.write(`<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8" />
    <title>${safe(title)}</title>
    ? <style>
        :root {
            color-scheme: light;
        }
        body {
            margin: 24px;
            font-family: Arial, sans-serif;
            color: #1f2937;
            background: #f6f7fb;
        }
        .actions {
            display: flex;
            gap: 12px;
            margin: 0 0 24px;
        }
        .actions button {
            border: 0;
            border-radius: 8px;
            padding: 10px 14px;
            cursor: pointer;
            background: #111827;
            color: white;
            font-size: 14px;
        }
        .actions .secondary {
            background: #e5e7eb;
            color: #111827;
        }
        .catalog-cover {
            background: linear-gradient(135deg, #ffffff, #eef4ff);
            border: 1px solid #dbe3f1;
            border-radius: 18px;
            padding: 28px;
            margin-bottom: 24px;
        }
        .catalog-cover h1 {
            margin: 0 0 8px;
            font-size: 32px;
        }
        .catalog-cover p {
            margin: 0;
            color: #52607a;
        }
        .catalog-category {
            margin-top: 28px;
            page-break-inside: avoid;
        }
        .category-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 16px;
            margin-bottom: 14px;
        }
        .category-header h2 {
            margin: 0;
            font-size: 22px;
        }
        .category-header span {
            color: #64748b;
            font-size: 14px;
        }
        .catalog-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
        }
        .catalog-card {
            background: #fff;
            border: 1px solid #dbe3f1;
            border-radius: 16px;
            padding: 18px;
            break-inside: avoid;
        }
        .catalog-card-meta {
            display: grid;
            gap: 4px;
            margin-bottom: 10px;
        }
        .article-number {
            color: #64748b;
            font-size: 13px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        .article-price {
            color: #b42318;
            font-weight: 700;
        }
        .article-description {
            margin: 0 0 14px;
            min-height: 48px;
            white-space: pre-wrap;
        }
        .article-images {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
        }
        .article-image-frame {
            margin: 0;
            border: 1px solid #dbe3f1;
            border-radius: 12px;
            background: #f8fafc;
            min-height: 140px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .article-image-frame img {
            width: 100%;
            height: 140px;
            object-fit: cover;
            display: block;
        }
        .article-images-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 70px;
            border: 1px dashed #cbd5e1;
            border-radius: 12px;
            color: #64748b;
            background: #f8fafc;
        }
        .footer {
            margin-top: 24px;
            font-size: 12px;
            color: #6b7280;
        }
        @media print {
            body {
                margin: 12px;
                background: #fff;
            }
            .actions {
                display: none;
            }
            .catalog-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }
    </style>
</head>
<body>
    <div class="actions">
        <button onclick="window.print()">Als PDF drucken</button>
        <button class="secondary" onclick="window.close()">Schliessen</button>
    </div>
    <section class="catalog-cover">
        <h1>${safe(title)}</h1>
        <p>Sortiert nach Kategorien mit Artikelnummer, Name, Verkaufspreis, Beschreibung und Bildern.</p>
    </section>
    ${categorySections}
    <p class="footer">Automatisch erzeugter Artikelkatalog aus dem Schulungs-ERP.</p>
</body>
</html>`);
    popup.document.close();
    popup.focus();
}

import glossaryEntries from "../content/glossary.json";

const glossary = glossaryEntries as Record<string, string>;

export function getGlossaryText(key?: string) {
    if (!key) return "";
    return glossary[key] || "";
}

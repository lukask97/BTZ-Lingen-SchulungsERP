from pathlib import Path

REPLACEMENTS = {
    "ÃƒÂ¤": "ä",
    "ÃƒÂ¶": "ö",
    "ÃƒÂ¼": "ü",
    "ÃƒÂ„": "Ä",
    "ÃƒÂ–": "Ö",
    "ÃƒÅ“": "Ü",
    "ÃƒÂŸ": "ß",
    "Ãƒâ€“": "Ö",
    "Ãƒâ€ž": "Ä",
    "Ã‚Â·": "·",
    "Ã‚Â": "",
    "Ã¤": "ä",
    "Ã¶": "ö",
    "Ã¼": "ü",
    "Ã„": "Ä",
    "Ã–": "Ö",
    "Ãœ": "Ü",
    "ÃŸ": "ß",
}

changed_files = []
for path in Path("frontend/src").rglob("*"):
    if path.suffix not in {".ts", ".tsx", ".css"}:
        continue

    text = path.read_text(encoding="utf-8")
    updated = text
    for broken, fixed in REPLACEMENTS.items():
        updated = updated.replace(broken, fixed)

    if updated != text:
        path.write_text(updated, encoding="utf-8", newline="")
        changed_files.append(str(path))

if changed_files:
    print("\n".join(changed_files))
else:
    print("Keine Mojibake-Sequenzen gefunden.")

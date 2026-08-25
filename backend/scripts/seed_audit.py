import json
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1] / "seed" / "sources" / "json"
REFERENCE_MAP = {
    "kundeId": "kunden",
    "lieferantId": "lieferanten",
    "angebotId": "angebote",
    "anfrageId": "kundenanfragen",
    "auftragId": "auftraege",
    "bestellungId": "bestellungen",
    "rechnungId": "rechnungen",
    "zahlungId": "zahlungen",
    "artikelId": "artikel",
    "serviceId": "services",
    "mitarbeiterId": "mitarbeiter",
    "bestellpositionId": "bestellpositionen",
    "angebotspositionId": "angebotspositionen",
    "auftragspositionId": "auftragspositionen",
    "rolleId": "rollen",
    "lagerId": "lager",
    "kategorieId": "kategorien",
}


def load_payload():
    payload = {}
    source_files = {}
    for path in sorted(ROOT.glob("*.json")):
        content = json.loads(path.read_text(encoding="utf-8"))
        for key, value in content.items():
            payload[key] = value
            source_files[key] = path.name
    return payload, source_files


def build_known_ids(payload):
    return {
        table_name: {
            str(item.get("id"))
            for item in items
            if isinstance(item, dict) and item.get("id") not in (None, "")
        }
        for table_name, items in payload.items()
        if isinstance(items, list)
    }


def audit_references(payload, known_ids):
    issues = []
    for table_name, items in payload.items():
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                issues.append({
                    "table": table_name,
                    "id": None,
                    "issue": "Eintrag ist kein Objekt."
                })
                continue
            for field_name, target_table in REFERENCE_MAP.items():
                value = item.get(field_name)
                if value in (None, "", []):
                    continue
                if str(value) not in known_ids.get(target_table, set()):
                    issues.append({
                        "table": table_name,
                        "id": item.get("id"),
                        "issue": f"{field_name} verweist auf fehlenden Eintrag in {target_table}.",
                        "value": value
                    })
    return issues


def audit_duplicates(payload):
    issues = []
    for table_name, items in payload.items():
        if not isinstance(items, list):
            continue
        ids = [str(item.get("id")) for item in items if isinstance(item, dict)]
        duplicates = sorted({
            item_id
            for item_id in ids
            if item_id not in ("None", "") and ids.count(item_id) > 1
        })
        for duplicate in duplicates:
            issues.append({
                "table": table_name,
                "id": duplicate,
                "issue": "Doppelte id in Tabelle."
            })
    return issues


def audit_lifecycle(payload):
    issues = []
    auftraege = {item["id"]: item for item in payload.get("auftraege", [])}
    angebote = {item["id"]: item for item in payload.get("angebote", [])}
    rechnungen = {item["id"]: item for item in payload.get("rechnungen", [])}
    bestellungen = {item["id"]: item for item in payload.get("bestellungen", [])}

    for invoice in payload.get("rechnungen", []):
        invoice_id = invoice.get("id")
        invoice_type = invoice.get("rechnungstyp")
        if invoice_type == "Ausgangsrechnung" and not invoice.get("auftragId"):
            issues.append({
                "table": "rechnungen",
                "id": invoice_id,
                "issue": "Ausgangsrechnung ohne auftragId."
            })
        if invoice_type == "Eingangsrechnung" and not invoice.get("bestellungId"):
            issues.append({
                "table": "rechnungen",
                "id": invoice_id,
                "issue": "Eingangsrechnung ohne bestellungId."
            })
        if invoice.get("auftragId") in auftraege:
            auftrag = auftraege[invoice.get("auftragId")]
            if invoice.get("kundeId") not in (None, "", auftrag.get("kundeId")):
                issues.append({
                    "table": "rechnungen",
                    "id": invoice_id,
                    "issue": "kundeId der Rechnung passt nicht zum Auftrag."
                })
        if invoice.get("bestellungId") in bestellungen:
            bestellung = bestellungen[invoice.get("bestellungId")]
            if invoice.get("lieferantId") not in (None, "", bestellung.get("lieferantId")):
                issues.append({
                    "table": "rechnungen",
                    "id": invoice_id,
                    "issue": "lieferantId der Rechnung passt nicht zur Bestellung."
                })

    for payment in payload.get("zahlungen", []):
        invoice = rechnungen.get(payment.get("rechnungId"))
        if not invoice:
            continue
        is_incoming = str(payment.get("zahlungsart") or "").lower() == "eingang"
        if invoice.get("rechnungstyp") == "Ausgangsrechnung" and not is_incoming:
            issues.append({
                "table": "zahlungen",
                "id": payment.get("id"),
                "issue": "Ausgangsrechnung mit falscher Zahlungsrichtung."
            })
        if invoice.get("rechnungstyp") == "Eingangsrechnung" and is_incoming:
            issues.append({
                "table": "zahlungen",
                "id": payment.get("id"),
                "issue": "Eingangsrechnung mit falscher Zahlungsrichtung."
            })

    for order in payload.get("auftraege", []):
        angebot = angebote.get(order.get("angebotId"))
        if angebot and angebot.get("kundeId") != order.get("kundeId"):
            issues.append({
                "table": "auftraege",
                "id": order.get("id"),
                "issue": "kundeId des Auftrags passt nicht zum Angebot."
            })

    return issues


def summarize_process_maturity(payload):
    summary = {}
    summary["angebote_status"] = Counter(item.get("status", "ohne Status") for item in payload.get("angebote", []))
    summary["auftraege_status"] = Counter(item.get("status", "ohne Status") for item in payload.get("auftraege", []))
    summary["rechnungen_typ"] = Counter(item.get("rechnungstyp", "ohne Typ") for item in payload.get("rechnungen", []))
    summary["rechnungen_status"] = Counter(item.get("status", "ohne Status") for item in payload.get("rechnungen", []))
    summary["mahnungen_stufe"] = Counter(item.get("stufe", "ohne Stufe") for item in payload.get("mahnungen", []))
    summary["zahlungen_status"] = Counter(item.get("status", "ohne Status") for item in payload.get("zahlungen", []))
    summary["firmenkonto_bearbeitung"] = Counter(item.get("statusBearbeitung", "ohne Status") for item in payload.get("firmenkonto", []))
    return summary


def classify_seed_modules(payload):
    rechnungen = payload.get("rechnungen", [])
    mahnungen = payload.get("mahnungen", [])
    firmenkonto = payload.get("firmenkonto", [])
    return [
        {
            "datei": "stammdaten.json",
            "reifegrad": "stabil",
            "begruendung": "Stammdaten, Rollen und Rechte sind breit befuellt und wirken als Basismodul."
        },
        {
            "datei": "einkaufLogistik.json",
            "reifegrad": "fruehe bis mittlere Prozessphase",
            "begruendung": "Bestellungen und Positionen sind vorhanden, aber noch ohne eigenen Wareneingangstisch und ohne tiefe Kreditorenfolgestufen."
        },
        {
            "datei": "verkauf.json",
            "reifegrad": "gemischt bis spaete Prozessphase",
            "begruendung": f"Vom Angebotsentwurf bis zur gemahnten Ausgangsrechnung: {len(rechnungen)} Rechnungen und {len(mahnungen)} Mahnungen zeigen bewusst unterschiedliche Prozessstaende."
        },
        {
            "datei": "verwaltung.json",
            "reifegrad": "spaete Buchhaltungsphase",
            "begruendung": f"Firmenkonto enthaelt {len(firmenkonto)} Buchungen inklusive unbearbeiteter Zahlungseingaenge und Fristenoptionen."
        },
        {
            "datei": "fieldMetadata.json",
            "reifegrad": "technische Begleitdaten",
            "begruendung": "UI-Metadaten unterstuetzen Tabellen und Formulare, bilden aber keinen eigenen Geschaeftsprozess ab."
        }
    ]


def print_counter(title, values):
    print(title)
    for key, value in values.items():
        print(f"  - {key}: {value}")


def main():
    payload, source_files = load_payload()
    known_ids = build_known_ids(payload)
    reference_issues = audit_references(payload, known_ids)
    duplicate_issues = audit_duplicates(payload)
    lifecycle_issues = audit_lifecycle(payload)
    process_summary = summarize_process_maturity(payload)

    print("SEED-AUDIT")
    print(f"Quellordner: {ROOT}")
    print("Tabellen je Datei:")
    grouped = defaultdict(list)
    for table_name, file_name in source_files.items():
        grouped[file_name].append(table_name)
    for file_name, table_names in sorted(grouped.items()):
        print(f"  - {file_name}: {', '.join(table_names)}")

    print("\nReferenzfehler:")
    if reference_issues:
        for issue in reference_issues:
            print(f"  - {issue}")
    else:
        print("  - keine")

    print("\nID-/Duplikatfehler:")
    if duplicate_issues:
        for issue in duplicate_issues:
            print(f"  - {issue}")
    else:
        print("  - keine")

    print("\nLebenszyklus-/Prozessfehler:")
    if lifecycle_issues:
        for issue in lifecycle_issues:
            print(f"  - {issue}")
    else:
        print("  - keine")

    print("\nProzessstaende:")
    for entry in classify_seed_modules(payload):
        print(f"  - {entry['datei']}: {entry['reifegrad']} ({entry['begruendung']})")

    print("\nStatussummen:")
    for key, counter in process_summary.items():
        print_counter(key, counter)


if __name__ == "__main__":
    main()

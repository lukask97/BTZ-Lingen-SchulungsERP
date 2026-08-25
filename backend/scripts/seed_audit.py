import json
from collections import Counter, defaultdict
from datetime import date
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

SALES_DOCUMENT_ORDER = {
    "auftragsbestaetigung": 1,
    "auftragsbestätigung": 1,
    "lieferschein": 2,
    "warenbegleitpapier": 3,
    "transportpapier": 3,
    "warenempfang": 4,
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


def parse_iso_date(value):
    if value in (None, ""):
        return None
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        return None


def normalize_text(value):
    return str(value or "").strip().lower()


def collect_sales_context(payload):
    return {
        "anfragen": {item["id"]: item for item in payload.get("kundenanfragen", []) if isinstance(item, dict) and item.get("id") not in (None, "")},
        "angebote": {item["id"]: item for item in payload.get("angebote", []) if isinstance(item, dict) and item.get("id") not in (None, "")},
        "auftraege": {item["id"]: item for item in payload.get("auftraege", []) if isinstance(item, dict) and item.get("id") not in (None, "")},
        "rechnungen": {item["id"]: item for item in payload.get("rechnungen", []) if isinstance(item, dict) and item.get("id") not in (None, "")},
        "dokumente": [item for item in payload.get("vertriebsdokumente", []) if isinstance(item, dict)],
    }


def audit_process_order(payload):
    issues = []
    context = collect_sales_context(payload)
    anfragen = context["anfragen"]
    angebote = context["angebote"]
    auftraege = context["auftraege"]

    dokumente_pro_auftrag = defaultdict(list)
    for dokument in context["dokumente"]:
        if dokument.get("auftragId") not in (None, ""):
            dokumente_pro_auftrag[str(dokument.get("auftragId"))].append(dokument)

    for angebot in angebote.values():
        anfrage_id = angebot.get("anfrageId")
        if anfrage_id in (None, ""):
            continue
        anfrage = anfragen.get(anfrage_id)
        if not anfrage:
            continue
        angebot_datum = parse_iso_date(angebot.get("datum"))
        anfrage_datum = parse_iso_date(anfrage.get("datum"))
        if angebot_datum and anfrage_datum and angebot_datum < anfrage_datum:
            issues.append({
                "table": "angebote",
                "id": angebot.get("id"),
                "issue": "Angebot liegt zeitlich vor der verknuepften Kundenanfrage.",
                "details": {"angebotDatum": angebot.get("datum"), "anfrageDatum": anfrage.get("datum")}
            })

    for auftrag in auftraege.values():
        angebot_id = auftrag.get("angebotId")
        if angebot_id in (None, ""):
            continue
        angebot = angebote.get(angebot_id)
        if not angebot:
            continue
        auftrag_datum = parse_iso_date(auftrag.get("datum"))
        angebot_datum = parse_iso_date(angebot.get("datum"))
        if auftrag_datum and angebot_datum and auftrag_datum < angebot_datum:
            issues.append({
                "table": "auftraege",
                "id": auftrag.get("id"),
                "issue": "Auftrag liegt zeitlich vor dem verknuepften Angebot.",
                "details": {"auftragDatum": auftrag.get("datum"), "angebotDatum": angebot.get("datum")}
            })

    for auftrag in auftraege.values():
        auftrag_id = str(auftrag.get("id"))
        auftrag_datum = parse_iso_date(auftrag.get("datum"))
        dokumente = dokumente_pro_auftrag.get(auftrag_id, [])
        dispatch_docs = []
        goods_receipt = None
        highest_order_seen = 0

        for dokument in sorted(dokumente, key=lambda item: (item.get("datum") or "", SALES_DOCUMENT_ORDER.get(normalize_text(item.get("dokumentTyp")), 99), item.get("id") or 0)):
            dokument_typ = normalize_text(dokument.get("dokumentTyp"))
            dokument_order = SALES_DOCUMENT_ORDER.get(dokument_typ)
            dokument_datum = parse_iso_date(dokument.get("datum"))

            if dokument_datum and auftrag_datum and dokument_datum < auftrag_datum:
                issues.append({
                    "table": "vertriebsdokumente",
                    "id": dokument.get("id"),
                    "issue": "Vertriebsdokument liegt zeitlich vor dem Auftrag.",
                    "details": {"dokumentTyp": dokument.get("dokumentTyp"), "dokumentDatum": dokument.get("datum"), "auftragDatum": auftrag.get("datum")}
                })

            if dokument_order and dokument_order < highest_order_seen:
                issues.append({
                    "table": "vertriebsdokumente",
                    "id": dokument.get("id"),
                    "issue": "Dokumentreihenfolge im Auftrag ist fachlich ruecklaeufig.",
                    "details": {"dokumentTyp": dokument.get("dokumentTyp"), "auftragId": auftrag.get("id")}
                })
            if dokument_order:
                highest_order_seen = max(highest_order_seen, dokument_order)

            if dokument_typ in ("warenbegleitpapier", "transportpapier"):
                dispatch_docs.append(dokument)
            if dokument_typ == "warenempfang":
                goods_receipt = dokument

        if len(dispatch_docs) > 1:
            issues.append({
                "table": "vertriebsdokumente",
                "id": auftrag.get("id"),
                "issue": "Pro Auftrag ist nur eines von Warenbegleitpapier oder Transportpapier zulaessig.",
                "details": {"auftragId": auftrag.get("id"), "dokumentIds": [item.get("id") for item in dispatch_docs]}
            })

        for invoice in payload.get("rechnungen", []):
            if str(invoice.get("auftragId") or "") != auftrag_id:
                continue
            if normalize_text(invoice.get("rechnungstyp")) != "ausgangsrechnung":
                continue

            invoice_date = parse_iso_date(invoice.get("datum"))
            if goods_receipt is None:
                issues.append({
                    "table": "rechnungen",
                    "id": invoice.get("id"),
                    "issue": "Ausgangsrechnung ohne dokumentierten Warenempfang.",
                    "details": {"auftragId": auftrag.get("id"), "rechnungsnr": invoice.get("rechnungsnr")}
                })
                continue

            receipt_date = parse_iso_date(goods_receipt.get("annahmeAm") or goods_receipt.get("datum"))
            if invoice_date and receipt_date and invoice_date < receipt_date:
                issues.append({
                    "table": "rechnungen",
                    "id": invoice.get("id"),
                    "issue": "Ausgangsrechnung liegt zeitlich vor dem bestaetigten Warenempfang.",
                    "details": {"rechnungsDatum": invoice.get("datum"), "warenempfangAm": goods_receipt.get("annahmeAm") or goods_receipt.get("datum")}
                })

            goods_receipt_status = normalize_text(goods_receipt.get("status"))
            if goods_receipt_status not in ("entgegengenommen", "angenommen", "bestaetigt"):
                issues.append({
                    "table": "rechnungen",
                    "id": invoice.get("id"),
                    "issue": "Ausgangsrechnung ohne bestaetigten Warenempfangsstatus.",
                    "details": {"warenempfangStatus": goods_receipt.get("status"), "auftragId": auftrag.get("id")}
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
    order_issues = audit_process_order(payload)
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

    print("\nReihenfolge-/Ablauffehler:")
    if order_issues:
        for issue in order_issues:
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

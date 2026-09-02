from datetime import datetime
from zoneinfo import ZoneInfo


BERLIN = ZoneInfo("Europe/Berlin")
PROTOCOL_TABLE = "tagesversandprotokolle"


def berlin_now():
    return datetime.now(BERLIN)


def is_valid_time(value):
    try:
        datetime.strptime(str(value), "%H:%M")
        return True
    except (TypeError, ValueError):
        return False


def is_eligible(offer, today):
    if not offer.get("alsVorbereitetGespeichert") or offer.get("tagesabschlussZurueckgehalten"):
        return False, "Nicht für den Tagesversand vorgemerkt"
    if str(offer.get("gueltigBis") or "") < today:
        return False, "Gültigkeit abgelaufen"
    if str(offer.get("freigabeStatus") or "") != "freigegeben":
        return False, "Freigabe ausstehend"
    return True, ""


def run_tagesversand(store, now=None, force=False):
    now = now or berlin_now()
    today = now.date().isoformat()

    def execute(cursor):
        options = (store.list_in_transaction(cursor, "fristenOptionen") or [{}])[0]
        scheduled_time = str(options.get("angeboteTagesabschlussUhrzeit") or "16:00")
        active = bool(options.get("angeboteTagesabschlussAktiv"))
        if not active and not force:
            return {"ok": False, "reason": "Tagesversand ist deaktiviert.", "protocol": None}
        if not is_valid_time(scheduled_time):
            scheduled_time = "16:00"
        if now.weekday() >= 5 and not force:
            return {"ok": False, "reason": "Am Wochenende findet kein Tagesversand statt.", "protocol": None}
        if now.strftime("%H:%M") < scheduled_time and not force:
            return {"ok": False, "reason": "Der geplante Versandzeitpunkt ist noch nicht erreicht.", "protocol": None}

        protocols = store.list_in_transaction(cursor, PROTOCOL_TABLE)
        existing = next((item for item in protocols if item.get("versandDatum") == today and item.get("status") == "abgeschlossen"), None)
        if existing:
            return {"ok": True, "alreadyRun": True, "protocol": existing}

        offers = store.list_in_transaction(cursor, "angebote")
        inquiries = {str(item.get("id")): item for item in store.list_in_transaction(cursor, "kundenanfragen")}
        messages = store.list_in_transaction(cursor, "nachrichten")
        next_message_id = max((int(item.get("id") or 0) for item in messages), default=0) + 1
        sent = []
        skipped = []

        for offer in offers:
            eligible, reason = is_eligible(offer, today)
            if not eligible:
                if offer.get("alsVorbereitetGespeichert") and reason == "Gültigkeit abgelaufen":
                    store.save_in_transaction(cursor, "angebote", offer["id"], {
                        **offer,
                        "tagesabschlussZurueckgehalten": True,
                        "tagesabschlussHinweis": reason,
                        "tagesabschlussUebersprungenAm": now.isoformat()
                    })
                    skipped.append({"angebotId": offer["id"], "angebotsNr": offer.get("angebotsNr"), "grund": f"{reason}; automatisch zurückgestellt"})
                elif offer.get("alsVorbereitetGespeichert") and reason == "Freigabe ausstehend":
                    skipped.append({"angebotId": offer["id"], "angebotsNr": offer.get("angebotsNr"), "grund": reason})
                continue

            inquiry = inquiries.get(str(offer.get("anfrageId") or ""), {})
            updated_offer = {
                **offer,
                "status": "wartet auf Antwort",
                "freigabeStatus": "freigegeben",
                "direktSendenGewuenscht": True,
                "alsVorbereitetGespeichert": False,
                "tagesabschlussZurueckgehalten": False,
                "tagesabschlussVersendetAm": now.isoformat(),
                "tagesabschlussHinweis": "Automatischer Tagesversand"
            }
            store.save_in_transaction(cursor, "angebote", offer["id"], updated_offer)
            message = {
                "id": next_message_id,
                "vorgangId": offer.get("vorgangId") or inquiry.get("vorgangId") or f"angebot-{offer['id']}",
                "anfrageId": offer.get("anfrageId") or "",
                "angebotId": offer["id"],
                "kundeId": offer.get("kundeId") or inquiry.get("kundeId") or "",
                "datum": today,
                "zeitpunkt": now.isoformat(),
                "senderRolle": "Verkauf",
                "senderName": "System (Automatischer Tagesversand)",
                "kanal": inquiry.get("kanal") or "E-Mail",
                "betreff": f"Angebot {offer.get('angebotsNr')}",
                "nachricht": f"Wir senden Ihnen das Angebot {offer.get('angebotsNr')} zur Prüfung zu.",
                "typ": "Angebot"
            }
            store.save_in_transaction(cursor, "nachrichten", next_message_id, message)
            next_message_id += 1
            sent.append({"angebotId": offer["id"], "angebotsNr": offer.get("angebotsNr")})

        protocol = {
            "id": f"{today}-{scheduled_time}",
            "versandDatum": today,
            "geplanteUhrzeit": scheduled_time,
            "ausgefuehrtAm": now.isoformat(),
            "ausgefuehrtVon": "System",
            "status": "abgeschlossen",
            "versendet": sent,
            "uebersprungen": skipped
        }
        store.save_in_transaction(cursor, PROTOCOL_TABLE, protocol["id"], protocol)
        return {"ok": True, "alreadyRun": False, "protocol": protocol}

    return store.transaction(execute)

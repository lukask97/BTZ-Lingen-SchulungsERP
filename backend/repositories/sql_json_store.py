import json
import time
from datetime import date, datetime, time as time_value
from pathlib import Path

import psycopg2
from psycopg2.extras import Json, RealDictCursor


JSON_TABLES = {
    "benutzerSpalten",
    "feldMetadaten",
    "fristenOptionen",
    "lehrkraftOptionen",
    "nummernkreise",
    "unternehmen",
}

RELATIONAL_LOAD_ORDER = [
    "kunden",
    "lieferanten",
    "kategorien",
    "artikel",
    "artikelStueckliste",
    "services",
    "lager",
    "abteilungen",
    "mitarbeiter",
    "schulungen",
    "bewerber",
    "rollen",
    "rechte",
    "rollenRechte",
    "benutzer",
    "kundenanfragen",
    "angebote",
    "auftraege",
    "angebotspositionen",
    "auftragspositionen",
    "bestellungen",
    "bestellpositionen",
    "einkaufsdokumente",
    "rechnungen",
    "vertriebsdokumente",
    "nachrichten",
    "zahlungen",
    "mahnungen",
    "belege",
    "firmenkonto",
    "reklamationen",
    "retouren",
    "versandauftraege",
    "freigaben",
    "berichte",
    "marketingaktionen",
    "arbeitszeiten",
    "urlaubsantraege",
    "krankmeldungen",
    "personalakten",
]

DEFERRED_REFERENCE_FIELDS = {
    "kategorien": {"parentId"},
    "kundenanfragen": {"angebotId", "auftragId"},
    "angebote": {"anfrageId"},
    "auftraege": {"anfrageId", "angebotId"},
    "vertriebsdokumente": {"angebotId", "anfrageId"},
    "nachrichten": {"anfrageId", "angebotId", "auftragId"},
    "freigaben": {"angebotId"},
    "zahlungen": {"rechnungId"},
    "mahnungen": {"rechnungId"},
    "belege": {"rechnungId"},
}

SKIP_DEFERRED_REFERENCE_RESTORE = {
    "zahlungen",
    "mahnungen",
    "belege",
}

RELATIONAL_TABLES = {
    "angebote": {
        "qualified_name": "verkauf.angebote",
        "columns": {
            "id": "id",
            "vorgangId": "vorgang_id",
            "angebotsNr": "angebots_nr",
            "angebotsBasisNr": "angebots_basis_nr",
            "revision": "revision",
            "anfrageId": "anfrage_id",
            "kundeId": "kunde_id",
            "datum": "datum",
            "gueltigBis": "gueltig_bis",
            "status": "status",
            "rabattBetrag": "rabatt_betrag",
            "verguenstigungsGrund": "verguenstigungsgrund",
            "gesamtbetrag": "gesamtbetrag",
            "preispositionen": "preispositionen",
        },
        "json_columns": {"preispositionen"},
        "defaults": {"preispositionen": []},
        "order_by": "id asc",
    },
    "angebotspositionen": {
        "qualified_name": "verkauf.angebotspositionen",
        "columns": {
            "id": "id",
            "angebotId": "angebot_id",
            "artikelId": "artikel_id",
            "serviceId": "service_id",
            "bezeichnung": "bezeichnung",
            "leistungTyp": "positions_typ",
            "menge": "menge",
            "einzelpreis": "einzelpreis",
        },
        "order_by": "id asc",
    },
    "artikel": {
        "qualified_name": "waren.artikel",
        "columns": {
            "id": "id",
            "artikelNr": "artikel_nr",
            "name": "name",
            "kategorieId": "kategorie_id",
            "kategorie": "kategorie",
            "kategoriePfad": "kategorie_pfad",
            "artikelTyp": "artikel_typ",
            "einkaufspreis": "einkaufspreis",
            "verkaufspreis": "verkaufspreis",
            "bestand": "bestand",
            "mindestmenge": "mindestmenge",
            "bedarfsmeldungBei": "bedarfsmeldung_bei",
            "beschreibung": "beschreibung",
            "komponenten": "komponenten",
        },
        "json_columns": {"komponenten"},
        "order_by": "id asc",
    },
    "kategorien": {
        "qualified_name": "waren.kategorien",
        "columns": {
            "id": "id",
            "name": "name",
            "parentId": "parent_id",
            "beschreibung": "beschreibung",
        },
        "order_by": "id asc",
    },
    "artikelStueckliste": {
        "qualified_name": "waren.artikel_stueckliste",
        "columns": {
            "id": "id",
            "hauptartikelId": "hauptartikel_id",
            "komponentenartikelId": "komponentenartikel_id",
            "menge": "menge",
        },
        "order_by": "id asc",
    },
    "auftraege": {
        "qualified_name": "verkauf.auftraege",
        "columns": {
            "id": "id",
            "auftragNr": "auftrag_nr",
            "kundeId": "kunde_id",
            "anfrageId": "anfrage_id",
            "angebotId": "angebot_id",
            "vorgangId": "vorgang_id",
            "datum": "datum",
            "status": "status",
            "faelligAm": "faellig_am",
            "notiz": "notiz",
            "rabattBetrag": "rabatt_betrag",
            "verguenstigungsGrund": "verguenstigungsgrund",
            "gesamtbetrag": "gesamtbetrag",
        },
        "order_by": "id asc",
    },
    "auftragspositionen": {
        "qualified_name": "verkauf.auftragspositionen",
        "columns": {
            "id": "id",
            "auftragId": "auftrag_id",
            "artikelId": "artikel_id",
            "serviceId": "service_id",
            "bezeichnung": "bezeichnung",
            "leistungTyp": "positions_typ",
            "menge": "menge",
            "einzelpreis": "einzelpreis",
        },
        "order_by": "id asc",
    },
    "benutzer": {
        "qualified_name": "verwaltung.benutzer",
        "columns": {
            "id": "id",
            "vorname": "vorname",
            "nachname": "nachname",
            "username": "username",
            "email": "email",
            "password": "password_plain",
            "passwordHash": "password_hash",
            "rolle": "rolle",
            "permissions": "permissions",
            "aktiv": "aktiv",
        },
        "json_columns": {"permissions"},
        "defaults": {
            "permissions": [],
            "aktiv": True,
        },
        "order_by": "id asc",
    },
    "bestellungen": {
        "qualified_name": "einkauf.bestellungen",
        "columns": {
            "id": "id",
            "bestellNr": "bestell_nr",
            "lieferantId": "lieferant_id",
            "datum": "datum",
            "status": "status",
            "wareneingangAm": "wareneingang_am",
            "notiz": "notiz",
            "anfrageQuelle": "anfrage_quelle",
            "bedarfsmeldungId": "bedarfsmeldung_id",
            "rechnungStatus": "rechnung_status",
            "faelligAm": "faellig_am",
            "anfrageNotiz": "anfrage_notiz",
            "versendetAm": "versendet_am",
            "lehrkraftAngebotAm": "lehrkraft_angebot_am",
            "lehrkraftAngebotPreis": "lehrkraft_angebot_preis",
            "lehrkraftLieferzeitTage": "lehrkraft_lieferzeit_tage",
            "lehrkraftAngebotText": "lehrkraft_angebot_text",
        },
        "order_by": "id asc",
    },
    "bestellpositionen": {
        "qualified_name": "einkauf.bestellpositionen",
        "columns": {
            "id": "id",
            "bestellungId": "bestellung_id",
            "artikelId": "artikel_id",
            "bezeichnung": "bezeichnung",
            "menge": "menge",
            "einzelpreis": "einstandspreis",
        },
        "order_by": "id asc",
    },
    "kunden": {
        "qualified_name": "kunden.kunden",
        "columns": {
            "id": "id",
            "kundenNr": "kunden_nr",
            "firma": "firma",
            "anschrift": "anschrift",
            "plz": "plz",
            "ort": "ort",
            "segment": "segment",
            "abc": "abc",
            "iban": "iban",
            "website": "website",
            "optionen": "optionen",
            "notiz": "notiz",
        },
        "json_columns": {"optionen"},
        "defaults": {"optionen": []},
        "order_by": "id asc",
    },
    "kundenanfragen": {
        "qualified_name": "verkauf.kundenanfragen",
        "columns": {
            "id": "id",
            "vorgangId": "vorgang_id",
            "typ": "typ",
            "kundeId": "kunde_id",
            "kanal": "kanal",
            "status": "status",
            "datum": "datum",
            "anliegen": "anliegen",
            "angebotId": "angebot_id",
            "auftragId": "auftrag_id",
            "antwort": "antwort",
            "beantwortetAm": "beantwortet_am",
        },
        "order_by": "id asc",
    },
    "nachrichten": {
        "qualified_name": "verkauf.nachrichten",
        "columns": {
            "id": "id",
            "vorgangId": "vorgang_id",
            "anfrageId": "anfrage_id",
            "angebotId": "angebot_id",
            "auftragId": "auftrag_id",
            "datum": "datum",
            "zeitpunkt": "zeitpunkt",
            "senderRolle": "sender_rolle",
            "senderName": "sender_name",
            "kanal": "kanal",
            "betreff": "betreff",
            "nachricht": "nachricht",
            "typ": "typ",
        },
        "order_by": "zeitpunkt asc, id asc",
    },
    "lager": {
        "qualified_name": "waren.lager",
        "columns": {
            "id": "id",
            "name": "name",
            "standort": "standort",
            "kapazitaet": "kapazitaet",
        },
        "order_by": "id asc",
    },
    "lieferanten": {
        "qualified_name": "lieferanten.lieferanten",
        "columns": {
            "id": "id",
            "lieferantenNr": "lieferanten_nr",
            "firma": "firma",
            "anschrift": "anschrift",
            "plz": "plz",
            "ort": "ort",
            "segment": "segment",
            "iban": "iban",
            "fuerBts": "notiz",
            "bewertung": "bewertung",
            "favorit": "favorit",
            "abc": "abc",
        },
        "defaults": {"favorit": False},
        "order_by": "id asc",
    },
    "rechte": {
        "qualified_name": "verwaltung.rechte",
        "columns": {
            "id": "id",
            "name": "name",
            "beschreibung": "beschreibung",
        },
        "order_by": "id asc",
    },
    "abteilungen": {
        "qualified_name": "organisation.abteilungen",
        "columns": {
            "id": "id",
            "kuerzel": "kuerzel",
            "name": "name",
            "zuordnung": "zuordnung",
            "aufgaben": "aufgaben",
        },
        "json_columns": {"aufgaben"},
        "defaults": {"aufgaben": []},
        "order_by": "id asc",
    },
    "berichte": {
        "qualified_name": "organisation.berichte",
        "columns": {
            "id": "id",
            "titel": "titel",
            "bereich": "bereich",
            "datum": "datum",
            "status": "status",
            "zusammenfassung": "zusammenfassung",
            "zielgruppe": "zielgruppe",
            "empfohlenAktion": "empfohlen_aktion",
            "startdatum": "startdatum",
            "enddatum": "enddatum",
            "intervall": "intervall",
        },
        "order_by": "id asc",
    },
    "bewerber": {
        "qualified_name": "personal.bewerber",
        "columns": {
            "id": "id",
            "name": "name",
            "stelle": "stelle",
            "datum": "datum",
            "status": "status",
            "notiz": "notiz",
            "mitarbeiterId": "mitarbeiter_id",
        },
        "order_by": "id asc",
    },
    "freigaben": {
        "qualified_name": "organisation.freigaben",
        "columns": {
            "id": "id",
            "titel": "titel",
            "bereich": "bereich",
            "status": "status",
            "verantwortung": "verantwortung",
            "datum": "datum",
            "bezug": "bezug",
            "notiz": "notiz",
            "angebotId": "angebot_id",
        },
        "order_by": "id asc",
    },
    "marketingaktionen": {
        "qualified_name": "organisation.marketingaktionen",
        "columns": {
            "id": "id",
            "typ": "typ",
            "titel": "titel",
            "datum": "datum",
            "status": "status",
            "beschreibung": "beschreibung",
        },
        "order_by": "id asc",
    },
    "mitarbeiter": {
        "qualified_name": "personal.mitarbeiter",
        "columns": {
            "id": "id",
            "name": "name",
            "abteilung": "abteilung",
            "rolle": "rolle",
            "eintritt": "eintritt",
            "status": "status",
        },
        "order_by": "id asc",
    },
    "reklamationen": {
        "qualified_name": "verkauf.reklamationen",
        "columns": {
            "id": "id",
            "reklamationsNr": "reklamations_nr",
            "kundeId": "kunde_id",
            "auftragId": "auftrag_id",
            "datum": "datum",
            "beschreibung": "beschreibung",
            "status": "status",
        },
        "order_by": "id asc",
    },
    "rollen": {
        "qualified_name": "verwaltung.rollen",
        "columns": {
            "id": "id",
            "name": "name",
            "beschreibung": "beschreibung",
            "permissions": "permissions",
        },
        "json_columns": {"permissions"},
        "defaults": {"permissions": []},
        "order_by": "id asc",
    },
    "rollenRechte": {
        "qualified_name": "verwaltung.rollen_rechte",
        "columns": {
            "id": "id",
            "rolleId": "rolle_id",
            "rechtId": "recht_id",
        },
        "order_by": "id asc",
    },
    "services": {
        "qualified_name": "waren.services",
        "columns": {
            "id": "id",
            "serviceNr": "service_nr",
            "name": "name",
            "kategorie": "kategorie",
            "berechnungstyp": "berechnungstyp",
            "zeEinheit": "ze_einheit",
            "einkaufspreis": "einkaufspreis",
            "verkaufspreis": "verkaufspreis",
            "beschreibung": "beschreibung",
        },
        "order_by": "id asc",
    },
    "retouren": {
        "qualified_name": "verkauf.retouren",
        "columns": {
            "id": "id",
            "retourenNr": "retouren_nr",
            "kundeId": "kunde_id",
            "artikelId": "artikel_id",
            "datum": "datum",
            "status": "status",
            "grund": "grund",
        },
        "order_by": "id asc",
    },
    "arbeitszeiten": {
        "qualified_name": "personal.arbeitszeiten",
        "columns": {
            "id": "id",
            "mitarbeiterId": "mitarbeiter_id",
            "datum": "datum",
            "von": "von_uhrzeit",
            "bis": "bis_uhrzeit",
            "status": "status",
        },
        "order_by": "id asc",
    },
    "krankmeldungen": {
        "qualified_name": "personal.krankmeldungen",
        "columns": {
            "id": "id",
            "mitarbeiterId": "mitarbeiter_id",
            "von": "von",
            "bis": "bis",
            "grund": "grund",
            "status": "status",
        },
        "order_by": "id asc",
    },
    "personalakten": {
        "qualified_name": "personal.personalakten",
        "columns": {
            "id": "id",
            "mitarbeiterId": "mitarbeiter_id",
            "dokumentTyp": "dokument_typ",
            "titel": "titel",
            "datum": "datum",
            "status": "status",
            "notiz": "notiz",
        },
        "order_by": "id asc",
    },
    "schulungen": {
        "qualified_name": "personal.schulungen",
        "columns": {
            "id": "id",
            "titel": "titel",
            "zielgruppe": "zielgruppe",
            "datum": "datum",
            "status": "status",
            "ort": "ort",
        },
        "order_by": "id asc",
    },
    "urlaubsantraege": {
        "qualified_name": "personal.urlaubsantraege",
        "columns": {
            "id": "id",
            "mitarbeiterId": "mitarbeiter_id",
            "von": "von",
            "bis": "bis",
            "tage": "tage",
            "status": "status",
        },
        "order_by": "id asc",
    },
    "versandauftraege": {
        "qualified_name": "verkauf.versandauftraege",
        "columns": {
            "id": "id",
            "versandNr": "versand_nr",
            "auftragId": "auftrag_id",
            "datum": "datum",
            "status": "status",
            "transport": "transport",
            "liefertermin": "liefertermin",
        },
        "order_by": "id asc",
    },
    "vertriebsdokumente": {
        "qualified_name": "verkauf.vertriebsdokumente",
        "columns": {
            "id": "id",
            "auftragId": "auftrag_id",
            "angebotId": "angebot_id",
            "anfrageId": "anfrage_id",
            "vorgangId": "vorgang_id",
            "kundeId": "kunde_id",
            "dokumentTyp": "dokument_typ",
            "dokumentNr": "dokument_nr",
            "titel": "titel",
            "datum": "datum",
            "status": "status",
            "versendetAm": "versendet_am",
            "annahmeAm": "annahme_am",
            "notiz": "notiz",
        },
        "order_by": "id asc",
    },
    "einkaufsdokumente": {
        "qualified_name": "einkauf.einkaufsdokumente",
        "columns": {
            "id": "id",
            "bestellungId": "bestellung_id",
            "lieferantId": "lieferant_id",
            "dokumentTyp": "dokument_typ",
            "titel": "titel",
            "datum": "datum",
            "status": "status",
            "versendetAm": "versendet_am",
            "notiz": "notiz",
        },
        "order_by": "id asc",
    },
    "rechnungen": {
        "qualified_name": "buchhaltung.rechnungen",
        "columns": {
            "id": "id",
            "rechnungsnr": "rechnungs_nr",
            "rechnungstyp": "rechnungstyp",
            "auftragId": "auftrag_id",
            "bestellungId": "bestellung_id",
            "kundeId": "kunde_id",
            "lieferantId": "lieferant_id",
            "datum": "datum",
            "faelligAm": "faellig_am",
            "betrag": "betrag",
            "status": "status",
        },
        "order_by": "id asc",
    },
    "zahlungen": {
        "qualified_name": "buchhaltung.zahlungen",
        "columns": {
            "id": "id",
            "rechnungId": "rechnung_id",
            "auftragId": "auftrag_id",
            "bestellungId": "bestellung_id",
            "zahlungsart": "zahlungsart",
            "name": "name",
            "iban": "iban",
            "datum": "datum",
            "ausfuehrenAm": "ausfuehren_am",
            "ausfuehrungsdatum": "ausfuehrungsdatum",
            "betrag": "betrag",
            "verwendungszweck": "verwendungszweck",
            "methode": "methode",
            "status": "status",
        },
        "order_by": "id asc",
    },
    "mahnungen": {
        "qualified_name": "buchhaltung.mahnungen",
        "columns": {
            "id": "id",
            "rechnungId": "rechnung_id",
            "datum": "datum",
            "status": "status",
            "stufe": "stufe",
            "notiz": "notiz",
        },
        "order_by": "id asc",
    },
    "belege": {
        "qualified_name": "buchhaltung.belege",
        "columns": {
            "id": "id",
            "typ": "beleg_typ",
            "bezugTyp": "bezug_typ",
            "bezugId": "bezug_id",
            "rechnungId": "rechnung_id",
            "datum": "datum",
            "status": "status",
            "beschreibung": "beschreibung",
        },
        "order_by": "id asc",
    },
    "firmenkonto": {
        "qualified_name": "buchhaltung.firmenkonto",
        "columns": {
            "id": "id",
            "datum": "datum",
            "konto": "konto",
            "betreff": "betreff",
            "info": "info",
            "soll": "soll",
            "haben": "haben",
            "saldo": "saldo",
        },
        "order_by": "id asc",
    },
}


class SqlJsonStore:
    def __init__(self, dsn):
        self.dsn = dsn
        self.seed_path = Path(__file__).resolve().parent.parent / "seed" / "mock_seed.json"
        self.seed_data = self._load_seed_data()
        self._bootstrap()

    def list_tables(self):
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute("select distinct table_name from app_records order by table_name")
            json_tables = [row[0] for row in cursor.fetchall()]

        known_tables = set(self.seed_data.keys()) | set(json_tables) | set(RELATIONAL_TABLES.keys()) | set(JSON_TABLES)
        return sorted(known_tables)

    def table_exists(self, table_name):
        return table_name in self.seed_data or table_name in RELATIONAL_TABLES or table_name in JSON_TABLES or table_name in self.list_tables()

    def list(self, table_name):
        self._require_table(table_name)
        if table_name in RELATIONAL_TABLES:
            return self._list_relational(table_name)
        return self._list_json_records(table_name)

    def get(self, table_name, entity_id):
        self._require_table(table_name)
        if table_name in RELATIONAL_TABLES:
            return self._get_relational(table_name, entity_id)
        return self._get_json_record(table_name, entity_id)

    def create(self, table_name, payload):
        self._require_table(table_name)
        if table_name in RELATIONAL_TABLES:
            return self._create_relational(table_name, payload)

        entity_id = payload.get("id") or self._next_json_id(table_name)
        item = {**payload, "id": entity_id}
        with self._connect() as connection, connection.cursor() as cursor:
            self._save_json_record(cursor, table_name, entity_id, item)
            connection.commit()
        return item

    def update(self, table_name, entity_id, payload):
        self._require_table(table_name)
        if table_name in RELATIONAL_TABLES:
            return self._update_relational(table_name, entity_id, payload)

        current = self._get_json_record(table_name, entity_id)
        if not current:
            return None

        updated = {**current, **payload, "id": current.get("id")}
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                update app_records
                set data = %s,
                    updated_at = now()
                where table_name = %s and entity_id = %s
                """,
                (Json(updated), table_name, str(entity_id))
            )
            connection.commit()
        return updated

    def delete(self, table_name, entity_id):
        self._require_table(table_name)
        if table_name in RELATIONAL_TABLES:
            definition = RELATIONAL_TABLES[table_name]
            with self._connect() as connection, connection.cursor() as cursor:
                cursor.execute(
                    f"delete from {definition['qualified_name']} where id = %s",
                    (entity_id,)
                )
                deleted = cursor.rowcount > 0
                connection.commit()
                return deleted

        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                "delete from app_records where table_name = %s and entity_id = %s",
                (table_name, str(entity_id))
            )
            deleted = cursor.rowcount > 0
            connection.commit()
            return deleted

    def get_meta(self, table_name):
        self._require_table(table_name)
        if table_name in RELATIONAL_TABLES:
            definition = RELATIONAL_TABLES[table_name]
            with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(f"select count(*) as count from {definition['qualified_name']}")
                row = cursor.fetchone() or {}
            return {
                "name": table_name,
                "count": row.get("count", 0),
                "updatedAt": None,
                "provider": "postgres-relational",
            }

        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                select count(*) as count, max(updated_at) as updated_at
                from app_records
                where table_name = %s
                """,
                (table_name,)
            )
            row = cursor.fetchone() or {}
        return {
            "name": table_name,
            "count": row.get("count", 0),
            "updatedAt": row.get("updated_at").isoformat() if row.get("updated_at") else None,
            "provider": "postgres-json",
        }

    def reset(self):
        self.seed_data = self._load_seed_data()
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute("truncate table app_records")
            for table_name in RELATIONAL_TABLES:
                cursor.execute(f"truncate table {RELATIONAL_TABLES[table_name]['qualified_name']} restart identity cascade")
            self._insert_seed_records(cursor)
            connection.commit()

    def export_backup(self):
        return {
            "format": "btz-erp-backup-v1",
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "tables": {
                table_name: self.list(table_name)
                for table_name in self.list_tables()
            }
        }

    def restore_backup(self, backup_payload):
        tables = backup_payload.get("tables") or {}
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute("truncate table app_records")
            for table_name in RELATIONAL_TABLES:
                cursor.execute(f"truncate table {RELATIONAL_TABLES[table_name]['qualified_name']} restart identity cascade")

            relational_items = {}
            for table_name, items in tables.items():
                if table_name in RELATIONAL_TABLES:
                    relational_items[table_name] = items or []
                else:
                    for item in items or []:
                        entity_id = item.get("id")
                        if entity_id is None:
                            continue
                        self._save_json_record(cursor, table_name, entity_id, item)
            self._seed_relational_tables(cursor, relational_items)
            connection.commit()

    def _bootstrap(self):
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                create table if not exists app_records (
                    table_name text not null,
                    entity_id text not null,
                    sort_id bigint not null default 0,
                    data jsonb not null,
                    created_at timestamptz not null default now(),
                    updated_at timestamptz not null default now(),
                    primary key (table_name, entity_id)
                )
                """
            )
            cursor.execute("select exists(select 1 from app_records)")
            has_json_data = cursor.fetchone()[0]
            has_relational_data = any(self._table_has_rows(cursor, table_name) for table_name in RELATIONAL_TABLES)
            if not has_json_data and not has_relational_data:
                self._insert_seed_records(cursor)
            else:
                self._migrate_legacy_json_tables(cursor)
            connection.commit()

    def _table_has_rows(self, cursor, table_name):
        definition = RELATIONAL_TABLES[table_name]
        cursor.execute(f"select exists(select 1 from {definition['qualified_name']})")
        return cursor.fetchone()[0]

    def _migrate_legacy_json_tables(self, cursor):
        self._seed_missing_json_tables(cursor)

        relational_items = {}
        for table_name in RELATIONAL_LOAD_ORDER:
            if self._table_has_rows(cursor, table_name):
                continue

            legacy_items = self._load_legacy_json_records(cursor, table_name)
            if legacy_items:
                relational_items[table_name] = legacy_items
                continue

            seed_items = self.seed_data.get(table_name) or []
            relational_items[table_name] = seed_items

        self._seed_relational_tables(cursor, relational_items)

    def _seed_missing_json_tables(self, cursor):
        for table_name, items in self.seed_data.items():
            if table_name in RELATIONAL_TABLES:
                continue
            if self._json_table_has_rows(cursor, table_name):
                continue
            for item in items or []:
                entity_id = item.get("id")
                if entity_id is None:
                    continue
                self._save_json_record(cursor, table_name, entity_id, item)

    def _json_table_has_rows(self, cursor, table_name):
        cursor.execute(
            """
            select exists(
                select 1
                from app_records
                where table_name = %s
            )
            """,
            (table_name,)
        )
        return cursor.fetchone()[0]

    def _load_legacy_json_records(self, cursor, table_name):
        cursor.execute(
            """
            select data
            from app_records
            where table_name = %s
            order by sort_id asc, entity_id asc
            """,
            (table_name,)
        )
        return [row[0] for row in cursor.fetchall()]

    def _load_seed_data(self):
        if not self.seed_path.exists():
            return {}
        return json.loads(self.seed_path.read_text(encoding="utf-8"))

    def _insert_seed_records(self, cursor):
        relational_items = {}
        for table_name, items in self.seed_data.items():
            if table_name in RELATIONAL_TABLES:
                relational_items[table_name] = items
                continue
            for item in items:
                self._insert_json_record(cursor, table_name, item.get("id"), item)
        self._seed_relational_tables(cursor, relational_items)

    def _seed_relational_tables(self, cursor, relational_items):
        ordered_tables = [table_name for table_name in RELATIONAL_LOAD_ORDER if table_name in relational_items]
        remaining_tables = [table_name for table_name in relational_items if table_name not in ordered_tables]
        for table_name in ordered_tables + remaining_tables:
            if table_name == "rechnungen" and not (relational_items.get(table_name) or []):
                relational_items[table_name] = self._build_invoice_rows(cursor)
            for item in relational_items.get(table_name) or []:
                self._insert_relational(cursor, table_name, item, defer_references=True)

        for table_name in ordered_tables + remaining_tables:
            deferred_fields = DEFERRED_REFERENCE_FIELDS.get(table_name)
            if not deferred_fields:
                continue
            if table_name in SKIP_DEFERRED_REFERENCE_RESTORE:
                continue
            for item in relational_items.get(table_name) or []:
                entity_id = item.get("id")
                if entity_id is None:
                    continue
                payload = {
                    field_name: item.get(field_name)
                    for field_name in deferred_fields
                    if field_name in item
                }
                if payload:
                    self._update_relational_with_cursor(cursor, table_name, entity_id, payload)

        for table_name in ordered_tables + remaining_tables:
            self._sync_relational_identity_sequence(cursor, table_name)

    def _insert_json_record(self, cursor, table_name, entity_id, item):
        cursor.execute(
            """
            insert into app_records (table_name, entity_id, sort_id, data)
            values (%s, %s, %s, %s)
            """,
            (table_name, str(entity_id), self._sort_id(entity_id), Json(item))
        )

    def _save_json_record(self, cursor, table_name, entity_id, item):
        cursor.execute(
            """
            insert into app_records (table_name, entity_id, sort_id, data)
            values (%s, %s, %s, %s)
            on conflict (table_name, entity_id)
            do update set
                sort_id = excluded.sort_id,
                data = excluded.data,
                updated_at = now()
            """,
            (table_name, str(entity_id), self._sort_id(entity_id), Json(item))
        )

    def _list_json_records(self, table_name):
        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                select data
                from app_records
                where table_name = %s
                order by sort_id asc, entity_id asc
                """,
                (table_name,)
            )
            return [row["data"] for row in cursor.fetchall()]

    def _get_json_record(self, table_name, entity_id):
        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "select data from app_records where table_name = %s and entity_id = %s",
                (table_name, str(entity_id))
            )
            row = cursor.fetchone()
            return row["data"] if row else None

    def _next_json_id(self, table_name):
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                "select coalesce(max(sort_id), 0) + 1 from app_records where table_name = %s",
                (table_name,)
            )
            return cursor.fetchone()[0]

    def _list_relational(self, table_name):
        definition = RELATIONAL_TABLES[table_name]
        select_clause = ", ".join(
            f"{column_name} as \"{field_name}\""
            for field_name, column_name in definition["columns"].items()
        )
        query = f"select {select_clause} from {definition['qualified_name']} order by {definition.get('order_by', 'id asc')}"
        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query)
            return [self._normalize_relational_row(table_name, row) for row in cursor.fetchall()]

    def _get_relational(self, table_name, entity_id):
        definition = RELATIONAL_TABLES[table_name]
        select_clause = ", ".join(
            f"{column_name} as \"{field_name}\""
            for field_name, column_name in definition["columns"].items()
        )
        query = f"select {select_clause} from {definition['qualified_name']} where id = %s"
        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (entity_id,))
            row = cursor.fetchone()
            return self._normalize_relational_row(table_name, row) if row else None

    def _get_relational_with_cursor(self, cursor, table_name, entity_id):
        definition = RELATIONAL_TABLES[table_name]
        select_clause = ", ".join(
            f"{column_name} as \"{field_name}\""
            for field_name, column_name in definition["columns"].items()
        )
        query = f"select {select_clause} from {definition['qualified_name']} where id = %s"
        cursor.execute(query, (entity_id,))
        row = cursor.fetchone()
        return self._normalize_relational_row(table_name, row) if row else None

    def _create_relational(self, table_name, payload):
        payload = {
            key: value
            for key, value in dict(payload).items()
            if key != "id"
        }
        with self._connect() as connection, connection.cursor(cursor_factory=RealDictCursor) as cursor:
            self._sync_relational_identity_sequence(cursor, table_name)
            item = self._insert_relational(cursor, table_name, payload)
            connection.commit()
            return item

    def _update_relational(self, table_name, entity_id, payload):
        current = self._get_relational(table_name, entity_id)
        if not current:
            return None
        with self._connect() as connection, connection.cursor() as cursor:
            self._update_relational_with_cursor(cursor, table_name, entity_id, payload, current=current)
            connection.commit()
        return self._get_relational(table_name, entity_id)

    def _update_relational_with_cursor(self, cursor, table_name, entity_id, payload, current=None):
        current = current or self._get_relational_with_cursor(cursor, table_name, entity_id)
        if not current:
            return None
        next_item = {**current, **payload, "id": current.get("id")}
        definition = RELATIONAL_TABLES[table_name]
        fields = [field for field in definition["columns"] if field != "id"]
        assignments = ", ".join(f"{definition['columns'][field]} = %s" for field in fields)
        values = [self._serialize_field(table_name, field, next_item.get(field)) for field in fields]
        values.append(entity_id)
        cursor.execute(
            f"update {definition['qualified_name']} set {assignments} where id = %s",
            tuple(values)
        )
        return next_item

    def _insert_relational(self, cursor, table_name, item, defer_references=False):
        definition = RELATIONAL_TABLES[table_name]
        prepared_item = self._prepare_relational_payload(table_name, item, defer_references=defer_references, cursor=cursor)
        normalized_item = {}
        for field_name in definition["columns"]:
            if field_name == "id":
                continue
            if field_name in prepared_item:
                normalized_item[field_name] = prepared_item.get(field_name)
            elif field_name in definition.get("defaults", {}):
                normalized_item[field_name] = definition["defaults"][field_name]

        fields = list(normalized_item.keys())
        if prepared_item.get("id") is not None:
            fields = ["id", *fields]
            normalized_item = {"id": prepared_item.get("id"), **normalized_item}

        columns = [definition["columns"][field_name] for field_name in fields]
        placeholders = ", ".join(["%s"] * len(fields))
        values = [self._serialize_field(table_name, field_name, normalized_item.get(field_name)) for field_name in fields]

        cursor.execute(
            f"insert into {definition['qualified_name']} ({', '.join(columns)}) values ({placeholders}) returning id",
            tuple(values)
        )
        inserted_row = cursor.fetchone()
        inserted_id = inserted_row["id"] if isinstance(inserted_row, dict) else inserted_row[0]
        return self._get_relational_with_cursor(cursor, table_name, inserted_id)

    def _sync_relational_identity_sequence(self, cursor, table_name):
        definition = RELATIONAL_TABLES[table_name]
        cursor.execute(
            f"""
            select setval(
                pg_get_serial_sequence(%s, 'id'),
                coalesce((select max(id) from {definition['qualified_name']}), 1),
                coalesce((select max(id) from {definition['qualified_name']}), null) is not null
            )
            """,
            (definition["qualified_name"],)
        )

    def _serialize_field(self, table_name, field_name, value):
        json_columns = RELATIONAL_TABLES[table_name].get("json_columns", set())
        if field_name in json_columns:
            return Json(value if value is not None else [])
        if value == "":
            if field_name in {
                "angebotId", "anfrageId", "auftragId", "artikelId", "serviceId",
                "kundeId", "lieferantId", "rolleId", "kategorieId", "parentId", "bedarfsmeldungId",
                "mitarbeiterId",
                "vorgangId", "antwort", "anfrageQuelle", "anfrageNotiz", "verguenstigungsGrund",
                "dokumentNr", "notiz", "website", "anschrift", "plz", "ort", "segment",
                "kanal", "beantwortetAm", "faelligAm", "wareneingangAm", "versendetAm",
                "lehrkraftAngebotAm", "titel", "bezug", "verantwortung", "grund",
                "stelle", "abteilung", "rolle", "zielgruppe", "ort", "zusammenfassung",
                "empfohlenAktion", "intervall", "status"
            }:
                return None
        return value

    def _prepare_relational_payload(self, table_name, item, defer_references=False, cursor=None):
        prepared = dict(item)

        if table_name == "benutzer":
            password_plain = prepared.get("password") or prepared.get("password_plain") or ""
            prepared["password"] = password_plain
            prepared["passwordHash"] = prepared.get("passwordHash") or password_plain
        if table_name == "rollenRechte":
            rolle_id = prepared.get("rolleId")
            if not rolle_id and prepared.get("rolleName"):
                rolle_id = self._find_relational_id_by_name("rollen", prepared.get("rolleName"), cursor=cursor)
            prepared["rolleId"] = rolle_id

            recht_id = prepared.get("rechtId")
            recht_name = prepared.get("rechtName") or prepared.get("permission")
            if not recht_id and recht_name:
                recht_id = self._find_relational_id_by_name("rechte", recht_name, cursor=cursor)
            prepared["rechtId"] = recht_id

        if table_name in {"angebotspositionen", "auftragspositionen"}:
            prepared["serviceId"] = prepared.get("serviceId") or None
            prepared["artikelId"] = prepared.get("artikelId") or None
            prepared["bezeichnung"] = self._resolve_position_label(prepared)

        if table_name == "bestellpositionen":
            prepared["bezeichnung"] = self._resolve_purchase_position_label(prepared)
        if table_name == "nachrichten" and not prepared.get("zeitpunkt"):
            datum = prepared.get("datum")
            prepared["zeitpunkt"] = f"{datum}T00:00:00" if datum else None
        if table_name == "belege":
            prepared["bezugId"] = self._resolve_receipt_reference_id(prepared)
        if table_name == "bewerber":
            prepared["mitarbeiterId"] = prepared.get("mitarbeiterId") or None
        if table_name == "freigaben":
            prepared["angebotId"] = prepared.get("angebotId") or None
        if defer_references:
            for field_name in DEFERRED_REFERENCE_FIELDS.get(table_name, set()):
                prepared[field_name] = None

        return prepared

    def _resolve_position_label(self, item):
        service_id = item.get("serviceId")
        artikel_id = item.get("artikelId")
        existing = item.get("bezeichnung") or item.get("artikel")
        if existing:
            return existing
        if service_id:
            service = self._get_relational("services", service_id)
            if service:
                return service.get("name") or service.get("serviceNr") or "Service"
            return "Service"
        if artikel_id:
            artikel = self._get_relational("artikel", artikel_id)
            if artikel:
                return artikel.get("name") or artikel.get("artikelNr") or "Artikel"
            return "Artikel"
        return "Position"

    def _resolve_purchase_position_label(self, item):
        existing = item.get("bezeichnung") or item.get("artikel")
        if existing:
            return existing
        artikel_id = item.get("artikelId")
        if artikel_id:
            artikel = self._get_relational("artikel", artikel_id)
            if artikel:
                return artikel.get("name") or artikel.get("artikelNr") or "Artikel"
        return item.get("artikelNr") or "Artikel"

    def _resolve_receipt_reference_id(self, item):
        reference_id = item.get("bezugId")
        if reference_id not in (None, ""):
            return reference_id
        if item.get("rechnungId") not in (None, ""):
            return item.get("rechnungId")
        return None

    def _find_relational_id_by_name(self, table_name, name, cursor=None):
        if not name:
            return None
        definition = RELATIONAL_TABLES[table_name]
        if cursor is not None:
            cursor.execute(
                f"select id from {definition['qualified_name']} where lower(name) = lower(%s) limit 1",
                (str(name),)
            )
            row = cursor.fetchone()
            if not row:
                return None
            return row["id"] if isinstance(row, dict) else row[0]

        item = next((
            entry for entry in self.list(table_name)
            if str(entry.get("name") or "").lower() == str(name).lower()
        ), None)
        return item.get("id") if item else None

    def _build_invoice_rows(self, cursor):
        invoice_rows = []
        invoice_rows.extend(self._build_outgoing_invoice_rows(cursor))
        invoice_rows.extend(self._build_incoming_invoice_rows(cursor))
        return invoice_rows

    def _build_outgoing_invoice_rows(self, cursor):
        cursor.execute(
            """
            select id, auftrag_nr, kunde_id, datum, faellig_am, gesamtbetrag, status
            from verkauf.auftraege
            where status in ('abgerechnet', 'bezahlt', 'archiviert')
            order by id asc
            """
        )
        rows = cursor.fetchall()
        return [
            {
                "id": row[0],
                "auftragId": row[0],
                "rechnungsnr": self._to_outgoing_invoice_number(row[1], row[3]),
                "rechnungstyp": "Ausgangsrechnung",
                "kundeId": row[2],
                "datum": row[3],
                "faelligAm": row[4],
                "betrag": row[5] or 0,
                "status": "bezahlt" if row[6] in {"bezahlt", "archiviert"} else "offen",
            }
            for row in rows
        ]

    def _build_incoming_invoice_rows(self, cursor):
        cursor.execute(
            """
            select id, bestell_nr, lieferant_id, coalesce(wareneingang_am, datum), faellig_am, rechnung_status
            from einkauf.bestellungen
            where status = 'eingegangen' or rechnung_status = 'bezahlt'
            order by id asc
            """
        )
        orders = cursor.fetchall()
        order_totals = self._load_purchase_order_totals(cursor)
        return [
            {
                "id": 100000 + row[0],
                "bestellungId": row[0],
                "rechnungsnr": self._to_incoming_invoice_number(row[1], row[3]),
                "rechnungstyp": "Eingangsrechnung",
                "lieferantId": row[2],
                "datum": row[3],
                "faelligAm": row[4],
                "betrag": order_totals.get(row[0], 0),
                "status": "bezahlt" if row[5] == "bezahlt" else "offen",
            }
            for row in orders
        ]

    def _load_purchase_order_totals(self, cursor):
        cursor.execute(
            """
            select bestellung_id, coalesce(sum(menge * einstandspreis), 0) as gesamtbetrag
            from einkauf.bestellpositionen
            group by bestellung_id
            """
        )
        return {row[0]: row[1] for row in cursor.fetchall()}

    def _to_outgoing_invoice_number(self, auftrag_nr, date_value):
        order_number = str(auftrag_nr or "")
        if order_number.startswith("AU-") or order_number.startswith("VK-"):
            return f"RG-{order_number.split('-', 1)[1]}"
        year = str(date_value or "")[:4] or time.strftime("%Y")
        return f"RG-{year}-001"

    def _to_incoming_invoice_number(self, bestell_nr, date_value):
        order_number = str(bestell_nr or "")
        if order_number.startswith("EK-"):
            return order_number.replace("EK-", "ER-", 1)
        year = str(date_value or "")[:4] or time.strftime("%Y")
        return f"ER-{year}-001"

    def _normalize_relational_row(self, table_name, row):
        if not row:
            return None
        normalized = {
            key: (value.isoformat() if isinstance(value, (date, datetime, time_value)) else value)
            for key, value in dict(row).items()
        }
        for field_name in RELATIONAL_TABLES[table_name].get("json_columns", set()):
            if normalized.get(field_name) is None:
                normalized[field_name] = []
        if table_name == "benutzer":
            normalized.setdefault("permissions", [])
            normalized.setdefault("aktiv", True)
            normalized["password"] = normalized.get("password") or ""
        if table_name == "rollen":
            normalized.setdefault("permissions", [])
        if table_name == "rollenRechte":
            rolle = self._get_relational("rollen", normalized.get("rolleId")) if normalized.get("rolleId") else None
            recht = self._get_relational("rechte", normalized.get("rechtId")) if normalized.get("rechtId") else None
            normalized["rolleName"] = rolle.get("name") if rolle else normalized.get("rolleName") or ""
            normalized["rechtName"] = recht.get("name") if recht else normalized.get("rechtName") or ""
            normalized.pop("rechtId", None)
        if table_name == "kategorien":
            normalized["parentId"] = normalized.get("parentId") or ""
        if table_name == "kunden":
            normalized.setdefault("optionen", [])
        if table_name == "artikel":
            normalized.setdefault("komponenten", [])
        if table_name == "abteilungen":
            normalized.setdefault("aufgaben", [])
        if table_name == "angebote":
            normalized.setdefault("preispositionen", [])
        if table_name in {"angebotspositionen", "auftragspositionen"}:
            normalized["artikel"] = normalized.get("bezeichnung") or normalized.get("artikel") or ""
            if normalized.get("serviceId"):
                normalized["leistungTyp"] = normalized.get("leistungTyp") or "Service"
            else:
                normalized["leistungTyp"] = normalized.get("leistungTyp") or "Artikel"
        if table_name == "bestellpositionen":
            normalized["artikel"] = normalized.get("bezeichnung") or normalized.get("artikel") or ""
            normalized["artikelNr"] = normalized.get("artikelNr") or ""
        if table_name == "nachrichten":
            normalized.setdefault("zeitpunkt", f"{normalized.get('datum')}T00:00:00" if normalized.get("datum") else None)
        if table_name == "belege":
            normalized["rechnungId"] = normalized.get("rechnungId") or ""
        if table_name == "firmenkonto":
            normalized["konto"] = normalized.get("konto") or "firma"
        if table_name in {"arbeitszeiten", "urlaubsantraege", "krankmeldungen", "personalakten"}:
            normalized["mitarbeiterId"] = normalized.get("mitarbeiterId") or ""
        return normalized

    def _sort_id(self, entity_id):
        return int(entity_id) if str(entity_id).isdigit() else 0

    def _connect(self):
        last_error = None
        for _ in range(10):
            try:
                return psycopg2.connect(self.dsn)
            except psycopg2.OperationalError as error:
                last_error = error
                time.sleep(1)
        raise last_error

    def _require_table(self, table_name):
        if not self.table_exists(table_name):
            raise KeyError(table_name)

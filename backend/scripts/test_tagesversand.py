import unittest
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from sys import path
from zoneinfo import ZoneInfo

path.insert(0, str(Path(__file__).resolve().parents[1]))

from tagesversand import run_tagesversand


class FakeStore:
    def __init__(self, tables):
        self.tables = deepcopy(tables)

    def transaction(self, callback):
        return callback(None)

    def list_in_transaction(self, _cursor, table_name):
        return deepcopy(self.tables.get(table_name, []))

    def save_in_transaction(self, _cursor, table_name, entity_id, item):
        entries = self.tables.setdefault(table_name, [])
        for index, entry in enumerate(entries):
            if str(entry.get("id")) == str(entity_id):
                entries[index] = deepcopy(item)
                return
        entries.append(deepcopy(item))


class TagesversandTest(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 9, 1, 16, 0, tzinfo=ZoneInfo("Europe/Berlin"))
        self.store = FakeStore({
            "fristenOptionen": [{"id": 1, "angeboteTagesabschlussAktiv": True, "angeboteTagesabschlussUhrzeit": "16:00"}],
            "angebote": [
                {"id": 1, "angebotsNr": "ANG-1", "vorgangId": "anfrage-1", "anfrageId": 1, "kundeId": 1, "gueltigBis": "2026-09-10", "alsVorbereitetGespeichert": True, "freigabeStatus": "freigegeben"},
                {"id": 2, "angebotsNr": "ANG-2", "gueltigBis": "2026-08-31", "alsVorbereitetGespeichert": True, "freigabeStatus": "freigegeben"},
                {"id": 3, "angebotsNr": "ANG-3", "gueltigBis": "2026-09-10", "alsVorbereitetGespeichert": True, "freigabeStatus": "angefragt"}
            ],
            "kundenanfragen": [{"id": 1, "vorgangId": "anfrage-1", "kanal": "E-Mail"}],
            "nachrichten": [],
            "tagesversandprotokolle": []
        })

    def test_sends_only_eligible_offers_and_is_idempotent(self):
        first_run = run_tagesversand(self.store, now=self.now)
        self.assertTrue(first_run["ok"])
        self.assertEqual([item["angebotsNr"] for item in first_run["protocol"]["versendet"]], ["ANG-1"])
        self.assertEqual(len(first_run["protocol"]["uebersprungen"]), 2)
        self.assertEqual(len(self.store.tables["nachrichten"]), 1)
        self.assertTrue(self.store.tables["angebote"][1]["tagesabschlussZurueckgehalten"])
        self.assertEqual(self.store.tables["angebote"][2]["freigabeStatus"], "angefragt")

        second_run = run_tagesversand(self.store, now=self.now)
        self.assertTrue(second_run["alreadyRun"])
        self.assertEqual(len(self.store.tables["nachrichten"]), 1)


if __name__ == "__main__":
    unittest.main()

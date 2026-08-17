import os
import sys
import tempfile
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


class AdminBackupRestoreTest(unittest.TestCase):
    def setUp(self):
        self._original_env = {
            "ERP_DATA_MODE": os.environ.get("ERP_DATA_MODE"),
            "ERP_ARTICLE_IMAGE_STORAGE_PATH": os.environ.get("ERP_ARTICLE_IMAGE_STORAGE_PATH"),
        }
        self._temp_dir = tempfile.TemporaryDirectory()
        os.environ["ERP_DATA_MODE"] = "memory"
        os.environ["ERP_ARTICLE_IMAGE_STORAGE_PATH"] = os.path.join(self._temp_dir.name, "artikelbilder")

        from app_factory import create_app

        self.app = create_app()
        self.client = self.app.test_client()
        login = self.client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin",
        })
        self.assertEqual(login.status_code, 200)

    def tearDown(self):
        self._temp_dir.cleanup()
        for key, value in self._original_env.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value

    def test_restore_accepts_raw_backup_object(self):
        backup_response = self.client.get("/api/admin/backup")
        self.assertEqual(backup_response.status_code, 200)
        backup_payload = backup_response.get_json()
        self.assertIsInstance(backup_payload, dict)
        self.assertIn("backup", backup_payload)
        original_nummernkreis = backup_payload["backup"]["tables"]["nummernkreise"][0]

        patch_response = self.client.patch(
            f"/api/datenbanken/nummernkreise/{original_nummernkreis['id']}",
            json={
            "id": original_nummernkreis["id"],
            "schluessel": original_nummernkreis["schluessel"],
            "bezeichnung": "Backup Restore Test",
            "kuerzel": "BRT",
        })
        self.assertEqual(patch_response.status_code, 200)

        restore_response = self.client.post("/api/admin/restore", json=backup_payload["backup"])
        self.assertEqual(restore_response.status_code, 200)
        self.assertTrue(restore_response.get_json().get("ok"))

        nummernkreise_response = self.client.get("/api/datenbanken/nummernkreise")
        self.assertEqual(nummernkreise_response.status_code, 200)
        nummernkreise = nummernkreise_response.get_json()["items"]
        restored_nummernkreis = next(
            item for item in nummernkreise
            if str(item.get("id")) == str(original_nummernkreis["id"])
        )
        self.assertEqual(restored_nummernkreis["bezeichnung"], original_nummernkreis["bezeichnung"])
        self.assertEqual(restored_nummernkreis["kuerzel"], original_nummernkreis["kuerzel"])

    def test_restore_accepts_wrapped_backup_object(self):
        backup_response = self.client.get("/api/admin/backup")
        self.assertEqual(backup_response.status_code, 200)
        backup_payload = backup_response.get_json()

        restore_response = self.client.post("/api/admin/restore", json={
            "backup": backup_payload["backup"]
        })
        self.assertEqual(restore_response.status_code, 200)
        self.assertTrue(restore_response.get_json().get("ok"))


if __name__ == "__main__":
    unittest.main()

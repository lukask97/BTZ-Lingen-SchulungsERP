from pathlib import Path


ALLOWED_EXTENSIONS = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}


class ArticleImageStore:
    def __init__(self, base_path, max_count=10):
        self.base_path = Path(base_path)
        self.max_count = max_count
        self.base_path.mkdir(parents=True, exist_ok=True)

    def list_images(self, artikel_nr):
        safe_artikel_nr = self._sanitize_artikel_nr(artikel_nr)
        images = []
        for slot in range(self.max_count):
            file_path = self._find_slot_file(safe_artikel_nr, slot)
            if not file_path:
                continue
            images.append(self._build_image_payload(safe_artikel_nr, slot, file_path))
        return images

    def save_image(self, artikel_nr, slot, uploaded_file):
        safe_artikel_nr = self._sanitize_artikel_nr(artikel_nr)
        safe_slot = self._validate_slot(slot)
        extension = self._resolve_extension(uploaded_file.filename, uploaded_file.mimetype)
        self.delete_image(safe_artikel_nr, safe_slot)

        target_path = self.base_path / f"{safe_artikel_nr}_{safe_slot}{extension}"
        uploaded_file.save(target_path)
        return self._build_image_payload(safe_artikel_nr, safe_slot, target_path)

    def delete_image(self, artikel_nr, slot):
        safe_artikel_nr = self._sanitize_artikel_nr(artikel_nr)
        safe_slot = self._validate_slot(slot)
        file_path = self._find_slot_file(safe_artikel_nr, safe_slot)
        if not file_path:
            return False
        file_path.unlink(missing_ok=True)
        return True

    def get_image_path(self, artikel_nr, slot):
        safe_artikel_nr = self._sanitize_artikel_nr(artikel_nr)
        safe_slot = self._validate_slot(slot)
        return self._find_slot_file(safe_artikel_nr, safe_slot)

    def count_images(self, artikel_nr):
        return len(self.list_images(artikel_nr))

    def list_all_files(self):
        files = []
        for path in sorted(self.base_path.iterdir()):
            if path.is_file() and path.suffix.lower() in ALLOWED_EXTENSIONS:
                files.append(path)
        return files

    def restore_file(self, filename, content):
        safe_name = Path(filename).name
        suffix = Path(safe_name).suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise ValueError("Es sind nur JPG- und PNG-Bilder erlaubt.")
        target_path = self.base_path / safe_name
        target_path.write_bytes(content)
        return target_path

    def _find_slot_file(self, artikel_nr, slot):
        for extension in ALLOWED_EXTENSIONS:
            path = self.base_path / f"{artikel_nr}_{slot}{extension}"
            if path.exists():
                return path
        return None

    def _build_image_payload(self, artikel_nr, slot, file_path):
        return {
            "slot": slot,
            "filename": file_path.name,
            "url": f"/api/artikel/bilder/{artikel_nr}/{slot}",
            "mimeType": ALLOWED_EXTENSIONS.get(file_path.suffix.lower(), "application/octet-stream"),
            "size": file_path.stat().st_size,
        }

    def _resolve_extension(self, filename, mimetype):
        suffix = Path(filename or "").suffix.lower()
        if suffix in ALLOWED_EXTENSIONS:
            return suffix

        mime = str(mimetype or "").lower()
        if mime == "image/jpeg":
            return ".jpg"
        if mime == "image/png":
            return ".png"
        raise ValueError("Es sind nur JPG- und PNG-Bilder erlaubt.")

    def _sanitize_artikel_nr(self, artikel_nr):
        value = "".join(
            char if char.isalnum() or char in {"-", "_"} else "_"
            for char in str(artikel_nr or "").strip()
        )
        if not value:
            raise ValueError("Der Artikel hat keine gueltige Artikelnummer.")
        return value

    def _validate_slot(self, slot):
        value = int(slot)
        if value < 0 or value >= self.max_count:
            raise ValueError(f"Es sind nur Bild-Slots von 0 bis {self.max_count - 1} erlaubt.")
        return value

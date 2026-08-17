import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const NOTE_CONFIG = {
    kunden: {
        key: "lehrkraftNotizenKunden",
        title: "Lehrkraft-Notizen Kunden",
        hint: "Hier kann die Lehrkraft Testideen für Kundenkorrespondenz, Angebote und externe Zahlungen festhalten.",
        defaultNote: [
            "Ideen für Kundentests:",
            "- Angebot erst nach Ablauf der Gültigkeit annehmen lassen.",
            "- Rückfrage des Kunden absichtlich offen lassen.",
            "- Zahlung extern verspätet oder gar nicht bestätigen."
        ].join("\n")
    },
    lieferanten: {
        key: "lehrkraftNotizenLieferanten",
        title: "Lehrkraft-Notizen Lieferanten",
        hint: "Hier kann die Lehrkraft Testideen für Lieferantenkorrespondenz und externe Rechnungen festhalten.",
        defaultNote: [
            "Ideen für Lieferantentests:",
            "- Rechnung gegenüber der Schülerfirma bewusst nicht bezahlen.",
            "- Lieferbestätigung unvollständig lassen.",
            "- Frist oder Mahnung als Testfall vorbereiten."
        ].join("\n")
    }
};

export default function TeacherNotesPanel() {
    const location = useLocation();
    const [note, setNote] = useState("");
    const noteConfig = useMemo(() => {
        if (location.pathname.includes("/lieferantenkorrespondenz") || location.pathname.includes("/rechnungen")) {
            return NOTE_CONFIG.lieferanten;
        }

        return NOTE_CONFIG.kunden;
    }, [location.pathname]);

    useEffect(() => {
        const gespeicherteNotiz = sessionStorage.getItem(noteConfig.key);
        setNote(gespeicherteNotiz || noteConfig.defaultNote);
    }, [noteConfig]);

    useEffect(() => {
        sessionStorage.setItem(noteConfig.key, note);
    }, [note, noteConfig]);

    return (
        <aside className="teacher-notes-panel">
            <div className="teacher-notes-card">
                <div className="teacher-notes-header">
                    <h2>{noteConfig.title}</h2>
                    <span>{location.pathname.replace("/lehrkraft", "Lehrkraft")}</span>
                </div>
                <p className="teacher-notes-hint">
                    {noteConfig.hint}
                </p>
                <textarea
                    name={`teacher-notes-${noteConfig.key}`}
                    className="teacher-notes-textarea"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Notizen für Unterricht, Prüffragen und geplante Sonderfälle eintragen..."
                />
            </div>
        </aside>
    );
}

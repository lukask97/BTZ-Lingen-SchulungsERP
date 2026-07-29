import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const NOTE_CONFIG = {
    kunden: {
        key: "lehrkraftNotizenKunden",
        title: "Lehrkraft-Notizen Kunden",
        hint: "Hier kann die Lehrkraft Testideen fuer Kundenkorrespondenz, Angebote und externe Zahlungen festhalten.",
        defaultNote: [
            "Ideen fuer Kundentests:",
            "- Angebot erst nach Ablauf der Gueltigkeit annehmen lassen.",
            "- Rueckfrage des Kunden absichtlich offen lassen.",
            "- Zahlung extern verspaetet oder gar nicht bestaetigen."
        ].join("\n")
    },
    lieferanten: {
        key: "lehrkraftNotizenLieferanten",
        title: "Lehrkraft-Notizen Lieferanten",
        hint: "Hier kann die Lehrkraft Testideen fuer Lieferantenkorrespondenz und externe Rechnungen festhalten.",
        defaultNote: [
            "Ideen fuer Lieferantentests:",
            "- Rechnung gegenueber der Schuelerfirma bewusst nicht bezahlen.",
            "- Lieferbestaetigung unvollstaendig lassen.",
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
                    className="teacher-notes-textarea"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Notizen fuer Unterricht, Prueffragen und geplante Sonderfaelle eintragen..."
                />
            </div>
        </aside>
    );
}

import { useEffect, useState } from "react";
import { createKlasse, deleteKlasseWithPassword, listKlassen, updateKlasse } from "../../services/admin/klassenService";
import benutzerService from "../../services/verwaltung/benutzerService";
import { getUserFullName } from "../../utils/userDisplay";

type Klasse = {
    id: number | string;
    name: string;
    datenbankName: string;
    status: string;
    beschreibung?: string;
};

const EMPTY_CLASS = {
    name: "",
    beschreibung: "",
    status: "aktiv"
};

export default function Klassen() {
    const [klassen, setKlassen] = useState<Klasse[]>([]);
    const [benutzer, setBenutzer] = useState<any[]>([]);
    const [current, setCurrent] = useState<any>(EMPTY_CLASS);
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>("0");
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        try {
            const loadedClasses = await listKlassen();
            setKlassen(loadedClasses);
            setBenutzer(benutzerService.getAll());
            if (loadedClasses.length > 0 && !loadedClasses.some(item => String(item.id) === selectedClassId)) {
                setSelectedClassId(String(loadedClasses[0].id));
            }
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Klassen konnten nicht geladen werden.");
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const resetForm = () => {
        setCurrent(EMPTY_CLASS);
        setEditingId(null);
    };

    const save = async () => {
        if (!String(current.name || "").trim()) {
            setError("Bitte einen Klassennamen eintragen.");
            return;
        }
        try {
            if (editingId === null) {
                await createKlasse(current);
                setMessage("Klasse wurde angelegt und mit Seed-Daten vorbereitet.");
            } else {
                await updateKlasse(editingId, current);
                setMessage("Klasse wurde gespeichert.");
            }
            resetForm();
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Klasse konnte nicht gespeichert werden.");
        }
    };

    const edit = (klasse: Klasse) => {
        setEditingId(klasse.id);
        setCurrent({
            name: klasse.name || "",
            beschreibung: klasse.beschreibung || "",
            status: klasse.status || "aktiv"
        });
        setMessage("");
        setError("");
    };

    const toggleActive = async (klasse: Klasse) => {
        const nextStatus = String(klasse.status || "aktiv") === "aktiv" ? "deaktiviert" : "aktiv";
        try {
            await updateKlasse(klasse.id, { ...klasse, status: nextStatus });
            setMessage(nextStatus === "aktiv" ? "Klasse wurde aktiviert." : "Klasse wurde deaktiviert.");
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Status konnte nicht geaendert werden.");
        }
    };

    const remove = async (klasse: Klasse) => {
        if (String(klasse.datenbankName) === "erp_0") {
            setError("Die Demo-Klasse erp_0 darf nicht geloescht werden.");
            return;
        }
        const warning = `Die Klasse ${klasse.name} und die Datenbank ${klasse.datenbankName} werden endgueltig geloescht.`;
        if (!confirm(`${warning}\n\nFortfahren?`)) return;
        const password = prompt("Bitte Admin-Passwort zur Bestaetigung eingeben.");
        if (!password) return;
        try {
            await deleteKlasseWithPassword(klasse.id, password);
            setMessage("Klasse und Datenbank wurden geloescht.");
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Klasse konnte nicht geloescht werden.");
        }
    };

    const getUserClassIds = (item) => {
        if (Array.isArray(item.klasseIds)) return item.klasseIds.map(String);
        if (item.klasseId !== undefined && item.klasseId !== null && item.klasseId !== "") return [String(item.klasseId)];
        return [];
    };

    const selectedClass = klassen.find(item => String(item.id) === String(selectedClassId));
    const classMembers = benutzer.filter(item => getUserClassIds(item).includes(String(selectedClassId)));
    const assignableUsers = benutzer.filter(item => !getUserClassIds(item).includes(String(selectedClassId)));

    const addParticipant = () => {
        const targetUser = benutzer.find(item => String(item.id) === String(selectedUserId));
        if (!targetUser || !selectedClass) return;
        const nextIds = Array.from(new Set([...getUserClassIds(targetUser), String(selectedClass.id)]));
        benutzerService.update({
            ...targetUser,
            klasseIds: nextIds,
            klasseId: targetUser.klasseId || nextIds[0]
        });
        setSelectedUserId("");
        setMessage(`${getUserFullName(targetUser)} wurde ${selectedClass.name} hinzugefuegt.`);
        setBenutzer(benutzerService.getAll());
    };

    const removeParticipant = (targetUser) => {
        if (!selectedClass) return;
        const nextIds = getUserClassIds(targetUser).filter(id => String(id) !== String(selectedClass.id));
        benutzerService.update({
            ...targetUser,
            klasseIds: nextIds,
            klasseId: String(targetUser.klasseId) === String(selectedClass.id) ? (nextIds[0] || "") : targetUser.klasseId
        });
        setMessage(`${getUserFullName(targetUser)} wurde aus ${selectedClass.name} entfernt.`);
        setBenutzer(benutzerService.getAll());
    };

    return <>
        <h1>Klassen</h1>
        <p>Klassen verwalten und eigene ERP-Datenbanken fuer den Unterricht erzeugen.</p>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>{editingId === null ? "Neue Klasse" : "Klasse bearbeiten"}</h2>
                <span>{editingId === null ? "Automatische Datenbank" : "Bestehend"}</span>
            </div>
            <div className="form-grid two-columns">
                <label>
                    Name
                    <input value={current.name} onChange={event => setCurrent({ ...current, name: event.target.value })} />
                </label>
                <label>
                    Status
                    <select value={current.status} onChange={event => setCurrent({ ...current, status: event.target.value })}>
                        <option value="aktiv">aktiv</option>
                        <option value="deaktiviert">deaktiviert</option>
                    </select>
                </label>
                <label className="is-wide">
                    Beschreibung
                    <textarea rows={3} value={current.beschreibung} onChange={event => setCurrent({ ...current, beschreibung: event.target.value })} />
                </label>
            </div>
            <div className="thread-document-links">
                <button type="button" onClick={() => void save()}>{editingId === null ? "Klasse anlegen" : "Speichern"}</button>
                {editingId !== null && <button type="button" className="button-secondary" onClick={resetForm}>Abbrechen</button>}
            </div>
            {message && <p>{message}</p>}
            {error && <p className="form-error">{error}</p>}
        </section>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Vorhandene Klassen</h2>
                <span>{klassen.length} Eintraege</span>
            </div>
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Datenbank</th>
                            <th>Status</th>
                            <th>Beschreibung</th>
                            <th>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {klassen.map(klasse => (
                            <tr key={klasse.id}>
                                <td>{klasse.name}</td>
                                <td>{klasse.datenbankName}</td>
                                <td>{klasse.status}</td>
                                <td>{klasse.beschreibung || "-"}</td>
                                <td>
                                    <div className="thread-document-links">
                                        <button type="button" className="button-secondary" onClick={() => edit(klasse)}>Bearbeiten</button>
                                        <button type="button" className="button-secondary" onClick={() => void toggleActive(klasse)}>
                                            {klasse.status === "aktiv" ? "Deaktivieren" : "Aktivieren"}
                                        </button>
                                        <button type="button" className="button-danger" onClick={() => void remove(klasse)} disabled={klasse.datenbankName === "erp_0"}>
                                            Loeschen
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>

        <section className="module-panel">
            <div className="dashboard-panel-header">
                <h2>Teilnehmer</h2>
                <span>{selectedClass?.name || "-"}</span>
            </div>
            <div className="form-row">
                <div>
                    <label>
                        Klasse
                        <select value={selectedClassId} onChange={event => setSelectedClassId(event.target.value)}>
                            {klassen.map(klasse => <option key={klasse.id} value={String(klasse.id)}>{klasse.name}</option>)}
                        </select>
                    </label>
                </div>
                <div>
                    <label>
                        Teilnehmer hinzufuegen
                        <select value={selectedUserId} onChange={event => setSelectedUserId(event.target.value)}>
                            <option value="">Benutzer auswaehlen</option>
                            {assignableUsers.map(item => (
                                <option key={item.id} value={String(item.id)}>
                                    {getUserFullName(item)} ({item.rolle || "-"})
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <div>
                    <button type="button" onClick={addParticipant} disabled={!selectedUserId}>Hinzufuegen</button>
                </div>
            </div>
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Benutzername</th>
                            <th>Rolle</th>
                            <th>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classMembers.length === 0 ? (
                            <tr>
                                <td colSpan={4}>Keine Teilnehmer zugeordnet</td>
                            </tr>
                        ) : classMembers.map(item => (
                            <tr key={item.id}>
                                <td>{getUserFullName(item)}</td>
                                <td>{item.username}</td>
                                <td>{item.rolle || "-"}</td>
                                <td>
                                    <button type="button" className="button-secondary" onClick={() => removeParticipant(item)}>
                                        Entfernen
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    </>;
}

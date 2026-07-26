import { Link } from "react-router-dom";
import arbeitszeitenService from "../services/arbeitszeitenService";
import bewerberService from "../services/bewerberService";
import krankmeldungenService from "../services/krankmeldungenService";
import mitarbeiterService from "../services/mitarbeiterService";
import personalaktenService from "../services/personalaktenService";
import schulungenService from "../services/schulungenService";
import urlaubsantraegeService from "../services/urlaubsantraegeService";

export default function Personalwesen() {
    const bewerber = bewerberService.list();
    const mitarbeiter = mitarbeiterService.list();
    const arbeitszeiten = arbeitszeitenService.list();
    const urlaubsantraege = urlaubsantraegeService.list();
    const krankmeldungen = krankmeldungenService.list();
    const schulungen = schulungenService.list();
    const akten = personalaktenService.list();

    const offeneUrlaubsantraege = urlaubsantraege.filter(item => item.status === "offen").length;
    const offeneKrankmeldungen = krankmeldungen.filter(item => item.status !== "abgeschlossen").length;
    const offeneZeitbuchungen = arbeitszeiten.filter(item => item.status === "erfasst").length;
    const offeneAkte = akten.filter(item => item.status === "offen").length;

    return <>
        <h1>Personalwesen</h1>
        <p>Modul für Personalprozesse, Aktenführung und Formulare. Die Seite dient als Einstieg in typische HR-Abläufe, die Schüler nachvollziehen und dokumentieren sollen.</p>

        <div className="kennzahlen">
            <div className="kennzahl"><span>Bewerber</span><strong>{bewerber.length}</strong><small>Personalgewinnung</small></div>
            <div className="kennzahl"><span>Mitarbeiter</span><strong>{mitarbeiter.length}</strong><small>Stammdaten</small></div>
            <div className="kennzahl"><span>Personalakten</span><strong>{akten.length}</strong><small>{offeneAkte} offen</small></div>
            <div className="kennzahl"><span>Urlaubsanträge</span><strong>{urlaubsantraege.length}</strong><small>{offeneUrlaubsantraege} offen</small></div>
            <div className="kennzahl"><span>Krankmeldungen</span><strong>{krankmeldungen.length}</strong><small>{offeneKrankmeldungen} aktiv</small></div>
            <div className="kennzahl"><span>Arbeitszeiten</span><strong>{arbeitszeiten.length}</strong><small>{offeneZeitbuchungen} zu prüfen</small></div>
            <div className="kennzahl"><span>Schulungen</span><strong>{schulungen.length}</strong><small>Weiterbildung</small></div>
        </div>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Personalprozess</h2>
                    <span>Didaktischer Ablauf</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Bewerberdaten aufnehmen und einer Stelle zuordnen.</li>
                    <li>Mitarbeiter anlegen und Rolle oder Abteilung festhalten.</li>
                    <li>Unterlagen in der Personalakte dokumentieren.</li>
                    <li>Urlaubsanträge, Krankmeldungen oder Onboarding-Unterlagen sauber verwalten.</li>
                    <li>Arbeitszeiten und Schulungen als laufende Personaldokumentation ergänzen.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Dokumente und Formulare</h2>
                    <span>Übungsfokus</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Vertragsunterlagen und Personalnotizen</li>
                    <li>Urlaubsanträge und Krankmeldungen</li>
                    <li>Abmahnungen nur simulativ und fiktiv</li>
                    <li>Onboarding-Checklisten und Schulungsnachweise</li>
                </ul>
                <div className="link-list">
                    <Link className="button-link" to="/personalakte">Personalakte öffnen</Link>
                    <Link className="button-link" to="/urlaubsantraege">Urlaubsanträge bearbeiten</Link>
                    <Link className="button-link" to="/krankmeldungen">Krankmeldungen bearbeiten</Link>
                    <Link className="button-link" to="/schulungen">Schulungen planen</Link>
                </div>
            </article>
        </section>

        <section className="module-panel">
            <h2>Direkte Einstiege</h2>
            <div className="link-list">
                <Link className="button-link" to="/bewerber">Bewerber</Link>
                <Link className="button-link" to="/mitarbeiter">Mitarbeiter</Link>
                <Link className="button-link" to="/personalakte">Personalakte</Link>
                <Link className="button-link" to="/arbeitszeiten">Arbeitszeiten</Link>
                <Link className="button-link" to="/urlaubsantraege">Urlaubsanträge</Link>
                <Link className="button-link" to="/krankmeldungen">Krankmeldungen</Link>
                <Link className="button-link" to="/schulungen">Schulungen</Link>
            </div>
        </section>
    </>;
}

import { Link } from "react-router-dom";
import artikelService from "../services/artikelService";
import arbeitszeitenService from "../services/arbeitszeitenService";
import bewerberService from "../services/bewerberService";
import bestellungenService from "../services/bestellungenService";
import customerInquiryService from "../services/customerInquiryService";
import freigabenService from "../services/freigabenService";
import krankmeldungenService from "../services/krankmeldungenService";
import mahnungenService from "../services/mahnungenService";
import mitarbeiterService from "../services/mitarbeiterService";
import rechnungenService from "../services/rechnungenService";
import schulungenService from "../services/schulungenService";
import auftraegeService from "../services/auftraegeService";
import urlaubsantraegeService from "../services/urlaubsantraegeService";
import versandService from "../services/versandService";
import { resetTestData } from "../services/mockup/mockStorage";
import useAuth from "../auth/useAuth";

const today = "2026-07-26";

function dateScore(dateValue = "") {
    return Number(String(dateValue).replaceAll("-", "")) || 0;
}

function Dashboard() {
    const { user, hasAccess, hasPermission } = useAuth();
    const isTeacherView = hasPermission("*");
    const auftraege = auftraegeService.getAll();
    const rechnungen = rechnungenService.getAll();
    const bestellungen = bestellungenService.list();
    const artikel = artikelService.getAll();
    const anfragen = customerInquiryService.list();
    const freigaben = freigabenService.list();
    const versandauftraege = versandService.list();
    const urlaubsantraege = urlaubsantraegeService.list();
    const krankmeldungen = krankmeldungenService.list();
    const arbeitszeiten = arbeitszeitenService.list();
    const schulungen = schulungenService.list();
    const bewerber = bewerberService.list();
    const mahnungen = mahnungenService.list();
    const mitarbeiter = mitarbeiterService.list();

    const offeneAuftraege = auftraegeService.getAll().filter(auftrag => auftrag.status === "offen").length;
    const offeneRechnungen = rechnungen.filter(rechnung => rechnung.status === "offen").length;
    const niedrigeBestaende = artikel.filter(item => Number(item.bestand) < 10).length;
    const offeneAnfragen = anfragen.filter(item => item.status === "offen").length;
    const offeneFreigaben = freigaben.filter(item => item.status === "offen").length;
    const offeneBestellungen = bestellungen.filter(item => item.status === "offen").length;
    const offeneUrlaubsantraege = urlaubsantraege.filter(item => item.status === "offen").length;
    const offeneKrankmeldungen = krankmeldungen.filter(item => item.status === "eingegangen").length;
    const offeneZeitbuchungen = arbeitszeiten.filter(item => item.status === "erfasst").length;
    const faelligeRechnungen = rechnungen.filter(rechnung => rechnung.status === "offen" && rechnung.faelligAm && rechnung.faelligAm < today).length;
    const offeneBewerbungen = bewerber.filter(item => item.status === "eingegangen").length;
    const geplanteSchulungen = schulungen.filter(item => item.status === "geplant").length;

    const bereiche = [
        { access: "einkauf", title: "Einkauf", text: "Lieferanten vergleichen, Bestellungen anlegen und Wareneingänge bearbeiten.", to: "/themen/einkauf", link: "Zum Einkauf" },
        { access: "verkauf", title: "Verkauf", text: "Kundenanfragen, Angebote und Aufträge miteinander verknüpfen.", to: "/themen/verkauf", link: "Zum Verkauf" },
        { access: "buchhaltung", title: "Buchhaltung", text: "Rechnungen, Zahlungen, Mahnungen und Belege einfach einordnen.", to: "/buchhaltung", link: "Zur Buchhaltung" },
        { access: "personalwesen", title: "Personal", text: "Mitarbeiter, Personalakte und Formulare im Zusammenhang bearbeiten.", to: "/personalwesen", link: "Zum Personal" },
        { access: "marketing", title: "Marketing", text: "Aktionen, Feedback und Events als Zusatzbereich dokumentieren.", to: "/marketing", link: "Zum Marketing" },
        { access: "logistik", title: "Logistik", text: "Versand, Lager und Retouren als unterstützende Bereiche nutzen.", to: "/logistik", link: "Zur Logistik" }
    ];

    const testdatenZuruecksetzen = () => {
        if (!confirm("Alle lokalen Testdaten werden zurückgesetzt. Fortfahren?")) return;
        resetTestData();
        window.location.reload();
    };

    const schuelerAufgaben = [
        offeneAnfragen > 0 && { title: "Kundenanfragen beantworten", text: `${offeneAnfragen} Anfragen warten auf Bearbeitung oder Rückmeldung.`, to: "/kundenanfragen", action: "Anfragen öffnen" },
        offeneAuftraege > 0 && { title: "Aufträge weiterbearbeiten", text: `${offeneAuftraege} Aufträge sind noch offen und können geprüft oder versendet werden.`, to: "/auftraege", action: "Aufträge prüfen" },
        offeneBestellungen > 0 && { title: "Wareneingänge vorbereiten", text: `${offeneBestellungen} Bestellungen sind noch offen und sollen im Einkauf weitergeführt werden.`, to: "/wareneingaenge", action: "Wareneingänge ansehen" },
        offeneRechnungen > 0 && { title: "Offene Posten prüfen", text: `${offeneRechnungen} Rechnungen sind noch nicht bezahlt und eignen sich für die Buchhaltungsübung.`, to: "/rechnungen", action: "Rechnungen prüfen" },
        offeneUrlaubsantraege > 0 && { title: "Personalvorgänge prüfen", text: `${offeneUrlaubsantraege} Urlaubsanträge warten auf eine Entscheidung.`, to: "/urlaubsantraege", action: "Anträge öffnen" },
        offeneKrankmeldungen > 0 && { title: "Krankmeldungen bestätigen", text: `${offeneKrankmeldungen} Krankmeldungen sind neu eingegangen und sollten in Akte und Status übernommen werden.`, to: "/krankmeldungen", action: "Krankmeldungen öffnen" },
        offeneFreigaben > 0 && { title: "Freigaben nachvollziehen", text: `${offeneFreigaben} Freigaben können als Führungsentscheidung betrachtet werden.`, to: "/freigaben", action: "Freigaben öffnen" }
    ].filter(Boolean);

    const letzteAktivitaeten = [
        ...auftraege.map(item => ({ date: item.datum, title: `Auftrag ${item.auftragNr}`, text: `${item.kunde} · Status ${item.status}`, to: "/auftraege" })),
        ...rechnungen.map(item => ({ date: item.datum, title: `Rechnung ${item.rechnungsnr}`, text: `${item.kunde} · ${item.status}`, to: "/rechnungen" })),
        ...bestellungen.map(item => ({ date: item.datum, title: `Bestellung ${item.bestellNr}`, text: `${item.lieferant} · ${item.status}`, to: "/bestellungen" })),
        ...versandauftraege.map(item => ({ date: item.datum, title: `Versand ${item.versandNr}`, text: `${item.auftrag} · ${item.status}`, to: "/versand" })),
        ...anfragen.map(item => ({ date: item.datum, title: `Kundenanfrage ${item.typ}`, text: `${item.kunde} · ${item.status}`, to: "/kundenanfragen" })),
        ...mahnungen.map(item => ({ date: item.datum, title: `Mahnung ${item.rechnungsnr}`, text: `${item.kunde} · ${item.stufe}`, to: "/mahnungen" }))
    ].sort((a, b) => dateScore(b.date) - dateScore(a.date)).slice(0, 6);

    const hinweise = isTeacherView ? [
        "Nutze die Fallakten als Arbeitsauftrag und lasse die Ergebnisse auf den Kernseiten dokumentieren.",
        "Achte bei Auswertungen besonders auf Belegbezug, Statuspflege und die richtige Prozessreihenfolge.",
        "Offene oder fehlerhafte Vorgänge eignen sich gut für kurze Reflexionsgespräche im Unterricht."
    ] : [
        "Beginne mit den offenen Aufgaben und dokumentiere jeden Schritt auf der passenden Fachseite.",
        "Arbeite mit den vorhandenen Datensätzen, statt neue Daten ohne Bezug anzulegen.",
        "Prüfe am Ende Status, Verknüpfungen und zugehörige Belege, damit der Vorgang vollständig ist."
    ];

    const unternehmensstatus = [
        { label: "Vertrieb", value: offeneAuftraege === 0 ? "stabil" : `${offeneAuftraege} offen`, tone: offeneAuftraege === 0 ? "good" : "warn" },
        { label: "Einkauf", value: offeneBestellungen === 0 ? "geordnet" : `${offeneBestellungen} offen`, tone: offeneBestellungen === 0 ? "good" : "warn" },
        { label: "Buchhaltung", value: offeneRechnungen === 0 ? "ausgeglichen" : `${offeneRechnungen} offen`, tone: offeneRechnungen === 0 ? "good" : "warn" },
        { label: "Personal", value: offeneZeitbuchungen === 0 ? "aktuell" : `${offeneZeitbuchungen} zu prüfen`, tone: offeneZeitbuchungen === 0 ? "good" : "warn" }
    ];

    const lehrkraftKlassen = [
        { klasse: "BKF-11A", fortschritt: 72, offeneAufgaben: schuelerAufgaben.length + offeneRechnungen, bewertung: "solide" },
        { klasse: "BKF-11B", fortschritt: 58, offeneAufgaben: offeneBestellungen + offeneAnfragen, bewertung: "im Aufbau" },
        { klasse: "HBF-12", fortschritt: 81, offeneAufgaben: offeneFreigaben + offeneUrlaubsantraege, bewertung: "stark" }
    ];

    const lehrkraftAufgaben = [
        faelligeRechnungen > 0 && { title: "Überfällige Rechnungen besprechen", text: `${faelligeRechnungen} Rechnungen sind am ${today} bereits fällig und eignen sich für Offene-Posten- oder Mahnungsübungen.`, to: "/buchhaltung", action: "Buchhaltung öffnen" },
        offeneFreigaben > 0 && { title: "Offene Freigaben begleiten", text: `${offeneFreigaben} Freigaben warten auf eine Entscheidung und passen gut zu Führungs- oder Kooperationsfällen.`, to: "/freigaben", action: "Freigaben öffnen" },
        offeneUrlaubsantraege > 0 && { title: "Personalentscheidungen prüfen", text: `${offeneUrlaubsantraege} Urlaubsanträge können als einfacher Genehmigungsprozess besprochen werden.`, to: "/urlaubsantraege", action: "Urlaubsanträge öffnen" },
        offeneKrankmeldungen > 0 && { title: "Krankmeldungen mit Aktenbezug prüfen", text: `${offeneKrankmeldungen} Krankmeldungen sind noch nicht bestätigt und eignen sich für Aktenführung und Statusarbeit.`, to: "/krankmeldungen", action: "Krankmeldungen öffnen" },
        offeneZeitbuchungen > 0 && { title: "Zeitbuchungen freigeben", text: `${offeneZeitbuchungen} Arbeitszeiten sind erfasst, aber noch nicht freigegeben.`, to: "/arbeitszeiten", action: "Arbeitszeiten öffnen" },
        offeneBewerbungen > 0 && { title: "Bewerberprozess auswerten", text: `${offeneBewerbungen} Bewerbungen sind noch offen und können für Personalgespräche genutzt werden.`, to: "/bewerber", action: "Bewerber öffnen" }
    ].filter(Boolean);

    const bewertungsstand = [
        { label: "Fachlich sicher", value: `${lehrkraftKlassen.filter(item => item.fortschritt >= 75).length} Klassen` },
        { label: "Noch im Aufbau", value: `${lehrkraftKlassen.filter(item => item.fortschritt < 75).length} Klassen` },
        { label: "Geplante Schulungen", value: `${geplanteSchulungen}` }
    ];

    const unterrichtsimpulse = [
        { title: "Buchhaltung und Mahnung", text: "Offene oder fällige Rechnungen lassen sich mit Zahlungen, Mahnungen und Belegen im Zusammenhang besprechen.", to: "/buchhaltung" },
        { title: "Einkauf und Wareneingang", text: "Bestellung, Wareneingang und Eingangsrechnung eignen sich gut für eine einfache Prozesskette.", to: "/themen/einkauf" },
        { title: "Personal und Formulare", text: "Urlaubsanträge, Personalakte und Zeitbuchungen bieten einfache Verwaltungsfälle für die Klasse.", to: "/personalwesen" }
    ];

    const haeufigeFehler = [
        offeneRechnungen > 0 && "Rechnungen wurden angelegt, aber noch nicht in Zahlungen oder Mahnungen weitergeführt.",
        offeneBestellungen > 0 && "Bestellungen wurden erfasst, aber Wareneingänge noch nicht dokumentiert.",
        niedrigeBestaende > 0 && "Niedrige Bestände wurden erkannt, aber noch nicht mit Einkauf oder Lager verknüpft.",
        offeneFreigaben > 0 && "Freigaben bleiben offen, obwohl der Folgeprozess im Verkauf oder Marketing schon vorbereitet ist."
    ].filter(Boolean);

    return <div className="dashboard">
        <div className="dashboard-heading">
            <div>
                <h1>Dashboard</h1>
                <p>Willkommen, {user?.name || user?.username}. Startseite für Aufgaben, betriebliche Zusammenhänge und digitale Arbeitsabläufe.</p>
            </div>
            {hasPermission("*") && <button className="button-secondary dashboard-reset-button" onClick={testdatenZuruecksetzen}>Testdaten zurücksetzen</button>}
        </div>

        <div className="kennzahlen">
            <div className="kennzahl"><span>Offene Aufträge</span><strong>{offeneAuftraege}</strong></div>
            <div className="kennzahl"><span>Offene Rechnungen</span><strong>{offeneRechnungen}</strong></div>
            <div className="kennzahl"><span>Niedrige Bestände</span><strong>{niedrigeBestaende}</strong></div>
            <div className="kennzahl"><span>Offene Anfragen</span><strong>{offeneAnfragen}</strong></div>
            <div className="kennzahl"><span>Offene Freigaben</span><strong>{offeneFreigaben}</strong></div>
        </div>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Offene Aufgaben</h2>
                    <span>{schuelerAufgaben.length} relevant</span>
                </div>
                <div className="task-list">
                    {schuelerAufgaben.map(task => <div key={task.title} className="task-card">
                        <strong>{task.title}</strong>
                        <p>{task.text}</p>
                        <Link to={task.to}>{task.action}</Link>
                    </div>)}
                </div>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Hinweise der Lehrkraft</h2>
                    <span>{isTeacherView ? "Lehrkraftsicht" : "Lernhilfe"}</span>
                </div>
                <ul className="dashboard-note-list">
                    {hinweise.map(hinweis => <li key={hinweis}>{hinweis}</li>)}
                </ul>
                <div className="dashboard-mini-links">
                    <Link className="button-link" to="/themen/szenarien">Szenarien öffnen</Link>
                    <Link className="button-link" to="/geschaeftsfuehrung">Freigaben und Berichte</Link>
                </div>
            </article>
        </section>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Letzte Aktivitäten</h2>
                    <span>{letzteAktivitaeten.length} Einträge</span>
                </div>
                <div className="activity-list">
                    {letzteAktivitaeten.map(item => <Link key={`${item.title}-${item.date}`} className="activity-row" to={item.to}>
                        <span className="activity-date">{item.date}</span>
                        <div>
                            <strong>{item.title}</strong>
                            <p>{item.text}</p>
                        </div>
                    </Link>)}
                </div>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Status der Übungsfirma</h2>
                    <span>bereichsübergreifend</span>
                </div>
                <div className="status-grid">
                    {unternehmensstatus.map(item => <div key={item.label} className={`status-card tone-${item.tone}`}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                    </div>)}
                </div>
            </article>
        </section>

        <section className="prozess-einstiege">
            <h2>Prozesse für die Demo</h2>
            <div className="prozess-grid">
                {bereiche.filter(bereich => hasAccess(bereich.access)).map(bereich => (
                    <article className="prozess-karte" key={bereich.access}>
                        <h3>{bereich.title}</h3>
                        <p>{bereich.text}</p>
                        <Link to={bereich.to}>{bereich.link}</Link>
                    </article>
                ))}
            </div>
        </section>

        <section className="prozess-einstiege">
            <h2>Personal und Lernorganisation</h2>
            <div className="prozess-grid">
                <article className="prozess-karte">
                    <h3>Personalprozesse</h3>
                    <p>{mitarbeiter.length} Mitarbeiter, {bewerber.length} Bewerber, {offeneUrlaubsantraege} offene Urlaubsanträge und {offeneKrankmeldungen} neue Krankmeldungen bieten Anlässe für Akten- und Formulararbeit.</p>
                    <Link to="/personalwesen">Zum Personalwesen</Link>
                </article>
                <article className="prozess-karte">
                    <h3>Schulungen und Zeitbuchung</h3>
                    <p>{schulungen.length} Schulungen und {offeneZeitbuchungen} offene Zeitbuchungen können als Dokumentations- und Entscheidungsaufgabe genutzt werden.</p>
                    <Link to="/arbeitszeiten">Arbeitszeiten öffnen</Link>
                </article>
            </div>
        </section>

        {isTeacherView && <section className="prozess-einstiege">
            <h2>Lehrkraftsicht</h2>
            <div className="dashboard-two-column">
                <article className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <h2>Klassenübersicht</h2>
                        <span>Mockup</span>
                    </div>
                    <div className="teacher-class-list">
                        {lehrkraftKlassen.map(item => <div key={item.klasse} className="teacher-class-card">
                            <strong>{item.klasse}</strong>
                            <p>Fortschritt: {item.fortschritt}% · offene Aufgaben: {item.offeneAufgaben}</p>
                            <span>Bewertungsstand: {item.bewertung}</span>
                        </div>)}
                    </div>
                </article>

                <article className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <h2>Offene und überfällige Aufgaben</h2>
                        <span>Unterrichtsrelevant</span>
                    </div>
                    <div className="task-list">
                        {lehrkraftAufgaben.length === 0 ? <p>Aktuell gibt es keine offenen Lehrkraft-Aufgaben in den Demo-Daten.</p> : lehrkraftAufgaben.map(task => <div key={task.title} className="task-card">
                            <strong>{task.title}</strong>
                            <p>{task.text}</p>
                            <Link to={task.to}>{task.action}</Link>
                        </div>)}
                    </div>
                </article>
            </div>
            <div className="dashboard-two-column">
                <article className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <h2>Bewertungsstand</h2>
                        <span>Mockup-Auswertung</span>
                    </div>
                    <div className="status-grid">
                        {bewertungsstand.map(item => <div key={item.label} className="status-card tone-good">
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </div>)}
                    </div>
                </article>

                <article className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <h2>Häufige Fehler und Auswertungen</h2>
                        <span>Unterrichtsimpulse</span>
                    </div>
                    <ul className="dashboard-note-list">
                        {haeufigeFehler.length === 0 ? <li>Aktuell sind keine auffälligen Fehlerbilder in den Demo-Daten sichtbar.</li> : haeufigeFehler.map(item => <li key={item}>{item}</li>)}
                    </ul>
                    <div className="dashboard-mini-links">
                        <Link className="button-link" to="/berichte">Berichte prüfen</Link>
                        <Link className="button-link" to="/freigaben">Freigaben prüfen</Link>
                    </div>
                </article>
            </div>
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Empfohlene Unterrichtseinstiege</h2>
                    <span>Module</span>
                </div>
                <div className="task-list">
                    {unterrichtsimpulse.map(item => <div key={item.title} className="task-card">
                        <strong>{item.title}</strong>
                        <p>{item.text}</p>
                        <Link to={item.to}>Öffnen</Link>
                    </div>)}
                </div>
            </article>
        </section>}
    </div>;
}

export default Dashboard;

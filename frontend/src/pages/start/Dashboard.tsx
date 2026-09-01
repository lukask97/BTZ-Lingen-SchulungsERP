import { Link } from "react-router-dom";
import artikelService from "../../services/logistik/artikelService";
import arbeitszeitenService from "../../services/personalwesen/arbeitszeitenService";
import bewerberService from "../../services/personalwesen/bewerberService";
import bestellungenService from "../../services/einkauf/bestellungenService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import freigabenService from "../../services/gf/freigabenService";
import krankmeldungenService from "../../services/personalwesen/krankmeldungenService";
import mahnungenService from "../../services/buchhaltung/mahnungenService";
import mitarbeiterService from "../../services/personalwesen/mitarbeiterService";
import angeboteService from "../../services/verkauf/angeboteService";
import rechnungenService from "../../services/buchhaltung/rechnungenService";
import schulungenService from "../../services/personalwesen/schulungenService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import urlaubsantraegeService from "../../services/personalwesen/urlaubsantraegeService";
import versandService from "../../services/logistik/versandService";
import vertriebsdokumenteService from "../../services/verkauf/vertriebsdokumenteService";
import zahlungenService from "../../services/buchhaltung/zahlungenService";
import { ACCESS } from "../../constants/permissions";
import useAuth from "../../auth/useAuth";
import { getBerlinDate } from "../../utils/dateTime";
import { getUnifiedOpenItems, isOpenItem, isOverdueOpenItem, isPendingPayment, isOverduePayment } from "../../utils/openItems";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";

const DASHBOARD_AREAS = [
    { access: ACCESS.EINKAUF, title: "Einkauf", text: "Lieferanten vergleichen, Bestellungen anlegen und Wareneingänge bearbeiten.", to: "/themen/einkauf", link: "Zum Einkauf" },
    { access: ACCESS.VERKAUF, title: "Verkauf", text: "Kundenanfragen, Angebote und Aufträge miteinander verknüpfen.", to: "/themen/verkauf", link: "Zum Verkauf" },
    { access: ACCESS.BUCHHALTUNG, title: "Buchhaltung", text: "Rechnungen, Zahlungen, Mahnungen und Belege einfach einordnen.", to: "/buchhaltung", link: "Zur Buchhaltung" },
    { access: ACCESS.PERSONALWESEN, title: "Personal", text: "Mitarbeiter, Personalakte und Formulare im Zusammenhang bearbeiten.", to: "/personalwesen", link: "Zum Personal" },
    { access: ACCESS.MARKETING, title: "Marketing", text: "Aktionen, Feedback und Events als Zusatzbereich dokumentieren.", to: "/marketing", link: "Zum Marketing" },
    { access: ACCESS.LOGISTIK, title: "Logistik", text: "Versand, Lager und Retouren als unterstützende Bereiche nutzen.", to: "/logistik", link: "Zur Logistik" }
];

function dateScore(dateValue = "") {
    return Number(String(dateValue).replaceAll("-", "")) || 0;
}

function buildUniqueActivityKeys(items) {
    const seenKeys = new Map();

    return items.map((item, index) => {
        const baseKey = String(
            item.key
            || [item.title, item.date, item.text, item.to].filter(Boolean).join("-")
            || `activity-${index}`
        );
        const occurrence = seenKeys.get(baseKey) || 0;
        seenKeys.set(baseKey, occurrence + 1);

        return {
            ...item,
            key: occurrence === 0 ? baseKey : `${baseKey}-${occurrence + 1}`
        };
    });
}

function withFallback<T>(reader: () => T, fallback: T) {
    try {
        return reader();
    } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (
            error instanceof Error
            && (
                error.message.startsWith("Keine Berechtigung")
                || message.includes("failed to fetch")
                || message.includes("backend nicht erreichbar")
                || message.includes("networkerror")
                || message.includes("api request failed with status 5")
                || message.includes("internal server error")
                || message.includes("api request failed with status 404")
                || message.includes("nicht vorbereitet")
            )
        ) {
            return fallback;
        }

        throw error;
    }
}

function loadIf<T>(enabled: boolean, reader: () => T, fallback: T) {
    if (!enabled) {
        return fallback;
    }

    return withFallback(reader, fallback);
}

function buildTask(title, count, text, to, action) {
    if (count <= 0) {
        return null;
    }

    return { title, text, to, action };
}

function buildStatusItem(label, count, emptyValue, activeSuffix) {
    return {
        label,
        value: count === 0 ? emptyValue : `${count} ${activeSuffix}`,
        tone: count === 0 ? "good" : "warn"
    };
}

function buildTeacherAlert(label, count) {
    return {
        label,
        count,
        tone: count > 0 ? "warn" : "good"
    };
}

function Dashboard() {
    const today = getBerlinDate();
    useDataSyncRefresh([
        "auftraege", "angebote", "bestellungen", "kundenanfragen", "vertriebsdokumente",
        "zahlungen", "mahnungen", "freigaben", "artikel", "urlaubsantraege",
        "krankmeldungen", "arbeitszeiten", "schulungen", "bewerber", "mitarbeiter"
    ]);

    const { user, hasAccess, hasFullAccess } = useAuth();
    const isTeacherView = hasFullAccess();
    const canReadVerkauf = hasAccess(ACCESS.VERKAUF);
    const canReadBuchhaltung = hasAccess(ACCESS.BUCHHALTUNG);
    const canReadEinkauf = hasAccess(ACCESS.EINKAUF);
    const canReadArtikel = hasAccess(ACCESS.ARTIKEL);
    const canReadGf = hasAccess(ACCESS.GESCHAEFTSFUEHRUNG);
    const canReadLogistik = hasAccess(ACCESS.LOGISTIK);
    const canReadPersonal = hasAccess(ACCESS.PERSONALWESEN);

    const auftraege = loadIf(canReadVerkauf, () => auftraegeService.getAll(), []);
    const angebote = loadIf(canReadVerkauf, () => angeboteService.getAll(), []);
    const rechnungen = loadIf(canReadBuchhaltung || canReadVerkauf, () => rechnungenService.getAll(), []);
    const bestellungen = loadIf(canReadEinkauf, () => bestellungenService.list(), []);
    const artikel = loadIf(canReadArtikel, () => artikelService.getAll(), []);
    const anfragen = loadIf(canReadVerkauf, () => customerInquiryService.list(), []);
    const freigaben = loadIf(canReadGf, () => freigabenService.list(), []);
    const versandauftraege = loadIf(canReadLogistik, () => versandService.list(), []);
    const vertriebsdokumente = loadIf(canReadVerkauf, () => vertriebsdokumenteService.list(), []);
    const zahlungen = loadIf(canReadBuchhaltung, () => zahlungenService.list(), []);
    const urlaubsantraege = loadIf(canReadPersonal, () => urlaubsantraegeService.list(), []);
    const krankmeldungen = loadIf(canReadPersonal, () => krankmeldungenService.list(), []);
    const arbeitszeiten = loadIf(canReadPersonal, () => arbeitszeitenService.list(), []);
    const schulungen = loadIf(canReadPersonal, () => schulungenService.list(), []);
    const bewerber = loadIf(canReadPersonal, () => bewerberService.list(), []);
    const mahnungen = loadIf(canReadBuchhaltung, () => mahnungenService.list(), []);
    const mitarbeiter = loadIf(canReadPersonal, () => mitarbeiterService.list(), []);

    const offeneAuftraege = auftraege.filter(auftrag => auftrag.status === "offen").length;
    const offenePosten = getUnifiedOpenItems(rechnungen, zahlungen).length;
    const offeneDebitorenPosten = rechnungen.filter(item => item.rechnungstyp !== "Eingangsrechnung" && isOpenItem(item)).length
        + zahlungen.filter(item => item.zahlungsart !== "Ausgang" && isPendingPayment(item)).length;
    const offeneKreditorenPosten = rechnungen.filter(item => item.rechnungstyp === "Eingangsrechnung" && isOpenItem(item)).length
        + zahlungen.filter(item => item.zahlungsart === "Ausgang" && isPendingPayment(item)).length;
    const niedrigeBestaende = artikel.filter(item => Number(item.bestand) < 10).length;
    const offeneAnfragen = anfragen.filter(item => item.status === "offen").length;
    const offeneLehrkraftAnfragen = anfragen.filter(item => !["erledigt", "archiviert"].includes(String(item.status || "").toLowerCase())).length;
    const offeneLehrkraftAngebote = angebote.filter(item => !["angenommen", "abgelehnt", "beendet"].includes(String(item.status || "").toLowerCase())).length;
    const offeneWarenannahmen = vertriebsdokumente.filter(item =>
        ["lieferschein", "warenbegleitpapier", "transportpapier"].includes(String(item.dokumentTyp || "").toLowerCase())
        && String(item.status || "").toLowerCase() !== "versendet"
    ).length;
    const offeneFreigaben = freigaben.filter(item => item.status === "offen").length;
    const offeneBestellungen = bestellungen.filter(item => item.status !== "eingegangen").length;
    const offeneWareneingaengeEinkauf = bestellungen.filter(item => item.status === "versendet").length;
    const offeneUrlaubsantraege = urlaubsantraege.filter(item => item.status === "offen").length;
    const offeneKrankmeldungen = krankmeldungen.filter(item => item.status === "eingegangen").length;
    const offeneZeitbuchungen = arbeitszeiten.filter(item => item.status === "erfasst").length;
    const ueberfaelligePosten = rechnungen.filter(isOverdueOpenItem).length + zahlungen.filter(isOverduePayment).length;
    const offeneBewerbungen = bewerber.filter(item => item.status === "eingegangen").length;
    const geplanteSchulungen = schulungen.filter(item => item.status === "geplant").length;
    const kennzahlen = [
        { label: "Offene Aufträge", value: offeneAuftraege },
        { label: "Offene Posten gesamt", value: offenePosten },
        { label: "Offene Posten (Debitor)", value: offeneDebitorenPosten },
        { label: "Offene Posten (Kreditor)", value: offeneKreditorenPosten },
        { label: "Offene Anfragen", value: offeneAnfragen },
        { label: "Offene Freigaben", value: offeneFreigaben }
    ];

    const schuelerAufgaben = [
        buildTask("Kundenanfragen beantworten", offeneAnfragen, `${offeneAnfragen} Anfragen warten auf Bearbeitung oder Rückmeldung.`, "/kundenanfragen", "Anfragen öffnen"),
        buildTask("Aufträge weiterbearbeiten", offeneAuftraege, `${offeneAuftraege} Aufträge sind noch offen und können geprüft oder versendet werden.`, "/auftraege", "Aufträge prüfen"),
        buildTask("Wareneingänge vorbereiten", offeneWareneingaengeEinkauf, `${offeneWareneingaengeEinkauf} Bestellungen wurden versendet und können jetzt als Wareneingang gebucht werden.`, "/wareneingaenge", "Wareneingänge ansehen"),
        buildTask("Offene Posten prüfen", offenePosten, `${offenePosten} Posten sind intern noch nicht geklärt oder ausgeglichen.`, "/buchhaltung", "Offene Posten öffnen"),
        buildTask("Personalvorgänge prüfen", offeneUrlaubsantraege, `${offeneUrlaubsantraege} Urlaubsanträge warten auf eine Entscheidung.`, "/urlaubsantraege", "Anträge öffnen"),
        buildTask("Krankmeldungen bestätigen", offeneKrankmeldungen, `${offeneKrankmeldungen} Krankmeldungen sind neu eingegangen und sollten in Akte und Status übernommen werden.`, "/krankmeldungen", "Krankmeldungen öffnen"),
        buildTask("Freigaben nachvollziehen", offeneFreigaben, `${offeneFreigaben} Freigaben können als Führungsentscheidung betrachtet werden.`, "/freigaben", "Freigaben öffnen")
    ].filter(Boolean);

    const letzteAktivitaeten = buildUniqueActivityKeys([
        ...auftraege.map(item => ({ key: `auftrag-${item.id || item.auftragNr || item.datum}`, date: item.datum, title: `Auftrag ${item.auftragNr}`, text: `${item.kunde} Â· Status ${item.status}`, to: "/auftraege" })),
        ...rechnungen.map(item => ({ key: `rechnung-${item.id || item.rechnungsnr || item.datum}`, date: item.datum, title: `Offener Posten ${item.rechnungsnr}`, text: `${item.kunde} Â· ${isOpenItem(item) ? "offen" : item.status}`, to: "/rechnungen" })),
        ...zahlungen.filter(isPendingPayment).map(item => ({ key: `zahlung-${item.id || item.rechnungsnr || item.datum}`, date: item.ausfuehrenAm || item.datum, title: `Geplante Zahlung ${item.rechnungsnr}`, text: `${item.kunde} Â· ${item.status}`, to: "/zahlungen" })),
        ...bestellungen.map(item => ({ key: `bestellung-${item.id || item.bestellNr || item.datum}`, date: item.datum, title: `Bestellung ${item.bestellNr}`, text: `${item.lieferant} Â· ${item.status}`, to: "/bestellungen" })),
        ...versandauftraege.map(item => ({ key: `versand-${item.id || item.versandNr || item.datum}`, date: item.datum, title: `Versand ${item.versandNr}`, text: `${item.auftrag} Â· ${item.status}`, to: "/versand" })),
        ...anfragen.map(item => ({ key: `anfrage-${item.id || item.vorgangId || item.kunde || item.typ || "unbekannt"}-${item.datum || "ohne-datum"}`, date: item.datum, title: `Kundenanfrage ${item.typ}`, text: `${item.kunde} Â· ${item.status}`, to: "/kundenanfragen" })),
        ...mahnungen.map(item => ({ key: `mahnung-${item.id || item.rechnungsnr || item.datum}`, date: item.datum, title: `Mahnung ${item.rechnungsnr}`, text: `${item.kunde} Â· ${item.stufe}`, to: "/mahnungen" }))
    ].sort((a, b) => dateScore(b.date) - dateScore(a.date)).slice(0, 6));

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
        buildStatusItem("Vertrieb", offeneAuftraege, "stabil", "offen"),
        buildStatusItem("Einkauf", offeneBestellungen, "geordnet", "aktiv"),
        buildStatusItem("Buchhaltung", offenePosten, "ausgeglichen", "offen"),
        buildStatusItem("Personal", offeneZeitbuchungen, "aktuell", "zu prüfen")
    ];

    const lehrkraftKlassen = [
        { klasse: "BKF-11A", fortschritt: 72, offeneAufgaben: schuelerAufgaben.length + offenePosten, bewertung: "solide" },
        { klasse: "BKF-11B", fortschritt: 58, offeneAufgaben: offeneBestellungen + offeneAnfragen, bewertung: "im Aufbau" },
        { klasse: "HBF-12", fortschritt: 81, offeneAufgaben: offeneFreigaben + offeneUrlaubsantraege, bewertung: "stark" }
    ];

    const lehrkraftAufgaben = [
        buildTask("Kundenanfragen beantworten", offeneLehrkraftAnfragen, `${offeneLehrkraftAnfragen} externe Anfragen oder Rückmeldungen warten auf Antwort oder Einordnung.`, "/lehrkraft/kundenkorrespondenz", "Kundenkorrespondenz öffnen"),
        buildTask("Angebote prüfen", offeneLehrkraftAngebote, `${offeneLehrkraftAngebote} Angebote warten auf Annahme, Ablehnung oder Rückmeldung des Kunden.`, "/lehrkraft/kundenkorrespondenz", "Offene Angebote öffnen"),
        buildTask("Warenannahme rückmelden", offeneWarenannahmen, `${offeneWarenannahmen} Liefer- oder Transportunterlagen warten noch auf die externe Rückmeldung der Lehrkraft.`, "/lehrkraft/kundenkorrespondenz", "Warenannahmen öffnen"),
        buildTask("Überfällige Posten besprechen", ueberfaelligePosten, `${ueberfaelligePosten} Posten sind am ${today} bereits fällig und eignen sich für Offene-Posten- oder Mahnungsübungen.`, "/buchhaltung", "Buchhaltung öffnen"),
        buildTask("Offene Freigaben begleiten", offeneFreigaben, `${offeneFreigaben} Freigaben warten auf eine Entscheidung und passen gut zu Führungs- oder Kooperationsfällen.`, "/freigaben", "Freigaben öffnen"),
        buildTask("Personalentscheidungen prüfen", offeneUrlaubsantraege, `${offeneUrlaubsantraege} Urlaubsanträge können als einfacher Genehmigungsprozess besprochen werden.`, "/urlaubsantraege", "Urlaubsanträge öffnen"),
        buildTask("Krankmeldungen mit Aktenbezug prüfen", offeneKrankmeldungen, `${offeneKrankmeldungen} Krankmeldungen sind noch nicht bestätigt und eignen sich für Aktenführung und Statusarbeit.`, "/krankmeldungen", "Krankmeldungen öffnen"),
        buildTask("Zeitbuchungen freigeben", offeneZeitbuchungen, `${offeneZeitbuchungen} Arbeitszeiten sind erfasst, aber noch nicht freigegeben.`, "/arbeitszeiten", "Arbeitszeiten öffnen"),
        buildTask("Bewerberprozess auswerten", offeneBewerbungen, `${offeneBewerbungen} Bewerbungen sind noch offen und können für Personalgespräche genutzt werden.`, "/bewerber", "Bewerber öffnen")
    ].filter(Boolean);
    const lehrkraftWarnstatus = [
        buildTeacherAlert("Offene Anfragen", offeneLehrkraftAnfragen),
        buildTeacherAlert("Offene Angebote", offeneLehrkraftAngebote),
        buildTeacherAlert("Offene Warenannahmen", offeneWarenannahmen)
    ];

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
        offenePosten > 0 && "Offene Posten wurden intern noch nicht in Zahlungen, Mahnungen oder Belege weitergeführt.",
        offeneBestellungen > 0 && "Bestellungen wurden erfasst, aber Wareneingänge noch nicht dokumentiert.",
        niedrigeBestaende > 0 && "Niedrige Bestände wurden erkannt, aber noch nicht mit Einkauf oder Lager verknüpft.",
        offeneFreigaben > 0 && "Freigaben bleiben offen, obwohl der Folgeprozess im Verkauf oder Marketing schon vorbereitet ist."
    ].filter(Boolean);

    return <div className="dashboard">
        <div className="dashboard-heading">
            <div>
                <h1>Dashboard</h1>
                <p>Willkommen, {user.name || user.username}. Startseite für Aufgaben, betriebliche Zusammenhänge und digitale Arbeitsabläufe.</p>
            </div>
        </div>

        <div className="kennzahlen">
            {kennzahlen.map(item => <div key={item.label} className="kennzahl"><span>{item.label}</span><strong>{item.value}</strong></div>)}
        </div>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Offene Aufgaben</h2>
                    <span>{schuelerAufgaben.length} relevant</span>
                </div>
                <div className="task-list">
                    {schuelerAufgaben.map((task, index) => <div key={`${task.title}-${task.to}-${index}`} className="task-card">
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
                    {letzteAktivitaeten.map(item => <Link key={item.key} className="activity-row" to={item.to}>
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
                {DASHBOARD_AREAS.filter(bereich => hasAccess(bereich.access)).map(bereich => (
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
                            <p>Fortschritt: {item.fortschritt}% Â· offene Aufgaben: {item.offeneAufgaben}</p>
                            <span>Bewertungsstand: {item.bewertung}</span>
                        </div>)}
                    </div>
                </article>

                <article className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <h2>Offene und überfällige Aufgaben</h2>
                        <span>Unterrichtsrelevant</span>
                    </div>
                    <div className="status-grid">
                        {lehrkraftWarnstatus.map(item => <div key={item.label} className={`status-card tone-${item.tone}`}>
                            <span>{item.label}</span>
                            <strong>{item.count}</strong>
                        </div>)}
                    </div>
                    <div className="task-list">
                        {lehrkraftAufgaben.length === 0 ? (
                            <p>Aktuell gibt es keine offenen Lehrkraft-Aufgaben in den Demo-Daten.</p>
                        ) : (
                            lehrkraftAufgaben.map((task, index) => (
                                <div key={`${task.title}-${task.to}-${index}`} className="task-card">
                                    <strong>{task.title}</strong>
                                    <p>{task.text}</p>
                                    <Link to={task.to}>{task.action}</Link>
                                </div>
                            ))
                        )}
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
                        {haeufigeFehler.length === 0 ? (
                            <li>Aktuell sind keine auffaelligen Fehlerbilder in den Demo-Daten sichtbar.</li>
                        ) : (
                            haeufigeFehler.map(item => <li key={item}>{item}</li>)
                        )}
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



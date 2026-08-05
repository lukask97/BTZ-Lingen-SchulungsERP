import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import OfferApprovalDialog from "../../components/OfferApprovalDialog";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import OverviewCards from "../../components/OverviewCards";
import freigabenService from "../../services/gf/freigabenService";
import artikelService from "../../services/logistik/artikelService";
import angeboteService from "../../services/verkauf/angeboteService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import customerInquiryService from "../../services/verkauf/customerInquiryService";
import servicesService from "../../services/verkauf/servicesService";
import nachrichtenService, { listNachrichtenZuVorgang } from "../../services/verkauf/nachrichtenService";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate, getBerlinTimestamp } from "../../utils/dateTime";
import { getOffersForVorgang, getVorgangId } from "../../utils/processFlow";
import { openDocumentPdf } from "../../utils/documentPdf";

const bereichOptionen = [
    { value: "verkauf", label: "Verkauf" },
    { value: "einkauf", label: "Einkauf" },
    { value: "buchhaltung", label: "Buchhaltung" },
    { value: "marketing", label: "Marketing" },
    { value: "logistik", label: "Logistik" },
    { value: "personalwesen", label: "Personalwesen" }
];

const bereichLinks = {
    verkauf: "/themen/verkauf",
    einkauf: "/themen/einkauf",
    buchhaltung: "/buchhaltung",
    marketing: "/marketing",
    logistik: "/logistik",
    personalwesen: "/personalwesen"
};

function createEmptyFreigabe(today: string) {
    return {
        titel: "",
        bereich: "verkauf",
        verantwortung: "Geschaeftsfuehrung",
        status: "offen",
        datum: today,
        bezug: "",
        notiz: ""
    };
}

function resolveOfferForFreigabe(item, angebote = []) {
    if (!item) return null;

    if (item.angebotId) {
        const directMatch = angebote.find(angebot => String(angebot.id) === String(item.angebotId));
        if (directMatch) return directMatch;
    }

    if (item.vorgangId) {
        const vorgangMatch = angebote.find(angebot => String(angebot.vorgangId || "") === String(item.vorgangId));
        if (vorgangMatch) return vorgangMatch;
    }

    if (item.anfrageId) {
        const anfrageMatch = angebote.find(angebot => String(angebot.anfrageId || "") === String(item.anfrageId));
        if (anfrageMatch) return anfrageMatch;
    }

    if (item.bezug) {
        const bezugMatch = angebote.find(angebot => String(angebot.angebotsNr || "") === String(item.bezug));
        if (bezugMatch) return bezugMatch;
    }

    return null;
}

export default function Freigaben() {
    const today = getBerlinDate();
    const [freigaben, setFreigaben] = useSyncedServiceData(["freigaben"], () => freigabenService.list());
    const [angebote] = useSyncedServiceData(["angebote"], () => angeboteService.getAll());
    const [artikel] = useSyncedServiceData(["artikel"], () => artikelService.getAll());
    const [services] = useSyncedServiceData(["services"], () => servicesService.getAll());
    const [auftraege] = useSyncedServiceData(["auftraege"], () => auftraegeService.getAll());
    const [open, setOpen] = useState(false);
    const [approvalOpen, setApprovalOpen] = useState(false);
    const [approvalNote, setApprovalNote] = useState("");
    const [selectedFreigabe, setSelectedFreigabe] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [current, setCurrent] = useState(createEmptyFreigabe(today));

    const aktuellesAngebot = useMemo(
        () => resolveOfferForFreigabe(selectedFreigabe, angebote),
        [angebote, selectedFreigabe]
    );

    const verplanteMengen = useMemo(
        () => auftraege
            .filter(auftrag => ["offen", "abgerechnet"].includes(String(auftrag.status || "").toLowerCase()))
            .reduce((map, auftrag) => {
                (auftrag.positionen || [])
                    .filter(position => position.leistungTyp !== "Service" && position.artikelId)
                    .forEach(position => {
                        const key = String(position.artikelId);
                        map[key] = Number(map[key] || 0) + Number(position.menge || 0);
                    });
                return map;
            }, {}),
        [auftraege]
    );

    const offeneAngeboteJeArtikel = useMemo(
        () => angebote
            .filter(angebot => ["wartet auf antwort"].includes(String(angebot?.status || "").toLowerCase()))
            .reduce((map, angebot) => {
                const artikelIds = new Set(
                    (angebot.positionen || [])
                        .filter(position => String(position.leistungTyp || "").toLowerCase() !== "service" && position.artikelId)
                        .map(position => String(position.artikelId))
                );
                artikelIds.forEach(artikelId => {
                    map[artikelId] = Number(map[artikelId] || 0) + 1;
                });
                return map;
            }, {}),
        [angebote]
    );

    const sichtbareFreigaben = useMemo(
        () => freigaben.filter(item => String(item.status || "").toLowerCase() !== "freigegeben"),
        [freigaben]
    );

    const neu = () => {
        setCurrent(createEmptyFreigabe(today));
        setEditMode(false);
        setOpen(true);
    };

    const bearbeiten = item => {
        setCurrent({ ...item, datum: item.datum || today, bezug: item.bezug || "", notiz: item.notiz || "" });
        setEditMode(true);
        setOpen(true);
    };

    const speichern = () => {
        if (!current.titel.trim()) return;
        const payload = {
            ...current,
            titel: current.titel.trim(),
            bezug: current.bezug.trim(),
            notiz: current.notiz.trim()
        };

        if (editMode) freigabenService.update(current.id, payload);
        else freigabenService.create(payload);

        setFreigaben(freigabenService.list());
        setOpen(false);
        setEditMode(false);
    };

    const angebotAlsPdf = angebot => {
        if (!angebot) return;
        openDocumentPdf({
            title: `Angebot ${angebot.angebotsNr}`,
            subject: "Automatisch erzeugtes Angebotsdokument fuer den Schulungseinsatz.",
            date: angebot.datum,
            note: angebot.verguenstigungsGrund || "Kein zusaetzlicher Hinweis hinterlegt.",
            referenceLabel: "Angebot",
            referenceValue: angebot.angebotsNr,
            partnerLabel: "Kunde",
            partnerValue: angebot.kunde,
            positions: angebot.positionen || [],
            preispositionen: angebot.preispositionen || [],
            deductionAmount: angebot.rabattBetrag || 0,
            deductionReason: angebot.verguenstigungsGrund || ""
        });
    };

    const sendeAngebotAnKunden = angebot => {
        if (!angebot?.anfrageId) return;
        const anfrage = customerInquiryService.getById(angebot.anfrageId);
        if (!anfrage) return;
        const text = `Wir senden Ihnen das Angebot ${angebot.angebotsNr} zur Pruefung zu.`;

        nachrichtenService.create({
            vorgangId: getVorgangId(angebot) || getVorgangId(anfrage),
            anfrageId: anfrage.id,
            angebotId: angebot.id,
            kundeId: angebot.kundeId || anfrage.kundeId || "",
            datum: today,
            zeitpunkt: getBerlinTimestamp(),
            senderRolle: "Verkauf",
            senderName: "Schuelerfirma Verkauf",
            kanal: anfrage.kanal || "E-Mail",
            betreff: `Angebot ${angebot.angebotsNr}`,
            nachricht: text,
            typ: "Angebot"
        });

        customerInquiryService.update({
            ...anfrage,
            status: "beantwortet",
            angebotId: angebot.id,
            antwort: text,
            beantwortetAm: today
        });
    };

    const freigeben = item => {
        freigabenService.update({ ...item, status: "freigegeben", notiz: approvalNote.trim() || item.notiz || "" });
        const angebot = resolveOfferForFreigabe(item, angebote);
        if (angebot) {
            const aktualisiert = {
                ...angebot,
                freigabeStatus: "freigegeben",
                freigabeNotiz: approvalNote.trim() || item.notiz || "",
                freigegebenVon: "gf",
                direktSendenGewuenscht: true,
                status: "wartet auf Antwort"
            };
            angeboteService.update(aktualisiert);
            if (aktualisiert.anfrageId) {
                sendeAngebotAnKunden(aktualisiert);
            }
        }
        setFreigaben(freigabenService.list());
        setApprovalOpen(false);
        setSelectedFreigabe(null);
        setApprovalNote("");
    };

    const zurUeberarbeitungZurueckgeben = (item, freigabeStatus = "angefragt", freigabeDecision = "offen") => {
        freigabenService.update({ ...item, status: freigabeDecision, notiz: approvalNote.trim() || item.notiz || "" });
        const angebot = resolveOfferForFreigabe(item, angebote);
        if (angebot) {
            angeboteService.update({
                ...angebot,
                freigabeStatus,
                freigabeNotiz: approvalNote.trim() || item.notiz || "",
                status: "in Vorbereitung",
                direktSendenGewuenscht: false
            });
            nachrichtenService.create({
                vorgangId: angebot.vorgangId || item.vorgangId || "",
                anfrageId: angebot.anfrageId || item.anfrageId || "",
                angebotId: angebot.id,
                kundeId: angebot.kundeId || "",
                datum: today,
                zeitpunkt: getBerlinTimestamp(),
                senderRolle: "Geschaeftsfuehrung",
                senderName: "Geschaeftsfuehrung",
                betreff: `Ueberarbeitung ${angebot.angebotsNr}`,
                nachricht: `Bitte Angebot ${angebot.angebotsNr} ueberarbeiten. Hinweis: ${approvalNote.trim() || item.notiz || ""}`,
                typ: "Interne Freigabe"
            });
        }
        setFreigaben(freigabenService.list());
        setApprovalOpen(false);
        setSelectedFreigabe(null);
        setApprovalNote("");
    };

    const ablehnen = item => {
        zurUeberarbeitungZurueckgeben(item, "intern_abgelehnt", "abgelehnt");
    };

    const loeschen = item => {
        freigabenService.remove(item.id);
        setFreigaben(freigabenService.list());
    };

    const freigabePruefen = item => {
        setSelectedFreigabe(item);
        setApprovalNote(String(item.notiz || ""));
        setApprovalOpen(true);
    };

    const getVerfuegbarkeitFuerPosition = position => {
        if (position.leistungTyp === "Service") {
            const serviceEintrag = services.find(item => String(item.id) === String(position.serviceId || position.artikelId || ""));
            const berechnungstyp = String(position.berechnungstyp || serviceEintrag?.berechnungstyp || "Pauschal");
            const zeEinheit = String(position.zeEinheit || serviceEintrag?.zeEinheit || "").trim();
            return {
                text: berechnungstyp === "ZE" && zeEinheit
                    ? `Berechnungstyp: ${berechnungstyp} | Zeiteinheit: ${zeEinheit}`
                    : `Berechnungstyp: ${berechnungstyp}`,
                istKritisch: false
            };
        }

        const artikelEintrag = artikel.find(item => String(item.id) === String(position.artikelId));
        const bestand = Number(artikelEintrag?.bestand || 0);
        const verplant = Number(verplanteMengen[String(position.artikelId)] || 0);
        const verfuegbar = bestand - verplant;
        const inAngeboten = Number(offeneAngeboteJeArtikel[String(position.artikelId)] || 0);

        return {
            text: `Verfuegbar: ${verfuegbar} | Bestand: ${bestand} | Reserviert: ${verplant} | In Angeboten: ${inAngeboten}`,
            istKritisch: Number(position.menge || 0) > verfuegbar
        };
    };

    return <>
        <OverviewCards cards={[
            { label: "Freigaben", value: sichtbareFreigaben.length },
            { label: "Offen", value: sichtbareFreigaben.filter(item => item.status === "offen").length },
            { label: "Abgelehnt", value: sichtbareFreigaben.filter(item => item.status === "abgelehnt").length }
        ]}/>
        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Freigaben im Unterricht</h2>
                    <span>Lehrkraftsicht</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Freigaben zeigen vereinfachte Fuehrungsentscheidungen zu Rabatten, Aktionen oder Sonderfaellen.</li>
                    <li>Die Entscheidung muss begruendet und im Vorgang sichtbar dokumentiert werden.</li>
                    <li>Fuer Angebote steht derselbe Pruef-Dialog wie im Verkauf zur Verfuegung.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Schnelleinstiege</h2>
                    <span>Querverweise</span>
                </div>
                <div className="link-list">
                    <Link className="button-link" to="/geschaeftsfuehrung">Geschaeftsfuehrung</Link>
                    <Link className="button-link" to="/berichte">Berichte</Link>
                    <Link className="button-link" to="/themen/szenarien">Fallakten</Link>
                </div>
            </article>
        </section>
        <DataTable
            title="Freigaben"
            selectableColumns={false}
            data={sichtbareFreigaben}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "titel", title: "Vorgang" },
                { field: "bereich", title: "Bereich", render: row => bereichLinks[row.bereich] ? <Link className="detail-link" to={bereichLinks[row.bereich]}>{row.bereich}</Link> : row.bereich },
                { field: "bezug", title: "Bezug" },
                { field: "verantwortung", title: "Verantwortung" },
                { field: "status", title: "Status" },
                { field: "notiz", title: "Notiz" }
            ]}
            detailLinkResolver={({ field, row }) => field === "bereich" ? bereichLinks[row.bereich] || null : null}
            toolbarActions={[{ name: "new", label: "Freigabe anlegen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "edit", label: "Bearbeiten", permission: PERMISSIONS.GF_BEARBEITEN, onClick: bearbeiten, variant: "secondary" },
                { name: "review", label: "Pruefen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: freigabePruefen, variant: "success", isVisible: row => row.status === "offen" && !!resolveOfferForFreigabe(row, angebote) },
                { name: "approve", label: "Freigeben", permission: PERMISSIONS.GF_BEARBEITEN, onClick: freigeben, variant: "success", isVisible: row => row.status === "offen" && !resolveOfferForFreigabe(row, angebote) },
                { name: "reject", label: "Ablehnen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: ablehnen, variant: "danger", isVisible: row => row.status === "offen" && !resolveOfferForFreigabe(row, angebote) },
                { name: "delete", label: "Loeschen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: loeschen, variant: "danger" }
            ]}
        />
        <Dialog open={open} title={editMode ? "Freigabe bearbeiten" : "Freigabe anlegen"} onClose={() => setOpen(false)}>
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label>Stammdaten</Label>
                </div>
                <div className="thread-form-grid">
                    <div><Label>Titel</Label><TextField value={current.titel} onChange={value => setCurrent(item => ({ ...item, titel: value }))}/></div>
                    <div><Label>Bereich</Label><select value={current.bereich} onChange={event => setCurrent(item => ({ ...item, bereich: event.target.value }))}>
                        {bereichOptionen.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select></div>
                    <div><Label>Verantwortung</Label><TextField value={current.verantwortung} onChange={value => setCurrent(item => ({ ...item, verantwortung: value }))}/></div>
                </div>
            </div>
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label>Vorgangsdaten</Label>
                </div>
                <div className="thread-form-grid">
                    <div><Label>Datum</Label><TextField type="date" value={current.datum} onChange={value => setCurrent(item => ({ ...item, datum: value }))}/></div>
                    <div><Label>Bezug</Label><TextField value={current.bezug} onChange={value => setCurrent(item => ({ ...item, bezug: value }))}/></div>
                    <div><Label>Status</Label><select value={current.status} onChange={event => setCurrent(item => ({ ...item, status: event.target.value }))}>
                        <option value="offen">offen</option>
                        <option value="freigegeben">freigegeben</option>
                        <option value="abgelehnt">abgelehnt</option>
                    </select></div>
                </div>
            </div>
            <div className="form-row thread-section">
                <div className="thread-section-header">
                    <Label>Notiz</Label>
                </div>
                <TextArea rows={3} value={current.notiz} onChange={value => setCurrent(item => ({ ...item, notiz: value }))}/>
            </div>
            <div className="form-row thread-section thread-dialog-footer">
                <div className="thread-section-header">
                    <Label>Aktionen</Label>
                </div>
                <div className="thread-document-links">
                    <button type="button" onClick={speichern}>{editMode ? "Aenderungen speichern" : "Speichern"}</button>
                </div>
            </div>
        </Dialog>
        {selectedFreigabe && aktuellesAngebot && <OfferApprovalDialog
            open={approvalOpen}
            title="Freigabe pruefen"
            onClose={() => {
                setApprovalOpen(false);
                setSelectedFreigabe(null);
                setApprovalNote("");
            }}
            kunde={aktuellesAngebot.kunde}
            vorgangId={aktuellesAngebot.vorgangId || selectedFreigabe.vorgangId || ""}
            status={selectedFreigabe.status}
            currentOfferLabel={aktuellesAngebot.angebotsNr}
            currentOfferAmount={`${Number(aktuellesAngebot.gesamtbetrag || 0).toFixed(2)} EUR`}
            currentOfferNote={aktuellesAngebot.verguenstigungsGrund || selectedFreigabe.notiz || ""}
            discountLabel={Number(aktuellesAngebot.rabattBetrag || 0) > 0 ? `${Number(aktuellesAngebot.rabattBetrag || 0).toFixed(2)} EUR` : "Keine"}
            totalAmountLabel={`${Number(aktuellesAngebot.gesamtbetrag || 0).toFixed(2)} EUR`}
            onOpenCurrentOffer={() => angebotAlsPdf(aktuellesAngebot)}
            positionInfos={(aktuellesAngebot.positionen || []).map((position, index) => {
                const verfuegbarkeit = getVerfuegbarkeitFuerPosition(position);
                return {
                    id: `${position.leistungTyp || "position"}-${position.artikelId || position.serviceId || index}`,
                    label: String(position.artikel || "Position"),
                    quantityLabel: `${Number(position.menge || 0)} x ${Number(position.einzelpreis || 0).toFixed(2)} EUR`,
                    lineTotal: `${(Number(position.menge || 0) * Number(position.einzelpreis || 0)).toFixed(2)} EUR`,
                    availabilityText: verfuegbarkeit.text,
                    isCritical: verfuegbarkeit.istKritisch
                };
            })}
            previousOffers={getOffersForVorgang(aktuellesAngebot.vorgangId, angebote)
                .filter(item => String(item.id) !== String(aktuellesAngebot.id))
                .sort((a, b) => Number(a.revision || 0) - Number(b.revision || 0))
                .map(item => ({
                    id: item.id,
                    label: item.angebotsNr,
                    onClick: () => angebotAlsPdf(item)
                }))}
            messages={listNachrichtenZuVorgang(aktuellesAngebot.vorgangId || selectedFreigabe.vorgangId || "")}
            noteValue={approvalNote}
            onNoteChange={setApprovalNote}
            onApprove={() => freigeben(selectedFreigabe)}
            onRevise={() => zurUeberarbeitungZurueckgeben(selectedFreigabe)}
            onReject={() => ablehnen(selectedFreigabe)}
            notePlaceholder="Begruendung fuer Freigabe oder Ablehnung notieren..."
        />}
    </>;
}

import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import OfferApprovalDialog from "../../components/OfferApprovalDialog";
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
import { getOfferDemandByArtikel } from "../../utils/offerDemand";

const bereichLinks = {
    verkauf: "/themen/verkauf",
    einkauf: "/themen/einkauf",
    buchhaltung: "/buchhaltung",
    marketing: "/marketing",
    logistik: "/logistik",
    personalwesen: "/personalwesen"
};

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
    const navigate = useNavigate();
    const [freigaben, setFreigaben] = useSyncedServiceData(["freigaben"], () => freigabenService.list());
    const [angebote] = useSyncedServiceData(["angebote"], () => angeboteService.getAll());
    const [artikel] = useSyncedServiceData(["artikel"], () => artikelService.getAll());
    const [services] = useSyncedServiceData(["services"], () => servicesService.getAll());
    const [auftraege] = useSyncedServiceData(["auftraege"], () => auftraegeService.getAll());
    const [approvalOpen, setApprovalOpen] = useState(false);
    const [approvalNote, setApprovalNote] = useState("");
    const [selectedFreigabe, setSelectedFreigabe] = useState<any>(null);

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
        () => getOfferDemandByArtikel(
            angebote,
            artikel,
            angebot => ["wartet auf antwort"].includes(String(angebot.status || "").toLowerCase())
        ),
        [angebote, artikel]
    );

    const sichtbareFreigaben = useMemo(
        () => freigaben.filter(item => String(item.status || "").toLowerCase() !== "freigegeben"),
        [freigaben]
    );

    const angebotAlsPdf = angebot => {
        if (!angebot) return;
        openDocumentPdf({
            title: `Angebot ${angebot.angebotsNr}`,
            subject: "Automatisch erzeugtes Angebotsdokument für den Schulungseinsatz.",
            date: angebot.datum,
            note: angebot.verguenstigungsGrund || "Kein zusätzlicher Hinweis hinterlegt.",
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
        if (!angebot.anfrageId) return;
        const anfrage = customerInquiryService.getById(angebot.anfrageId);
        if (!anfrage) return;
        const text = `Wir senden Ihnen das Angebot ${angebot.angebotsNr} zur Prüfung zu.`;

        nachrichtenService.create({
            vorgangId: getVorgangId(angebot) || getVorgangId(anfrage),
            anfrageId: anfrage.id,
            angebotId: angebot.id,
            kundeId: angebot.kundeId || anfrage.kundeId || "",
            datum: today,
            zeitpunkt: getBerlinTimestamp(),
            senderRolle: "Verkauf",
            senderName: "Schülerfirma Verkauf",
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

    const freigeben = (item, fuerTagesversand = false) => {
        freigabenService.update({
            ...item,
            status: "freigegeben",
            notiz: approvalNote.trim() || item.notiz || "",
            entscheidungsweg: fuerTagesversand ? "tagesversand" : "sofortversand"
        });
        const angebot = resolveOfferForFreigabe(item, angebote);
        if (angebot) {
            const aktualisiert = {
                ...angebot,
                freigabeStatus: "freigegeben",
                freigabeNotiz: approvalNote.trim() || item.notiz || "",
                freigegebenVon: "gf",
                direktSendenGewuenscht: !fuerTagesversand,
                alsVorbereitetGespeichert: fuerTagesversand,
                tagesabschlussZurueckgehalten: false,
                status: fuerTagesversand ? "in Vorbereitung" : "wartet auf Antwort"
            };
            angeboteService.update(aktualisiert);
            if (!fuerTagesversand && aktualisiert.anfrageId) {
                sendeAngebotAnKunden(aktualisiert);
            }
        }
        setFreigaben(freigabenService.list());
        setApprovalOpen(false);
        setSelectedFreigabe(null);
        setApprovalNote("");
    };

    const zurUeberarbeitungZurueckgeben = (item, freigabeStatus = "intern_abgelehnt", freigabeDecision = "abgelehnt") => {
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
                senderRolle: "Geschäftsführung",
                senderName: "Geschäftsführung",
                betreff: `Überarbeitung ${angebot.angebotsNr}`,
                nachricht: `Bitte Angebot ${angebot.angebotsNr} überarbeiten. Hinweis: ${approvalNote.trim() || item.notiz || ""}`,
                typ: "Interne Freigabe"
            });
        }
        setFreigaben(freigabenService.list());
        setApprovalOpen(false);
        setSelectedFreigabe(null);
        setApprovalNote("");
        if (angebot) {
            navigate(`/angebote?editOfferId=${angebot.id}`);
        }
    };

    const ablehnen = item => zurUeberarbeitungZurueckgeben(item);

    const freigabePrüfen = item => {
        setSelectedFreigabe(item);
        setApprovalNote(String(item.notiz || ""));
        setApprovalOpen(true);
    };

    const getVerfuegbarkeitFuerPosition = position => {
        if (position.leistungTyp === "Service") {
            const serviceEintrag = services.find(item => String(item.id) === String(position.serviceId || position.artikelId || ""));
            const berechnungstyp = String(position.berechnungstyp || serviceEintrag.berechnungstyp || "Pauschal");
            const zeEinheit = String(position.zeEinheit || serviceEintrag.zeEinheit || "").trim();
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
            text: `Bestand: ${verfuegbar} | Lager-Bestand: ${bestand} | Für Aufträge reserviert: ${verplant} | In offenen Angeboten: ${inAngeboten}`,
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
                    <li>Freigaben zeigen vereinfachte Führungsentscheidungen zu Rabatten, Aktionen oder Sonderfällen.</li>
                    <li>Die Entscheidung muss begründet und im Vorgang sichtbar dokumentiert werden.</li>
                    <li>Für Angebote steht derselbe Prüf-Dialog wie im Verkauf zur Verfügung.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Schnelleinstiege</h2>
                    <span>Querverweise</span>
                </div>
                <div className="link-list">
                    <Link className="button-link" to="/geschaeftsfuehrung">Geschäftsführung</Link>
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
            rowActions={[
                { name: "review", label: "Prüfen", permission: PERMISSIONS.GF_BEARBEITEN, onClick: freigabePrüfen, variant: "success", isVisible: row => row.status === "offen" && !!resolveOfferForFreigabe(row, angebote) }
            ]}
        />
        {selectedFreigabe && aktuellesAngebot && <OfferApprovalDialog
            open={approvalOpen}
            title="Freigabe prüfen"
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
            onApproveForTagesversand={() => freigeben(selectedFreigabe, true)}
            onRevise={() => zurUeberarbeitungZurueckgeben(selectedFreigabe)}
            onReject={() => ablehnen(selectedFreigabe)}
            notePlaceholder="Begründung für Freigabe oder Ablehnung notieren..."
        />}
    </>;
}

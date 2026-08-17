import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import SaveButton from "../../components/SaveButton";
import TextArea from "../../components/form/TextArea";
import OverviewCards from "../../components/OverviewCards";
import { PERMISSIONS } from "../../constants/permissions";
import bestellungenService from "../../services/einkauf/bestellungenService";
import einkaufsdokumenteService from "../../services/einkauf/einkaufsdokumenteService";
import { getBerlinDate } from "../../utils/dateTime";
import { openDocumentPdf } from "../../utils/documentPdf";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";

const dokumentTypen = ["Bedarfsmeldung", "Anfrage", "Angebotsvergleich", "Bestellung", "Warenannahmeprotokoll", "Reklamationsschreiben"];
const euro = (value) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));

function createDokumentTitel(dokumentTyp, bestellung) {
    if (!bestellung) return dokumentTyp;
    return `${dokumentTyp} ${bestellung.bestellNr}`;
}

function createEinkaufsdokument(bestellungId: string, today: string) {
    return {
        bestellungId,
        dokumentTyp: "Bedarfsmeldung",
        datum: today,
        notiz: ""
    };
}

function createBedarfSummary(bedarf) {
    const aktuellerBestand = Number(bedarf.aktuellerBestand || 0);
    const meldebestand = Number(bedarf.meldebestand || 0);
    const bestellmenge = Number(bedarf.bestellmenge || 0);
    const einzelpreis = Number(bedarf.einzelpreis || 0);

    return {
        aktuellerBestand,
        meldebestand,
        bedarfErkannt: aktuellerBestand < meldebestand,
        bestellwert: bestellmenge * einzelpreis
    };
}

export default function Einkaufsdokumente() {
    const today = getBerlinDate();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const bestellungen = bestellungenService.list();
    const initialBestellungId = searchParams.get("bestellung") || String(bestellungen[0]?.id || "");
    const [selectedBestellungId, setSelectedBestellungId] = useState(initialBestellungId);
    const [dokumente, setDokumente] = useSyncedServiceData(
        ["einkaufsdokumente", "bestellungen"],
        () => einkaufsdokumenteService.list()
    );
    const [open, setOpen] = useState(false);
    const [bedarf, setBedarf] = useState({ aktuellerBestand: 5, meldebestand: 10, bestellmenge: 3, einzelpreis: 3499 });
    const [current, setCurrent] = useState(createEinkaufsdokument(initialBestellungId, today));

    const bestellOptionen = bestellungen.map(item => ({ value: String(item.id), label: `${item.bestellNr} - ${item.lieferant}` }));
    const selectedBestellung = bestellungen.find(item => String(item.id) === String(selectedBestellungId));
    const gefilterteDokumente = useMemo(
        () => dokumente.filter(item => !selectedBestellungId || String(item.bestellungId) === String(selectedBestellungId)),
        [dokumente, selectedBestellungId]
    );
    const bedarfSummary = useMemo(() => createBedarfSummary(bedarf), [bedarf]);
    const overviewCards = useMemo(
        () => [
            { label: "Dokumente", value: gefilterteDokumente.length },
            { label: "Noch offen", value: gefilterteDokumente.filter(item => item.status !== "versendet").length },
            { label: "Versendet", value: gefilterteDokumente.filter(item => item.status === "versendet").length }
        ],
        [gefilterteDokumente]
    );

    const resetCurrentDocument = (bestellungId = selectedBestellungId || String(bestellungen[0]?.id || "")) => {
        setCurrent(createEinkaufsdokument(bestellungId, today));
    };

    const refreshDokumente = () => {
        setDokumente(einkaufsdokumenteService.list());
    };

    const bestellungAuswaehlen = (value) => {
        setSelectedBestellungId(value);
        navigate(`/einkaufsdokumente?bestellung=${value}`);
    };

    const neu = () => {
        resetCurrentDocument();
        setOpen(true);
    };

    const speichern = () => {
        const bestellung = bestellungen.find(item => String(item.id) === String(current.bestellungId));
        if (!bestellung) return;

        const titel = createDokumentTitel(current.dokumentTyp, bestellung);

        const payload = {
            ...current,
            bestellungId: Number(current.bestellungId),
            titel,
            versendetAm: current.versendetAm || "",
            status: current.status || "erstellt",
            notiz: current.notiz.trim()
        };

        einkaufsdokumenteService.create(payload);

        refreshDokumente();
        setOpen(false);
        resetCurrentDocument();
    };

    const loeschen = (dokument) => {
        einkaufsdokumenteService.remove(dokument.id);
        refreshDokumente();
    };

    const alsPdf = (dokument) => {
        const bestellung = bestellungen.find(item => String(item.id) === String(dokument.bestellungId));
        openDocumentPdf({
            title: dokument.titel || createDokumentTitel(dokument.dokumentTyp, { bestellNr: dokument.bestellNr }),
            subject: "Automatisch erzeugtes Einkaufsdokument für den Schulungseinsatz.",
            date: dokument.datum,
            note: dokument.notiz,
            referenceLabel: "Bestellung",
            referenceValue: dokument.bestellNr,
            partnerLabel: "Lieferant",
            partnerValue: dokument.lieferant,
            positions: (bestellung?.positionen || dokument.positionen || []).map(position => ({
                ...position,
                einzelpreis: position.einzelpreis || 0
            }))
        });
    };

    const versenden = (dokument) => {
        einkaufsdokumenteService.update(dokument.id, {
            ...dokument,
            status: "versendet",
            versendetAm: today
        });
        refreshDokumente();
    };

    return <>
        <h1>Einkaufsdokumente</h1>
        <p>Lernseite für die Dokumentenkette im Einkauf. Hier lassen sich Bedarfsmeldung, Anfrage, Angebotsvergleich, Bestellung und Warenannahmeprotokoll im Zusammenhang üben.</p>

        <section className="module-panel">
            <div className="personalakte-toolbar">
                <div className="personalakte-select">
                    <Label glossaryKey="belegbezug">Bestellung auswählen</Label>
                    <LookupField value={selectedBestellungId} options={bestellOptionen} onChange={bestellungAuswaehlen} placeholder="Bestellung suchen..."/>
                </div>
                <div className="personalakte-links">
                    <Link className="button-link" to="/bestellungen">Bestellungen öffnen</Link>
                    <Link className="button-link" to="/wareneingaenge">Wareneingänge öffnen</Link>
                    <Link className="button-link" to="/lieferantenvergleich">Lieferantenvergleich</Link>
                    {selectedBestellung?.status === "eingegangen" && <Link className="button-link" to={`/eingangsrechnungen?focus=${String(selectedBestellung.bestellNr || "").replace("EK-", "ER-")}`}>Eingangsrechnung prüfen</Link>}
                </div>
            </div>
            {selectedBestellung && <div className="personalakte-summary">
                <div><span>Bestellung</span><strong>{selectedBestellung.bestellNr}</strong></div>
                <div><span>Lieferant</span><strong>{selectedBestellung.lieferant}</strong></div>
                <div><span>Status</span><strong>{selectedBestellung.status}</strong></div>
                <div><span>Positionen</span><strong>{selectedBestellung.positionen?.length || 0}</strong></div>
            </div>}
        </section>

        <OverviewCards cards={overviewCards}/>

        <section className="dashboard-two-column">
            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Einkaufsreihenfolge</h2>
                    <span>Lehrfunktion</span>
                </div>
                <ul className="dashboard-note-list">
                    <li>Bedarf erkennen und intern als Meldung dokumentieren.</li>
                    <li>Eine Anfrage an den Lieferanten vorbereiten.</li>
                    <li>Angebote vergleichen und eine Bestellung auslösen.</li>
                    <li>Den Wareneingang mit Protokoll oder Prüfvermerk dokumentieren.</li>
                    <li>Danach die zugehörige Eingangsrechnung in der Buchhaltung prüfen oder anlegen.</li>
                    <li>Bei Abweichungen ein Reklamationsschreiben vorbereiten.</li>
                </ul>
            </article>

            <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>Bedarf und Bestellwert</h2>
                    <span>Lernhilfe</span>
                </div>
                <div className="personalakte-summary">
                    <div><span>Aktueller Bestand</span><strong>{bedarfSummary.aktuellerBestand}</strong></div>
                    <div><span>Meldebestand</span><strong>{bedarfSummary.meldebestand}</strong></div>
                    <div><span>Bedarf erkannt</span><strong>{bedarfSummary.bedarfErkannt ? "Ja" : "Nein"}</strong></div>
                    <div><span>Bestellwert</span><strong>{euro(bedarfSummary.bestellwert)}</strong></div>
                </div>
                <div className="dashboard-two-column">
                    <div><Label>Aktueller Bestand</Label><NumberField value={bedarf.aktuellerBestand} min="0" onChange={value => setBedarf(item => ({ ...item, aktuellerBestand: Number(value) }))}/></div>
                    <div><Label glossaryKey="bedarfsmeldung">Meldebestand</Label><NumberField value={bedarf.meldebestand} min="0" onChange={value => setBedarf(item => ({ ...item, meldebestand: Number(value) }))}/></div>
                    <div><Label glossaryKey="bedarfsmeldung">Bestellmenge</Label><NumberField value={bedarf.bestellmenge} min="0" onChange={value => setBedarf(item => ({ ...item, bestellmenge: Number(value) }))}/></div>
                    <div><Label glossaryKey="einkaufspreis">Einzelpreis</Label><NumberField value={bedarf.einzelpreis} min="0" onChange={value => setBedarf(item => ({ ...item, einzelpreis: Number(value) }))}/></div>
                </div>
            </article>
        </section>

        <DataTable
            title="Vorlagen und Einkaufsdokumente"
            selectableColumns={false}
            data={gefilterteDokumente}
            columns={[
                { field: "datum", title: "Datum" },
                { field: "dokumentTyp", title: "Dokumenttyp" },
                { field: "titel", title: "Titel" },
                { field: "versendetAm", title: "Versendet am", render: row => row.versendetAm || "-" },
                { field: "notiz", title: "Hinweis" }
            ]}
            toolbarActions={[{ name: "new", label: "Dokument erstellen", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: neu, variant: "secondary" }]}
            rowActions={[
                { name: "pdf", label: "PDF", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: alsPdf, variant: "secondary" },
                { name: "send", label: "Versenden", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: versenden, variant: "secondary", isVisible: row => row.status !== "versendet" },
                { name: "delete", label: "Löschen", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: loeschen, variant: "danger" }
            ]}
            detailLinkResolver={({ field, row, value }) => {
                if ((field === "bestellung" || field === "bestellNr" || field === "bestellungId") && row.bestellungId) return `/bestellungen?focus=${row.bestellungId}`;
                if ((field === "lieferant" || field === "lieferantId") && row.lieferantId) return `/lieferanten?focus=${row.lieferantId}`;
                if (field === "lieferantId" && value) return `/lieferanten?focus=${value}`;
                return null;
            }}
        />

        <Dialog
            open={open}
            title="Einkaufsdokument erstellen"
            onClose={() => setOpen(false)}
            footer={<SaveButton onSave={speichern} onSuccess={() => setOpen(false)}>Speichern</SaveButton>}
        >
            <div><Label glossaryKey="belegbezug">Bestellung</Label><LookupField value={current.bestellungId} options={bestellOptionen} onChange={value => setCurrent(item => ({ ...item, bestellungId: value }))} placeholder="Bestellung suchen..."/></div>
            <div><Label glossaryKey="nummernkreis">Dokumenttyp</Label><select value={current.dokumentTyp} onChange={event => setCurrent(item => ({ ...item, dokumentTyp: event.target.value }))}>
                {dokumentTypen.map(item => <option key={item} value={item}>{item}</option>)}
            </select></div>
            <div className="form-row"><p>Der Dokumenttitel wird automatisch aus Dokumenttyp und Bestellnummer erzeugt.</p></div>
            <div className="form-row"><Label>Vorschau Titel</Label><strong>{createDokumentTitel(current.dokumentTyp, bestellungen.find(item => String(item.id) === String(current.bestellungId)))}</strong></div>
            <div><Label>Datum</Label><input type="date" value={current.datum} onChange={event => setCurrent(item => ({ ...item, datum: event.target.value }))}/></div>
            <div className="form-row"><Label>Hinweis</Label><TextArea rows={3} value={current.notiz} onChange={value => setCurrent(item => ({ ...item, notiz: value }))}/></div>
        </Dialog>
    </>;
}

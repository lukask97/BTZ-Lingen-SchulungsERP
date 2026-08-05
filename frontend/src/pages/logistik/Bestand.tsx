import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import NumberField from "../../components/form/NumberField";
import artikelService from "../../services/logistik/artikelService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import angeboteService from "../../services/verkauf/angeboteService";
import bestellungenService, { naechsteBestellnummer } from "../../services/einkauf/bestellungenService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";
import { PERMISSIONS } from "../../constants/permissions";
import { getBerlinDate } from "../../utils/dateTime";
const AKTIVE_AUFTRAGSSTATUS = ["offen", "abgerechnet"];
const OFFENE_ANGEBOTSSTATUS = ["wartet auf antwort"];

function createBedarfsmeldungDraft() {
    return {
        artikelId: "",
        menge: 1,
        positionen: [],
        fehler: ""
    };
}

function getVerplanteMengen(auftraege) {
    return auftraege
        .filter(auftrag => AKTIVE_AUFTRAGSSTATUS.includes(String(auftrag.status || "").toLowerCase()))
        .reduce((map, auftrag) => {
            (auftrag.positionen || [])
                .filter(position => !position.serviceId && position.artikelId)
                .forEach(position => {
                    const key = String(position.artikelId);
                    const bisher = map[key] || { menge: 0, auftraege: [] };
                    map[key] = {
                        menge: bisher.menge + Number(position.menge || 0),
                        auftraege: [...bisher.auftraege, {
                            id: auftrag.id,
                            auftragNr: auftrag.auftragNr
                        }]
                    };
                });
            return map;
        }, {});
}

function getBestellvorschlag(artikel, verplant, kritischerBestand) {
    const verfuegbar = Number(artikel.bestand || 0) - Number(verplant || 0);
    if (verfuegbar < 0) return Math.abs(verfuegbar) + 1;
    if (verfuegbar < kritischerBestand) return kritischerBestand - verfuegbar;
    return 1;
}

function getOpenOfferCountByArtikel(angebote = []) {
    return angebote
        .filter(angebot => OFFENE_ANGEBOTSSTATUS.includes(String(angebot.status || "").toLowerCase()))
        .reduce((map, angebot) => {
            (angebot.positionen || [])
                .filter(position => !position.serviceId && position.artikelId)
                .forEach(position => {
                    const artikelId = String(position.artikelId);
                    map[artikelId] = Number(map[artikelId] || 0) + Number(position.menge || 0);
                });

            return map;
        }, {});
}

export default function Bestand() {
    const heute = getBerlinDate();
    const syncTick = useStorageSyncRefresh(["artikel", "auftraege", "bestellungen"]);
    const [searchParams] = useSearchParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const [suchbegriff, setSuchbegriff] = useState("");
    const [typFilter, setTypFilter] = useState("");
    const [kritischerBestand, setKritischerBestand] = useState(5);
    const [bestandDialogOpen, setBestandDialogOpen] = useState(false);
    const [bedarfDialogOpen, setBedarfDialogOpen] = useState(false);
    const [ausgewaehlterArtikel, setAusgewaehlterArtikel] = useState(null);
    const [neuerBestand, setNeuerBestand] = useState(0);
    const [bedarfDraft, setBedarfDraft] = useState(createBedarfsmeldungDraft);

    const artikel = useMemo(() => artikelService.getAll(), [refreshKey, syncTick]);
    const auftraege = useMemo(() => auftraegeService.getAll(), [refreshKey, syncTick]);
    const angebote = useMemo(() => angeboteService.getAll(), [refreshKey, syncTick]);
    const verplanteMengen = useMemo(() => getVerplanteMengen(auftraege), [auftraege]);
    const offeneAngeboteJeArtikel = useMemo(() => getOpenOfferCountByArtikel(angebote), [angebote]);
    const einkaufbareArtikel = useMemo(() => artikel.filter(item => item.istEinkaufbar), [artikel]);

    const artikelOptionen = einkaufbareArtikel.map(item => ({
        value: String(item.id),
        label: `${item.artikelNr} - ${item.name} (${item.artikelTyp})`
    }));

    const daten = artikel
        .map(item => {
            const verplantInfo = verplanteMengen[String(item.id)] || { menge: 0, auftraege: [] };
            const verplant = Number(verplantInfo.menge || 0);
            const bestand = Number(item.bestand || 0);
            return {
                ...item,
                lager: "Hauptlager",
                verplant,
                inAngeboten: Number(offeneAngeboteJeArtikel[String(item.id)] || 0),
                verfuegbar: bestand - verplant,
                anzahlAktiverAuftraege: verplantInfo.auftraege.length,
                aktiveAuftraege: verplanteMengen[String(item.id)]
                    ? verplanteMengen[String(item.id)].auftraege.map(auftrag => ({
                        label: auftrag.auftragNr,
                        to: `/auftraege?focus=${auftrag.id}`
                    }))
                    : []
            };
        })
        .filter(item => {
            const passtZumTyp = !typFilter || item.artikelTyp === typFilter;
            const passtZurSuche = !suchbegriff || Object.values(item).join(" ").toLowerCase().includes(suchbegriff.toLowerCase());
            return passtZumTyp && passtZurSuche;
        });

    const kritischeArtikel = daten.filter(item => Number(item.verfuegbar || 0) < Number(kritischerBestand || 0)).length;

    const bestandAnpassen = (row) => {
        setAusgewaehlterArtikel(row);
        setNeuerBestand(Number(row.bestand || 0));
        setBestandDialogOpen(true);
    };

    const bedarfsmeldungStarten = (row) => {
        setAusgewaehlterArtikel(row);
        const vorgeschlageneMenge = getBestellvorschlag(row, row.verplant, kritischerBestand);
        setBedarfDraft({
            artikelId: String(row.id),
            menge: vorgeschlageneMenge,
            positionen: [{
                artikelId: row.id,
                artikel: row.name,
                menge: vorgeschlageneMenge
            }],
            fehler: ""
        });
        setBedarfDialogOpen(true);
    };

    const positionHinzufuegen = () => {
        const auswahl = einkaufbareArtikel.find(item => String(item.id) === String(bedarfDraft.artikelId));
        if (!auswahl || Number(bedarfDraft.menge) <= 0) return;

        setBedarfDraft(vorherige => {
            const vorhanden = vorherige.positionen.find(item => String(item.artikelId) === String(auswahl.id));
            return {
                ...vorherige,
                positionen: vorhanden
                    ? vorherige.positionen.map(item => String(item.artikelId) === String(auswahl.id)
                        ? { ...item, menge: Number(item.menge || 0) + Number(vorherige.menge || 0) }
                        : item)
                    : [...vorherige.positionen, {
                        artikelId: auswahl.id,
                        artikel: auswahl.name,
                        menge: Number(vorherige.menge || 0)
                    }]
            };
        });
    };

    const bestandSpeichern = () => {
        if (!ausgewaehlterArtikel) return;
        artikelService.update(ausgewaehlterArtikel.id, {
            ...ausgewaehlterArtikel,
            bestand: Number(neuerBestand || 0)
        });
        setRefreshKey(value => value + 1);
        setBestandDialogOpen(false);
        setAusgewaehlterArtikel(null);
    };

    const bedarfsmeldungSpeichern = () => {
        if (bedarfDraft.positionen.length === 0) {
            setBedarfDraft(current => ({ ...current, fehler: "Bitte mindestens eine Position auswaehlen." }));
            return;
        }

        bestellungenService.add({
            bestellNr: naechsteBestellnummer(),
            lieferantId: "",
            lieferant: "",
            datum: heute,
            status: "bedarf gemeldet",
            quelle: "Bestand",
            anfrageQuelle: "bedarfsmeldung",
            positionen: bedarfDraft.positionen.map(position => {
                const artikelInfo = artikel.find(item => String(item.id) === String(position.artikelId));
                return {
                    ...position,
                    artikelNr: artikelInfo?.artikelNr || ""
                };
            })
        });

        setRefreshKey(value => value + 1);
        setBedarfDialogOpen(false);
        setAusgewaehlterArtikel(null);
        setBedarfDraft(createBedarfsmeldungDraft());
    };

    return <>
        <h1>Bestand</h1>
        <p>Im Mockup gibt es ein zentrales Lager. Hier sieht die Logistik den aktuellen Bestand, bereits verplante Mengen aus aktiven Auftraegen und den daraus verbleibenden verfuegbaren Bestand.</p>
        <div className="module-panel">
            <div className="form-row">
                <div>
                    <Label>Kritisch unter</Label>
                    <NumberField value={kritischerBestand} min="0" step="1" onChange={wert => setKritischerBestand(Number(wert || 0))}/>
                </div>
                <div>
                    <Label>Kritische Artikel</Label>
                    <p>{kritischeArtikel}</p>
                </div>
            </div>
        </div>
        <DataTable
            title="Bestand im Hauptlager"
            data={daten}
            selectableColumns={false}
            searchable
            onSearch={setSuchbegriff}
            focusRowId={searchParams.get("focus") || ""}
            filters={[{
                name: "artikelTyp",
                label: "Artikeltyp",
                options: [
                    { value: "Einzelartikel", label: "Einzelartikel" },
                    { value: "Komponente", label: "Komponente" },
                    { value: "Baugruppe", label: "Baugruppe" }
                ]
            }]}
            onFilter={filters => setTypFilter(filters.artikelTyp || "")}
            columns={[
                { field: "artikelNr", title: "Artikelnummer" },
                { field: "name", title: "Artikel", render: row => <Link className="detail-link" to={`/artikel?focus=${row.id}`}>{row.name}</Link> },
                { field: "artikelTyp", title: "Typ" },
                { field: "bestand", title: "Bestand", helpText: "Aktueller physischer Lagerbestand des Artikels." },
                { field: "verplant", title: "Reserviert", helpText: "Menge, die bereits reserviert ist." },
                { field: "inAngeboten", title: "In Angeboten", helpText: "Summierte Menge aus aktuell offenen Angeboten mit Status 'Wartet auf Antwort', in denen der Artikel verwendet wird." },
                { field: "verfuegbar", title: "Verfuegbar", helpText: "Bestand minus bereits reservierte Menge. Dieser Wert ist fuer neue Zusagen relevant." }
            ]}
            rowClassName={row => Number(row.verfuegbar || 0) < Number(kritischerBestand || 0) ? "datatable-row-critical" : ""}
            detailLinkResolver={({ field, row }) => field === "name" ? `/artikel?focus=${row.id}` : null}
            rowActions={[
                { name: "remind", label: "Bedarfsmeldung", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: bedarfsmeldungStarten, variant: "warning", isVisible: row => row.istEinkaufbar },
                { name: "edit", label: "Bestand anpassen", permission: PERMISSIONS.LAGER_BEARBEITEN, onClick: bestandAnpassen, variant: "secondary" }
            ]}
        />

        <Dialog open={bestandDialogOpen} title="Bestand anpassen" onClose={() => {
            setBestandDialogOpen(false);
            setAusgewaehlterArtikel(null);
        }}>
            <div className="form-row">
                <div><Label>Artikel</Label><p>{ausgewaehlterArtikel?.artikelNr} - {ausgewaehlterArtikel?.name}</p></div>
                <div><Label>Reserviert</Label><p>{ausgewaehlterArtikel?.verplant ?? 0}</p></div>
            </div>
            <div className="form-row">
                <div><Label>Aktueller Bestand</Label><p>{ausgewaehlterArtikel?.bestand ?? 0}</p></div>
                <div><Label>Neuer Bestand</Label><NumberField value={neuerBestand} min="0" step="1" onChange={wert => setNeuerBestand(Number(wert || 0))}/></div>
            </div>
            <div className="form-row">
                <p>Die Anpassung aendert nur den Lagerbestand. Allgemeine Artikelpflege erfolgt weiterhin auf der Artikelseite.</p>
            </div>
            <div className="form-row"><button type="button" onClick={bestandSpeichern}>Bestand speichern</button></div>
        </Dialog>

        <Dialog open={bedarfDialogOpen} title="Bedarfsmeldung erstellen" onClose={() => {
            setBedarfDialogOpen(false);
            setAusgewaehlterArtikel(null);
            setBedarfDraft(createBedarfsmeldungDraft());
        }}>
            <div className="form-row">
                <div><Label>Ausgangspunkt</Label><p>{ausgewaehlterArtikel?.artikelNr} - {ausgewaehlterArtikel?.name}</p></div>
                <div><Label>Verfuegbar</Label><p>{ausgewaehlterArtikel?.verfuegbar ?? 0}</p></div>
            </div>
            <div className="form-row bestellposition-hinzufuegen">
                <div><Label>Artikel</Label>
                    <input value={ausgewaehlterArtikel?.name || ""} disabled />
                </div>
                <div><Label>Menge</Label><NumberField value={bedarfDraft.menge} min="1" step="1" onChange={wert => setBedarfDraft(item => ({ ...item, menge: Number(wert || 1), fehler: "" }))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufuegen</button>
            </div>
            <div className="form-row">
                <Label>Bedarfsmeldung</Label>
                {bedarfDraft.positionen.length === 0 ? <p>Noch keine Position vorhanden.</p> : <ul className="positionsliste">
                    {bedarfDraft.positionen.map(position => <li key={position.artikelId}>
                        {position.artikel}: {position.menge}
                        <button type="button" className="link-button" onClick={() => setBedarfDraft(items => ({ ...items, positionen: items.positionen.filter(item => String(item.artikelId) !== String(position.artikelId)) }))}>Entfernen</button>
                    </li>)}
                </ul>}
                {bedarfDraft.fehler && <p className="form-error">{bedarfDraft.fehler}</p>}
            </div>
            <div className="form-row">
                <p>Beim Speichern wird nur eine Bedarfsmeldung fuer den Einkauf angelegt. Ein Lieferant wird noch nicht festgelegt und der Einkauf bearbeitet den Vorgang spaeter weiter.</p>
            </div>
            <div className="form-row"><button type="button" onClick={bedarfsmeldungSpeichern}>Bedarfsmeldung speichern</button></div>
        </Dialog>
    </>;
}

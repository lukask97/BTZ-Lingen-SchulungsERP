import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import NumberField from "../../components/form/NumberField";
import artikelService from "../../services/logistik/artikelService";
import bestellungenService, { getOffeneBestellmengenProArtikel } from "../../services/einkauf/bestellungenService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import angeboteService from "../../services/verkauf/angeboteService";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";
import { PERMISSIONS } from "../../constants/permissions";

const AKTIVE_AUFTRAGSSTATUS = ["offen", "abgerechnet"];
const OFFENE_ANGEBOTSSTATUS = ["wartet auf antwort"];
const FARBEN = [
    { key: "weiss", label: "Weiß", beschreibung: "Normal, kein aktueller Handlungsbedarf.", chipClass: "stock-legend-chip-normal", rowClass: "" },
    { key: "orange", label: "Orange", beschreibung: "Bedarfsmeldung erreicht oder unterschritten.", chipClass: "stock-legend-chip-warning", rowClass: "datatable-row-critical-light" },
    { key: "rot", label: "Rot", beschreibung: "Sicherheitsbestand unterschritten.", chipClass: "stock-legend-chip-critical", rowClass: "datatable-row-critical-dark" },
    { key: "blau", label: "Blau", beschreibung: "Artikel ist nachbestellt und im Zulauf. Diese Farbe hat die hoechste Prioritaet.", chipClass: "stock-legend-chip-order", rowClass: "datatable-row-inbound" }
];

function getFarbstatus({ imZulauf, verfuegbar, mindestmenge, bedarfsmeldungBei }) {
    if (Number(imZulauf || 0) > 0) return "blau";
    if (Number(verfuegbar || 0) < Number(mindestmenge || 0)) return "rot";
    if (Number(verfuegbar || 0) < Number(bedarfsmeldungBei || 0)) return "orange";
    return "weiss";
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
    const syncTick = useStorageSyncRefresh(["artikel", "auftraege", "bestellungen"]);
    const [searchParams] = useSearchParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const [suchbegriff, setSuchbegriff] = useState("");
    const [typFilter, setTypFilter] = useState("");
    const [farbenFilter, setFarbenFilter] = useState("");
    const [bestandDialogOpen, setBestandDialogOpen] = useState(false);
    const [ausgewaehlterArtikel, setAusgewaehlterArtikel] = useState(null);
    const [neuerBestand, setNeuerBestand] = useState(0);

    const artikel = useMemo(() => artikelService.getAll(), [refreshKey, syncTick]);
    const bestellungen = useMemo(() => bestellungenService.getAll(), [refreshKey, syncTick]);
    const auftraege = useMemo(() => auftraegeService.getAll(), [refreshKey, syncTick]);
    const angebote = useMemo(() => angeboteService.getAll(), [refreshKey, syncTick]);
    const verplanteMengen = useMemo(() => getVerplanteMengen(auftraege), [auftraege]);
    const offeneAngeboteJeArtikel = useMemo(() => getOpenOfferCountByArtikel(angebote), [angebote]);
    const offeneBestellmengen = useMemo(() => getOffeneBestellmengenProArtikel(), [bestellungen]);

    const basisDaten = artikel
        .map(item => {
            const verplantInfo = verplanteMengen[String(item.id)] || { menge: 0, auftraege: [] };
            const verplant = Number(verplantInfo.menge || 0);
            const bestand = Number(item.bestand || 0);
            const bedarfsmeldungBei = Number(item.bedarfsmeldungBei || 0);
            const mindestmenge = Number(item.mindestmenge || 0);
            const imZulauf = Number(offeneBestellmengen[String(item.id)] || 0);
            const verfuegbar = bestand - verplant;
            const farbstatus = getFarbstatus({ imZulauf, verfuegbar, mindestmenge, bedarfsmeldungBei });

            return {
                ...item,
                lager: "Hauptlager",
                verplant,
                imZulauf,
                inAngeboten: Number(offeneAngeboteJeArtikel[String(item.id)] || 0),
                verfuegbar,
                bedarfsmeldungBei,
                mindestmenge,
                farbstatus,
                anzahlAktiverAuftraege: verplantInfo.auftraege.length,
                aktiveAuftraege: verplanteMengen[String(item.id)]
                    ? verplanteMengen[String(item.id)].auftraege.map(auftrag => ({
                        label: auftrag.auftragNr,
                        to: `/auftraege?focus=${auftrag.id}`
                    }))
                    : []
            };
        })
        ;

    const daten = basisDaten.filter(item => {
            const passtZumTyp = !typFilter || item.artikelTyp === typFilter;
            const passtZurFarbe = !farbenFilter || item.farbstatus === farbenFilter;
            const passtZurSuche = !suchbegriff || Object.values(item).join(" ").toLowerCase().includes(suchbegriff.toLowerCase());
            return passtZumTyp && passtZurFarbe && passtZurSuche;
        });

    const farbCounts = useMemo(() => FARBEN.reduce((map, farbe) => ({
        ...map,
        [farbe.key]: daten.filter(item => item.farbstatus === farbe.key).length
    }), {}), [daten]);

    const bestandAnpassen = (row) => {
        setAusgewaehlterArtikel(row);
        setNeuerBestand(Number(row.bestand || 0));
        setBestandDialogOpen(true);
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

    return <>
        <h1>Bestand</h1>
        <p>Im Mockup gibt es ein zentrales Lager. Hier sieht die Logistik den aktuellen Bestand, bereits verplante Mengen aus aktiven Auftraegen und den daraus verbleibenden verfuegbaren Bestand.</p>
        <div className="stock-legend" aria-label="Farblegende Bestand">
            <strong>Farblegende</strong>
            <div className="stock-legend-table" role="table" aria-label="Bedeutung der Bestandsfarben">
                <div className="stock-legend-row stock-legend-head" role="row">
                    <span role="columnheader">Farbe</span>
                    <span role="columnheader">Anzahl</span>
                    <span role="columnheader">Bedeutung</span>
                </div>
                {FARBEN.map(farbe => (
                    <div key={farbe.key} className="stock-legend-row" role="row">
                        <span className="stock-legend-color-cell" role="cell">
                            <span className={`stock-legend-chip ${farbe.chipClass}`}/>
                            <span>{farbe.label}</span>
                        </span>
                        <span role="cell">{farbCounts[farbe.key] || 0}</span>
                        <span role="cell">{farbe.beschreibung}</span>
                    </div>
                ))}
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
            }, {
                name: "farbe",
                label: "Farbe",
                options: [
                    { value: "weiss", label: "Weiß" },
                    { value: "orange", label: "Orange" },
                    { value: "rot", label: "Rot" },
                    { value: "blau", label: "Blau" }
                ]
            }]}
            onFilter={filters => {
                setTypFilter(filters.artikelTyp || "");
                setFarbenFilter(filters.farbe || "");
            }}
            columns={[
                { field: "artikelNr", title: "Artikelnummer" },
                { field: "name", title: "Artikel", render: row => <Link className="detail-link" to={`/artikel?focus=${row.id}`}>{row.name}</Link> },
                { field: "artikelTyp", title: "Typ" },
                { field: "bestand", title: "Bestand", helpText: "Aktueller physischer Lagerbestand des Artikels." },
                { field: "verplant", title: "Reserviert", helpText: "Menge, die bereits reserviert ist." },
                { field: "verfuegbar", title: "Verfuegbar", helpText: "Bestand minus bereits reservierte Menge. Dieser Wert ist fuer neue Zusagen relevant." },
                { field: "imZulauf", title: "Im Zulauf", helpText: "Offene Bestellmenge aus angefragten, bestaetigten oder versendeten Bestellungen." },
                { field: "bedarfsmeldungBei", title: "Bedarfsmeldung bei", helpText: "Unterhalb dieses Werts soll der Einkauf den Bedarf sehen." },
                { field: "mindestmenge", title: "Sicherheitsbestand", helpText: "Unterhalb dieses Werts wird der Bestand als besonders kritisch behandelt." },
                { field: "inAngeboten", title: "In Angeboten", helpText: "Summierte Menge aus aktuell offenen Angeboten mit Status 'Wartet auf Antwort', in denen der Artikel verwendet wird." }
            ]}
            rowClassName={row => FARBEN.find(farbe => farbe.key === row.farbstatus)?.rowClass || ""}
            detailLinkResolver={({ field, row }) => field === "name" ? `/artikel?focus=${row.id}` : null}
            rowActions={[
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
    </>;
}

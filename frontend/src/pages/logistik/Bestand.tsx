// @ts-nocheck
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import NumberField from "../../components/form/NumberField";
import artikelService from "../../services/logistik/artikelService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import bestellungenService, { naechsteBestellnummer } from "../../services/einkauf/bestellungenService";

const heute = "2026-07-29";
const AKTIVE_AUFTRAGSSTATUS = ["offen", "abgerechnet"];

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

export default function Bestand() {
    const [searchParams] = useSearchParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const [suchbegriff, setSuchbegriff] = useState("");
    const [typFilter, setTypFilter] = useState("");
    const [kritischerBestand, setKritischerBestand] = useState(5);
    const [bestandDialogOpen, setBestandDialogOpen] = useState(false);
    const [bedarfDialogOpen, setBedarfDialogOpen] = useState(false);
    const [ausgewaehlterArtikel, setAusgewaehlterArtikel] = useState(null);
    const [neuerBestand, setNeuerBestand] = useState(0);
    const [artikelId, setArtikelId] = useState("");
    const [menge, setMenge] = useState(1);
    const [positionen, setPositionen] = useState([]);
    const [fehler, setFehler] = useState("");

    const artikel = useMemo(() => artikelService.getAll(), [refreshKey]);
    const auftraege = useMemo(() => auftraegeService.getAll(), [refreshKey]);
    const verplanteMengen = useMemo(() => getVerplanteMengen(auftraege), [auftraege]);
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
        setArtikelId(String(row.id));
        setMenge(getBestellvorschlag(row, row.verplant, kritischerBestand));
        setPositionen([{
            artikelId: row.id,
            artikel: row.name,
            menge: getBestellvorschlag(row, row.verplant, kritischerBestand)
        }]);
        setFehler("");
        setBedarfDialogOpen(true);
    };

    const positionHinzufuegen = () => {
        const auswahl = einkaufbareArtikel.find(item => String(item.id) === String(artikelId));
        if (!auswahl || Number(menge) <= 0) return;

        setPositionen(vorherige => {
            const vorhanden = vorherige.find(item => String(item.artikelId) === String(auswahl.id));
            if (vorhanden) {
                return vorherige.map(item => String(item.artikelId) === String(auswahl.id)
                    ? { ...item, menge: Number(item.menge || 0) + Number(menge || 0) }
                    : item);
            }
            return [...vorherige, {
                artikelId: auswahl.id,
                artikel: auswahl.name,
                menge: Number(menge || 0)
            }];
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
        if (positionen.length === 0) {
            setFehler("Bitte mindestens eine Position auswaehlen.");
            return;
        }

        bestellungenService.add({
            bestellNr: naechsteBestellnummer(),
            lieferantId: "",
            lieferant: "",
            datum: heute,
            status: "bedarf gemeldet",
            quelle: "Bestand",
            positionen
        });

        setRefreshKey(value => value + 1);
        setBedarfDialogOpen(false);
        setAusgewaehlterArtikel(null);
        setPositionen([]);
        setFehler("");
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
                { field: "bestand", title: "Bestand" },
                { field: "verplant", title: "Verplant" },
                { field: "verfuegbar", title: "Verfuegbar" }
            ]}
            rowClassName={row => Number(row.verfuegbar || 0) < Number(kritischerBestand || 0) ? "datatable-row-critical" : ""}
            detailLinkResolver={({ field, row }) => field === "name" ? `/artikel?focus=${row.id}` : null}
            rowActions={[
                { name: "remind", label: "Bedarfsmeldung", permission: "einkauf.bearbeiten", onClick: bedarfsmeldungStarten, variant: "warning", isVisible: row => row.istEinkaufbar },
                { name: "edit", label: "Bestand anpassen", permission: "lager.bearbeiten", onClick: bestandAnpassen, variant: "secondary" }
            ]}
        />

        <Dialog open={bestandDialogOpen} title="Bestand anpassen" onClose={() => setBestandDialogOpen(false)}>
            <div className="form-row">
                <div><Label>Artikel</Label><p>{ausgewaehlterArtikel?.artikelNr} - {ausgewaehlterArtikel?.name}</p></div>
                <div><Label>Verplant</Label><p>{ausgewaehlterArtikel?.verplant ?? 0}</p></div>
            </div>
            <div className="form-row">
                <div><Label>Aktueller Bestand</Label><p>{ausgewaehlterArtikel?.bestand ?? 0}</p></div>
                <div><Label>Neuer Bestand</Label><NumberField value={neuerBestand} min="0" step="1" onChange={wert => setNeuerBestand(Number(wert || 0))}/></div>
            </div>
            <div className="form-row">
                <p>Die Anpassung aendert nur den Lagerbestand. Allgemeine Artikelpflege erfolgt weiterhin auf der Artikelseite.</p>
            </div>
            <div className="form-row"><button onClick={bestandSpeichern}>Bestand speichern</button></div>
        </Dialog>

        <Dialog open={bedarfDialogOpen} title="Bedarfsmeldung erstellen" onClose={() => setBedarfDialogOpen(false)}>
            <div className="form-row">
                <div><Label>Ausgangspunkt</Label><p>{ausgewaehlterArtikel?.artikelNr} - {ausgewaehlterArtikel?.name}</p></div>
                <div><Label>Verfuegbar</Label><p>{ausgewaehlterArtikel?.verfuegbar ?? 0}</p></div>
            </div>
            <div className="form-row bestellposition-hinzufuegen">
                <div><Label>Artikel</Label>
                    <input value={ausgewaehlterArtikel?.name || ""} disabled />
                </div>
                <div><Label>Menge</Label><NumberField value={menge} min="1" step="1" onChange={wert => setMenge(Number(wert || 1))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufuegen</button>
            </div>
            <div className="form-row">
                <Label>Bedarfsmeldung</Label>
                {positionen.length === 0 ? <p>Noch keine Position vorhanden.</p> : <ul className="positionsliste">
                    {positionen.map(position => <li key={position.artikelId}>
                        {position.artikel}: {position.menge}
                        <button type="button" className="link-button" onClick={() => setPositionen(items => items.filter(item => String(item.artikelId) !== String(position.artikelId)))}>Entfernen</button>
                    </li>)}
                </ul>}
                {fehler && <p className="form-error">{fehler}</p>}
            </div>
            <div className="form-row">
                <p>Beim Speichern wird nur eine Bedarfsmeldung fuer den Einkauf angelegt. Ein Lieferant wird noch nicht festgelegt und der Einkauf bearbeitet den Vorgang spaeter weiter.</p>
            </div>
            <div className="form-row"><button onClick={bedarfsmeldungSpeichern}>Bedarfsmeldung speichern</button></div>
        </Dialog>
    </>;
}

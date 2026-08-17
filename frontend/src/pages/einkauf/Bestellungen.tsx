import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import SaveButton from "../../components/SaveButton";
import TextArea from "../../components/form/TextArea";
import TextField from "../../components/form/TextField";
import { PERMISSIONS } from "../../constants/permissions";
import bestellungenService, { getAutomatischeBedarfsmeldungen, naechsteBestellnummer } from "../../services/einkauf/bestellungenService";
import lieferantenService from "../../services/einkauf/lieferantenService";
import artikelService from "../../services/logistik/artikelService";
import auftraegeService from "../../services/verkauf/auftraegeService";
import angeboteService from "../../services/verkauf/angeboteService";
import OverviewCards from "../../components/OverviewCards";
import { getBerlinDate } from "../../utils/dateTime";
import { canBookGoodsReceipt, getPurchaseStep, getPurchaseStepLabel } from "../../utils/processFlow";
import { useSyncedServiceData } from "../../hooks/useSyncedServiceData";

function createBestellungDialogState(lieferanten: any[], artikel: any[]) {
    const ersterLieferant = lieferanten[0];
    const ersterArtikel = artikel[0];

    return {
        anfrageQuelle: "bedarfsmeldung",
        bedarfsmeldungId: "",
        lieferantId: ersterLieferant?.id ? String(ersterLieferant.id) : "",
        artikelId: ersterArtikel?.id ? String(ersterArtikel.id) : "",
        artikelNr: ersterArtikel?.artikelNr || "",
        artikelBezeichnung: ersterArtikel?.name || "",
        menge: 1,
        positionen: [],
        notiz: "",
        fehler: "",
        vorgemerktePositionen: []
    };
}

function normalizeText(value: any) {
    return String(value ?? "").trim().toLowerCase();
}

function getAnfrageQuelleLabel(bestellung: any) {
    if (bestellung.anfrageQuelle === "lieferantenvergleich") return "Lieferantenvergleich";
    return "Bedarfsmeldung";
}

function getAngebotsStatusLabel(bestellung: any) {
    return bestellung.lehrkraftAngebotAm
         ? `Angebot ${bestellung.lehrkraftAngebotAm}`
        : "Noch kein Angebot";
}

function getPositionenText(positionen: any[] = []) {
    return positionen.map(position => {
        const artikelNr = position.artikelNr ? `${position.artikelNr}: ` : "";
        return `${artikelNr}${position.artikel} (${position.menge})`;
    }).join(", ");
}

const AKTIVE_AUFTRAGSSTATUS = ["offen", "abgerechnet"];

function istOffenesAngebot(angebot: any) {
    return ["wartet auf antwort"].includes(String(angebot.status || "").toLowerCase());
}

function getVerplanteMengen(auftraege: any[] = []) {
    return auftraege
        .filter(auftrag => AKTIVE_AUFTRAGSSTATUS.includes(String(auftrag.status || "").toLowerCase()))
        .reduce((map, auftrag) => {
            (auftrag.positionen || [])
                .filter(position => position.leistungTyp !== "Service" && position.artikelId)
                .forEach(position => {
                    const key = String(position.artikelId);
                    map[key] = Number(map[key] || 0) + Number(position.menge || 0);
                });
            return map;
        }, {});
}

function getOpenOfferCountByArtikel(angebote: any[] = []) {
    return angebote
        .filter(angebot => istOffenesAngebot(angebot))
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
        }, {});
}

function getArtikelInfoText({
    artikelEintrag,
    menge,
    verplanteMengen,
    offeneEinkaufsmengen,
    offeneAngeboteJeArtikel,
    highlightDemand = true
}: {
    artikelEintrag: any;
    menge: number;
    verplanteMengen: Record<string, number>;
    offeneEinkaufsmengen: Record<string, number>;
    offeneAngeboteJeArtikel: Record<string, number>;
    highlightDemand: boolean;
}) {
    const bestand = Number(artikelEintrag.bestand || 0);
    const verplant = Number(verplanteMengen[String(artikelEintrag.id)] || 0);
    const verfuegbar = bestand - verplant;
    const imZulauf = Number(offeneEinkaufsmengen[String(artikelEintrag.id)] || 0);
    const inAngeboten = Number(offeneAngeboteJeArtikel[String(artikelEintrag.id)] || 0);
    const projected = verfuegbar - Number(menge || 0);
    const sicherheitsbestand = Number(artikelEintrag.mindestmenge || 0);
    const unterschreitetSicherheitsbestand = projected < sicherheitsbestand;

    return {
        text: `Verfügbar: ${verfuegbar} | Bestand: ${bestand} | Reserviert: ${verplant} | Im Zulauf: ${imZulauf} | In Angeboten: ${inAngeboten}${unterschreitetSicherheitsbestand ? ` | Bedarfbestand: ${projected} | Sicherheitsbestand: ${sicherheitsbestand}` : ""}`,
        istKritisch: Number(menge || 0) > verfuegbar || (highlightDemand && unterschreitetSicherheitsbestand)
    };
}

export default function Bestellungen() {
    const today = getBerlinDate();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [bestellungen, setBestellungen] = useSyncedServiceData(["bestellungen"], () => bestellungenService.getAll());
    const [offen, setOffen] = useState(false);
    const [suchbegriff, setSuchbegriff] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [quellenFilter, setQuellenFilter] = useState("");
    const [selectedBedarfIds, setSelectedBedarfIds] = useState<Array<string | number>>([]);
    const lieferanten = lieferantenService.getAll();
    const artikel = artikelService.getAll().filter(item => item.istEinkaufbar);
    const auftraege = auftraegeService.getAll();
    const angebote = angeboteService.getAll();
    const automatischeBedarfsmeldungen = useMemo(() => getAutomatischeBedarfsmeldungen(), [bestellungen]);
    const bedarfsmeldungen = useMemo(
        () => bestellungen.filter(item => item.status === "bedarf gemeldet"),
        [bestellungen]
    );
    const verplanteMengen = useMemo(() => getVerplanteMengen(auftraege), [auftraege]);
    const offeneAngeboteJeArtikel = useMemo(() => getOpenOfferCountByArtikel(angebote), [angebote]);
    const offeneEinkaufsmengen = useMemo(() => {
        return bestellungenService.getAll()
            .filter(item => ["angefragt", "bestaetigt", "versendet"].includes(String(item.status || "").toLowerCase()))
            .reduce((map: Record<string, number>, item) => {
                (item.positionen || []).forEach((position: any) => {
                    const key = String(position.artikelId || "");
                    if (!key) return;
                    map[key] = Number(map[key] || 0) + Number(position.menge || 0);
                });
                return map;
            }, {});
    }, [bestellungen]);
    const [dialogState, setDialogState] = useState(() => createBestellungDialogState(lieferanten, artikel));
    const lieferantenOptionen = lieferanten.map(item => ({ value: String(item.id), label: `${item.lieferantenNr} - ${item.firma}` }));
    const artikelOptionen = artikel.map(item => ({
        value: String(item.id),
        label: `${item.artikelNr} - ${item.name} [${item.artikelTyp}] (EK: ${Number(item.einkaufspreis || item.preis || 0).toFixed(2)} EUR, Bestand: ${item.bestand})`
    }));
    const bedarfOptionen = bedarfsmeldungen.map(item => ({
        value: String(item.id),
        label: `${item.bestellNr} - ${getPositionenText(item.positionen || [])}`
    }));

    const aktualisiereDialogNachArtikel = (value: string) => {
        const auswahl = artikel.find(item => String(item.id) === String(value));
        setDialogState(item => ({
            ...item,
            artikelId: value,
            artikelNr: auswahl?.artikelNr || item.artikelNr,
            artikelBezeichnung: auswahl?.name || item.artikelBezeichnung
        }));
    };

    const bedarfsmeldungUebernehmen = (bedarfsmeldungId: string) => {
        const bedarfsmeldung = bedarfsmeldungen.find(item => String(item.id) === String(bedarfsmeldungId));
        setDialogState(current => ({
            ...current,
            bedarfsmeldungId,
            positionen: (bedarfsmeldung?.positionen || []).map(position => ({
                artikelId: position.artikelId || "",
                artikelNr: position.artikelNr || "",
                artikel: position.artikel || "",
                menge: Number(position.menge || 0),
                einzelpreis: Number(position.einzelpreis || 0)
            })) || [],
            notiz: bedarfsmeldung
                 ? `Übernommen aus Bedarfsmeldung ${bedarfsmeldung.bestellNr}.`
                : current.notiz,
            fehler: ""
        }));
    };

    const neu = (vorgaben: any) => {
        const basis = createBestellungDialogState(lieferanten, artikel);
        const naechsterDialog = {
            ...basis,
            anfrageQuelle: vorgaben.anfrageQuelle || basis.anfrageQuelle,
            lieferantId: vorgaben.lieferantId || basis.lieferantId
        };
        setDialogState(naechsterDialog);
        if (vorgaben.bedarfsmeldungId) {
            const bedarfsmeldung = bedarfsmeldungen.find(item => String(item.id) === String(vorgaben.bedarfsmeldungId));
            setDialogState({
            ...naechsterDialog,
            bedarfsmeldungId: String(vorgaben.bedarfsmeldungId),
            positionen: (vorgaben.positionen || bedarfsmeldung?.positionen || []).map(position => ({
                artikelId: position.artikelId || "",
                artikelNr: position.artikelNr || "",
                artikel: position.artikel || "",
                menge: Number(position.menge || 0),
                einzelpreis: Number(position.einzelpreis || 0)
            })) || [],
            notiz: vorgaben.notiz || (bedarfsmeldung
                 ? `Übernommen aus Bedarfsmeldung ${bedarfsmeldung.bestellNr}.`
                : "")
        });
        }
        setOffen(true);
    };

    useEffect(() => {
        const newMode = searchParams.get("new");
        if (!newMode) return;
        if (newMode === "lieferantenvergleich") {
            neu({
                anfrageQuelle: "lieferantenvergleich",
                lieferantId: searchParams.get("lieferantId") || ""
            });
        }
        if (newMode === "bedarfsmeldung") {
            neu({
                anfrageQuelle: "bedarfsmeldung",
                bedarfsmeldungId: searchParams.get("bedarfId") || ""
            });
        }
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("new");
        nextParams.delete("lieferantId");
        nextParams.delete("bedarfId");
        setSearchParams(nextParams, { replace: true });
    }, [searchParams]);

    const positionHinzufuegen = () => {
        const artikelNr = dialogState.artikelNr.trim();
        const auswahl = artikel.find(item =>
            String(item.id) === String(dialogState.artikelId)
            || normalizeText(item.artikelNr) === normalizeText(artikelNr)
        );
        const artikelBezeichnung = auswahl?.name || dialogState.artikelBezeichnung.trim() || `Artikel ${artikelNr}`;
        const aufgeloesteArtikelNr = auswahl?.artikelNr || artikelNr;

        if (!aufgeloesteArtikelNr || Number(dialogState.menge) <= 0) {
            setDialogState(current => ({ ...current, fehler: "Bitte Artikelnummer und Menge erfassen." }));
            return;
        }

        setDialogState(vorherige => {
            const vorhanden = vorherige.positionen.find(item => normalizeText(item.artikelNr) === normalizeText(aufgeloesteArtikelNr));
            return {
                ...vorherige,
                positionen: vorhanden
                    ? vorherige.positionen.map(item => normalizeText(item.artikelNr) === normalizeText(aufgeloesteArtikelNr)
                        ? { ...item, menge: Number(item.menge || 0) + Number(vorherige.menge) }
                        : item)
                    : [...vorherige.positionen, {
                        artikelId: auswahl?.id || "",
                        artikelNr: aufgeloesteArtikelNr,
                        artikel: artikelBezeichnung,
                        menge: Number(vorherige.menge),
                        einzelpreis: Number(auswahl?.einkaufspreis || 0)
                    }],
                artikelId: artikel[0]?.id ? String(artikel[0].id) : "",
                artikelNr: artikel[0]?.artikelNr || "",
                artikelBezeichnung: artikel[0]?.name || "",
                menge: 1,
                fehler: ""
            };
        });
    };

    const gruppenbestellungStarten = () => {
        const ausgewaehlteBedarfe = automatischeBedarfsmeldungen.filter(item =>
            selectedBedarfIds.some(id => String(id) === String(item.id))
        );
        if (ausgewaehlteBedarfe.length === 0) return;

        const positionenMap = new Map<string, any>();
        ausgewaehlteBedarfe.forEach(row => {
            const key = String(row.artikelId);
            const vorhandenePosition = positionenMap.get(key);
            const einzelpreis = artikel.find(item => String(item.id) === String(row.artikelId))?.einkaufspreis || 0;
            if (vorhandenePosition) {
                vorhandenePosition.menge += Number(row.empfohleneMenge || 0);
                return;
            }
            positionenMap.set(key, {
                artikelId: row.artikelId,
                artikelNr: row.artikelNr,
                artikel: row.artikel,
                menge: Number(row.empfohleneMenge || 0),
                einzelpreis
            });
        });

        neu({
            anfrageQuelle: "bedarfsmeldung",
            bedarfsmeldungId: ausgewaehlteBedarfe.map(item => item.id).join(","),
            positionen: Array.from(positionenMap.values()),
            notiz: `Gruppenbestellung aus ${ausgewaehlteBedarfe.length} Bedarfsmeldungen übernommen: ${ausgewaehlteBedarfe.map(item => item.artikelNr).join(", ")}.`
        });
    };

    const speichern = () => {
        const lieferant = lieferanten.find(item => item.id === Number(dialogState.lieferantId));
        if (dialogState.anfrageQuelle === "lieferantenvergleich" && !lieferant) {
            setDialogState(current => ({ ...current, fehler: "Bitte für den Lieferantenvergleich einen Lieferanten auswählen." }));
            return false;
        }
        if (dialogState.positionen.length === 0) {
            setDialogState(current => ({ ...current, fehler: "Bitte mindestens eine Position erfassen." }));
            return false;
        }

        bestellungenService.add({
            bestellNr: naechsteBestellnummer(),
            lieferantId: lieferant?.id || "",
            datum: today,
            status: "angefragt",
            anfrageQuelle: dialogState.anfrageQuelle,
            bedarfsmeldungId: dialogState.bedarfsmeldungId || "",
            anfrageNotiz: dialogState.notiz || "",
            positionen: dialogState.positionen
        });
        setBestellungen(bestellungenService.getAll());
        setDialogState(createBestellungDialogState(lieferanten, artikel));
        return true;
    };

    const data = bestellungen
        .map(bestellung => ({
            ...bestellung,
            lieferantAnzeige: bestellung.lieferant || "Noch nicht zugeordnet",
            positionenText: getPositionenText(bestellung.positionen),
            artikelnummernText: (bestellung.positionen || []).map(position => position.artikelNr || "-").join(", "),
            anfrageQuelleLabel: getAnfrageQuelleLabel(bestellung),
            angebotsStatus: getAngebotsStatusLabel(bestellung),
            prozess: getPurchaseStepLabel(getPurchaseStep(bestellung))
        }))
        .filter(bestellung => {
            const passtZumStatus = !statusFilter || bestellung.status === statusFilter;
            const passtZurQuelle = !quellenFilter || bestellung.anfrageQuelle === quellenFilter;
            const passtZurSuche = Object.values(bestellung).join(" ").toLowerCase().includes(suchbegriff.toLowerCase());
            return passtZumStatus && passtZurQuelle && passtZurSuche;
        });
    const gemeldeteBedarfe = bestellungen.filter(item => item.status === "bedarf gemeldet").length;
    const angefragteBestellungen = bestellungen.filter(item => item.status === "angefragt").length;
    const versendeteBestellungen = bestellungen.filter(item => item.status === "versendet").length;
    const eingegangeneBestellungen = bestellungen.filter(item => item.status === "eingegangen").length;
    const offeneAutomatischeBedarfe = automatischeBedarfsmeldungen.length;

    return <>
        <OverviewCards cards={[
            { label: "Bestellungen gesamt", value: bestellungen.length },
            { label: "Bedarf gemeldet", value: gemeldeteBedarfe },
            { label: "Kritische Bedarfsmeldungen", value: offeneAutomatischeBedarfe },
            { label: "Anfragen offen", value: angefragteBestellungen },
            { label: "Aus Lieferantenvergleich", value: bestellungen.filter(item => item.anfrageQuelle === "lieferantenvergleich").length },
            { label: "Wareneingang gebucht", value: eingegangeneBestellungen }
        ]}/>
        <DataTable
            title="Offene Bedarfsmeldungen aus dem Artikelbestand"
            selectableColumns={false}
            selectableRows
            selectedRowIds={selectedBedarfIds}
            onSelectedRowsChange={setSelectedBedarfIds}
            data={automatischeBedarfsmeldungen}
            columns={[
                { field: "artikelNr", title: "Artikelnummer" },
                { field: "artikel", title: "Artikel" },
                { field: "bestand", title: "Bestand" },
                { field: "bedarfsmeldungBei", title: "Bedarfsmeldung bei" },
                { field: "mindestmenge", title: "Sicherheitsbestand" },
                { field: "empfohleneMenge", title: "Empfohlene Bestellmenge" }
            ]}
            toolbarActions={[
                {
                    name: "group-create",
                    label: `Auswahl übernehmen (${selectedBedarfIds.length})`,
                    permission: PERMISSIONS.EINKAUF_BEARBEITEN,
                    onClick: gruppenbestellungStarten,
                    variant: "success",
                    isDisabled: () => selectedBedarfIds.length === 0
                }
            ]}
            rowActions={[
                {
                    name: "create",
                    label: "In Bestellung übernehmen",
                    permission: PERMISSIONS.EINKAUF_BEARBEITEN,
                    onClick: row => neu({
                        anfrageQuelle: "bedarfsmeldung",
                        bedarfsmeldungId: row.id,
                        positionen: [{
                            artikelId: row.artikelId,
                            artikelNr: row.artikelNr,
                            artikel: row.artikel,
                            menge: row.empfohleneMenge,
                            einzelpreis: artikel.find(item => String(item.id) === String(row.artikelId))?.einkaufspreis || 0
                        }],
                        notiz: `Automatische Bedarfsmeldung für ${row.artikelNr} aus dem Artikelbestand übernommen.`
                    }),
                    variant: "secondary"
                }
            ]}
        />
        <DataTable
            title="Bestellungen"
            columns={[
                { field: "bestellNr", title: "Bestellnummer" },
                { field: "anfrageQuelleLabel", title: "Auslöser" },
                { field: "artikelnummernText", title: "Artikelnummern" },
                { field: "lieferantAnzeige", title: "Lieferant", render: row => row.lieferantId ? <Link className="detail-link" to={`/lieferantenfocus=${row.lieferantId}`}>{row.lieferant}</Link> : row.lieferantAnzeige },
                { field: "status", title: "Status" },
                { field: "angebotsStatus", title: "Lehrkraftangebot" },
                { field: "prozess", title: "Prozess" },
                { field: "positionenText", title: "Positionen" }
            ]}
            data={data}
            selectableColumns={false}
            focusRowId={searchParams.get("focus") || ""}
            detailLinkResolver={({ field, row }) => field === "lieferantAnzeige" && row.lieferantId ? `/lieferantenfocus=${row.lieferantId}` : null}
            searchable
            onSearch={setSuchbegriff}
            filters={[
                {
                    name: "status",
                    label: "Status",
                    options: [
                        { value: "bedarf gemeldet", label: "Bedarf gemeldet" },
                        { value: "angefragt", label: "Angefragt" },
                        { value: "bestaetigt", label: "Bestätigt" },
                        { value: "versendet", label: "Versendet" },
                        { value: "eingegangen", label: "Eingegangen" }
                    ]
                },
                {
                    name: "quelle",
                    label: "Auslöser",
                    options: [
                        { value: "bedarfsmeldung", label: "Bedarfsmeldung" },
                        { value: "lieferantenvergleich", label: "Lieferantenvergleich" }
                    ]
                }
            ]}
            onFilter={filters => {
                setStatusFilter(filters.status || "");
                setQuellenFilter(filters.quelle || "");
            }}
            toolbarActions={[{ name: "new", label: "Neue Anfrage", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: () => neu() }]}
            rowActions={[
                { name: "derive", label: "Anfrage ableiten", permission: PERMISSIONS.EINKAUF_BEARBEITEN, onClick: row => neu({ anfrageQuelle: "bedarfsmeldung", bedarfsmeldungId: row.id }), variant: "secondary", isVisible: row => row.status === "bedarf gemeldet" },
                { name: "goods", label: "Wareneingang", permission: PERMISSIONS.LAGER_BUCHEN, onClick: row => navigate(`/wareneingaenge?focus=${row.id}`), variant: "secondary", isVisible: row => canBookGoodsReceipt(row) }
            ]}
        />
        <Dialog
            open={offen}
            title="Neue Einkaufsanfrage"
            onClose={() => setOffen(false)}
            footer={<SaveButton onSave={speichern} onSuccess={() => setOffen(false)}>Anfrage speichern</SaveButton>}
        >
            <div><Label required glossaryKey="ausloeser">Auslöser</Label>
                <select value={dialogState.anfrageQuelle} onChange={event => setDialogState(item => ({ ...item, anfrageQuelle: event.target.value, fehler: "" }))}>
                    <option value="bedarfsmeldung">Aufgrund einer Bedarfsmeldung</option>
                    <option value="lieferantenvergleich">Aufgrund eines Lieferantenvergleichs</option>
                </select>
            </div>
            {dialogState.anfrageQuelle === "bedarfsmeldung" && <div>
                <Label glossaryKey="bedarfsmeldung">Bestehende Bedarfsmeldung übernehmen</Label>
                <LookupField value={dialogState.bedarfsmeldungId} options={bedarfOptionen} onChange={bedarfsmeldungUebernehmen} placeholder="Bedarfsmeldung auswählen..."/>
            </div>}
            <div><Label glossaryKey="lieferantenvergleich">{dialogState.anfrageQuelle === "lieferantenvergleich" ? "Lieferant aus Vergleich" : "Lieferant (optional)"}</Label>
                <LookupField value={dialogState.lieferantId} options={lieferantenOptionen} onChange={value => setDialogState(item => ({ ...item, lieferantId: value, fehler: "" }))} placeholder="Lieferant suchen..."/>
            </div>
            <div><Label>Bestelldatum</Label><input type="date" value={today} disabled/></div>
            <div className="form-row bestellposition-hinzufuegen">
                <div><Label glossaryKey="artikelkatalog">Artikelkatalog (optional)</Label>
                    <LookupField value={dialogState.artikelId} options={artikelOptionen} onChange={aktualisiereDialogNachArtikel} placeholder="Artikel suchen..."/>
                </div>
                <div><Label required glossaryKey="artikelnummer">Artikelnummer</Label><TextField value={dialogState.artikelNr} onChange={wert => setDialogState(item => ({ ...item, artikelNr: wert }))}/></div>
                <div><Label>Bezeichnung</Label><TextField value={dialogState.artikelBezeichnung} onChange={wert => setDialogState(item => ({ ...item, artikelBezeichnung: wert }))}/></div>
                <div><Label glossaryKey="angebotspositionen">Menge</Label><NumberField value={dialogState.menge} min="1" onChange={wert => setDialogState(item => ({ ...item, menge: Number(wert) }))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufügen</button>
            </div>
            <div className="form-row"><p>Die Schülerfirma kann hier direkt Artikelnummer und benötigte Menge erfassen. Die Lehrkraft sieht damit später schon die wesentlichen Angaben für ihr Angebot.</p></div>
            <div className="form-row">
                <Label required glossaryKey="angebotspositionen">Anfragepositionen</Label>
                {dialogState.positionen.length === 0 ? <p>Noch keine Position vorhanden.</p> : <ul className="positionsliste">
                    {dialogState.positionen.map((position, index) => {
                        const artikelEintrag = artikel.find(item => String(item.id) === String(position.artikelId) || String(item.artikelNr) === String(position.artikelNr));
                        const info = artikelEintrag
                            ? getArtikelInfoText({
                                artikelEintrag,
                                menge: Number(position.menge || 0),
                                verplanteMengen,
                                offeneEinkaufsmengen,
                                offeneAngeboteJeArtikel,
                                highlightDemand: false
                            })
                            : null;

                        return <li key={`${position.artikelNr}-${index}`}>
                            <div>{position.artikelNr}: {position.artikel}</div>
                            <NumberField value={position.menge} min="1" onChange={wert => setDialogState(items => ({
                                ...items,
                                positionen: items.positionen.map((entry, positionIndex) => positionIndex === index
                                    ? { ...entry, menge: Math.max(1, Number(wert || 1)) }
                                    : entry)
                            }))}/>
                            {info && <div><small className={info.istKritisch ? "form-error" : ""}>{info.text}</small></div>}
                            <button type="button" className="link-button" onClick={() => setDialogState(items => ({ ...items, positionen: items.positionen.filter((_, positionIndex) => positionIndex !== index) }))}>Entfernen</button>
                        </li>;
                    })}
                </ul>}
            </div>
            <div className="form-row">
                <Label>Hinweis für die Lehrkraft</Label>
                <TextArea rows={3} value={dialogState.notiz} onChange={wert => setDialogState(item => ({ ...item, notiz: wert }))}/>
                {dialogState.fehler && <p className="form-error">{dialogState.fehler}</p>}
            </div>
        </Dialog>
    </>;
}

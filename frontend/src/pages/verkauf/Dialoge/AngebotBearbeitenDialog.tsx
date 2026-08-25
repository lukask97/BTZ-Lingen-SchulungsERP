import { Fragment } from "react";
import Dialog from "../../../components/Dialog";
import Label from "../../../components/form/Label";
import LookupField from "../../../components/form/LookupField";
import NumberField from "../../../components/form/NumberField";
import SaveButton from "../../../components/SaveButton";
import Checkbox from "../../../components/form/Checkbox";
import { getCustomerName } from "../../../utils/customerReferences";
import { formatTimestampForDisplay } from "../../../utils/dateTime";
import {
    calculateMwSt,
    calculateNetto,
    calculatePositionenTotal,
    gesamtNachAbzug,
    MWST_RATE
} from "../angeboteHelpers";

type AngebotBearbeitenDialogProps = {
    open: boolean;
    editingOfferId: any;
    draft: any;
    anfrageImDialog: any;
    bearbeiterOptionen: any[];
    setDraft: (value: any) => void;
    weiterleitungsAusschnitt: any[];
    getDialogMessageVariant: (nachricht: any) => string;
    getDialogMessageLabel: (nachricht: any) => string;
    bisherigeAngeboteImDialog: any[];
    angebotAlsVorlageUebernehmen: (id: string) => void;
    leistungsOptionen: any[];
    positionHinzufuegen: () => void;
    getVerfuegbarkeitFuerPosition: (position: any) => { text: string; istKritisch: boolean };
    leistungen: any[];
    hasIndividualisierungen: (leistung: any) => boolean;
    getOptionGroups: (individualisierungen: any[]) => any[];
    calculateOptionAufpreisProEinheit: (position: any, leistung: any) => number;
    syncOptionRows: (positionen: any[], parentPosition: any, leistung: any, artikel: any[]) => any[];
    artikel: any[];
    verplanteMengen: Record<string, number>;
    aktuellerAngebotsbedarf: Record<string, number>;
    offeneBestellmengen: Record<string, number>;
    getIndividualisierungsLabel: (groupId: any) => string;
    handleOptionChange: (rowId: string, groupId: any, value: string) => void;
    createPreispositionDraft: () => any;
    speichern: () => boolean;
    handleClose: () => void;
    kundeImDialog: any;
    hatUnvollstaendigeKundenadresse: (kunde: any) => boolean;
    brauchtFreigabe: boolean;
    gfFreigabeAktivImDialog: boolean;
    automatischeGfFreigabeImDialog: boolean;
    sicherheitsbestandFreigabeImDialog: boolean;
    preisabweichungFreigabeImDialog: boolean;
    optionen: any;
};

export default function AngebotBearbeitenDialog(props: AngebotBearbeitenDialogProps) {
    const {
        open,
        editingOfferId,
        draft,
        anfrageImDialog,
        bearbeiterOptionen,
        setDraft,
        weiterleitungsAusschnitt,
        getDialogMessageVariant,
        getDialogMessageLabel,
        bisherigeAngeboteImDialog,
        angebotAlsVorlageUebernehmen,
        leistungsOptionen,
        positionHinzufuegen,
        getVerfuegbarkeitFuerPosition,
        leistungen,
        hasIndividualisierungen,
        getOptionGroups,
        calculateOptionAufpreisProEinheit,
        syncOptionRows,
        artikel,
        verplanteMengen,
        aktuellerAngebotsbedarf,
        offeneBestellmengen,
        getIndividualisierungsLabel,
        handleOptionChange,
        createPreispositionDraft,
        speichern,
        handleClose,
        kundeImDialog,
        hatUnvollstaendigeKundenadresse,
        brauchtFreigabe,
        gfFreigabeAktivImDialog,
        automatischeGfFreigabeImDialog,
        sicherheitsbestandFreigabeImDialog,
        preisabweichungFreigabeImDialog,
        optionen
    } = props;

    return <Dialog
        open={open}
        title={editingOfferId  "Angebot bearbeiten" : (draft.sourceInquiryId  "Angebot aus Kundenanfrage erstellen" : "Neues Angebot")}
        onClose={handleClose}
        footer={<SaveButton onSave={speichern} onSuccess={handleClose}>{editingOfferId  "Änderungen speichern" : "Angebot speichern"}</SaveButton>}
    >
        {draft.sourceInquiryId && anfrageImDialog && <div className="offer-forward-panel form-row thread-section">
            <div className="thread-section-header">
                <Label>Vorgang</Label>
            </div>
            <div className="offer-forward-grid">
                <div className="offer-forward-card thread-subcard">
                    <Label>Kunde</Label>
                    <p>{getCustomerName(anfrageImDialog.kundeId, anfrageImDialog.kunde)}</p>
                </div>
                <div className="offer-forward-card thread-subcard">
                    <Label>Anfrage-Nr.</Label>
                    <p>{anfrageImDialog.vorgangId || `anfrage-${anfrageImDialog.id}`}</p>
                </div>
                <div className="offer-forward-card thread-subcard">
                    <Label>Bearbeitet von</Label>
                    <LookupField value={draft.bearbeiter} options={bearbeiterOptionen} onChange={value => setDraft((item: any) => ({ ...item, bearbeiter: value }))} placeholder="Bearbeiter auswählen..."/>
                </div>
            </div>
            <div className="offer-forward-card thread-subcard">
                <Label>Chat-Ausschnitt zum Nachlesen</Label>
                {weiterleitungsAusschnitt.length === 0  <p>Noch keine weiterleitbaren Nachrichten vorhanden.</p> : <div className="offer-forward-thread">
                    {weiterleitungsAusschnitt.map((nachricht: any) => {
                        const variant = getDialogMessageVariant(nachricht);
                        return <div
                            key={nachricht.id}
                            className={`thread-message-row ${variant === "customer"  "thread-message-row-customer" : variant === "outbound"  "thread-message-row-outbound" : "thread-message-row-internal"}`}
                        >
                            <article className={`thread-message ${variant === "customer"  "thread-message-customer" : variant === "outbound"  "thread-message-outbound" : "thread-message-internal"}`}>
                                <div className="thread-message-meta">
                                    <strong>{nachricht.senderName || nachricht.senderRolle}</strong>
                                    <span>{getDialogMessageLabel(nachricht)} | {formatTimestampForDisplay(nachricht.zeitpunkt || nachricht.datum)} | {nachricht.betreff}</span>
                                </div>
                                <p className="thread-message-text">{nachricht.nachricht}</p>
                            </article>
                        </div>;
                    })}
                </div>}
            </div>
        </div>}
        {draft.sourceInquiryId && bisherigeAngeboteImDialog.length > 0 && <div className="form-row thread-template-section thread-section">
            <div className="thread-section-header">
                <Label>Vorlagen</Label>
            </div>
            <div className="thread-template-panel">
                <div className="offer-forward-card thread-subcard">
                    <Label glossaryKey="lieferantenvergleich">Frühere Angebote als Vorlage</Label>
                    <p>Bei Bedarf kann ein bisheriger Angebotsstand übernommen und anschließend geändert werden.</p>
                </div>
                <div className="thread-document-links">
                    {bisherigeAngeboteImDialog.map((item: any) => <button
                        key={`dialog-template-${item.id}`}
                        type="button"
                        className={`thread-document-link${String(draft.selectedTemplateOfferId) === String(item.id)  " is-active" : ""}`}
                        onClick={() => angebotAlsVorlageUebernehmen(String(item.id))}
                    >
                        {item.angebotsNr} übernehmen
                    </button>)}
                </div>
            </div>
        </div>}
        <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label>Angebotsdaten</Label>
            </div>
            <div className="thread-form-grid">
                <div><Label>Angebotsnummer</Label><input type="text" value={draft.angebotsNrDraft} disabled/></div>
                <div><Label glossaryKey="gueltigbis">Gültig bis</Label><input type="date" value={draft.gueltigBis} onChange={event => setDraft((item: any) => ({ ...item, gueltigBis: event.target.value }))}/></div>
            </div>
        </div>
        <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label>Position hinzufügen</Label>
            </div>
            <div className="thread-form-grid thread-form-grid-actions">
                <div><Label>Artikel / Service</Label><LookupField value={draft.leistungId} options={leistungsOptionen} onChange={value => setDraft((item: any) => ({ ...item, leistungId: value }))} placeholder="Artikel oder Service suchen..."/></div>
                <div><Label glossaryKey="angebotspositionen">Menge</Label><NumberField value={draft.menge} min="1" onChange={wert => setDraft((item: any) => ({ ...item, menge: Number(wert) }))}/></div>
                <button type="button" onClick={positionHinzufuegen}>Position hinzufügen</button>
            </div>
            <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)" }}>
                Konfigurierbare Baugruppen sind im Suchfeld markiert und können mehrfach mit unterschiedlichen Individualisierungen hinzugefügt werden.
            </p>
        </div>
        <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label glossaryKey="angebotspositionen">Angebotspositionen</Label>
            </div>
            {draft.positionenDraft.filter((position: any) => !position.isOptionForId).length === 0  <p>Noch keine Position vorhanden.</p> : <div className="position-table-wrapper">
                <table className="position-table">
                    <thead>
                        <tr>
                            <th>Artikel-Nr.</th>
                            <th>Name</th>
                            <th>Menge</th>
                            <th>Einzelpreis</th>
                            <th>Gesamtpreis</th>
                            <th>Aktion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {draft.positionenDraft.filter((position: any) => !position.isOptionForId).map((position: any, index: number) => {
                            const verfuegbarkeit = getVerfuegbarkeitFuerPosition(position);
                            const leistung = leistungen.find((item: any) =>
                                String(item.id) === String(position.serviceId || position.artikelId || "")
                                && String(item.leistungTyp || "") === String(position.leistungTyp || "")
                            );
                            const nummer = String(leistung.nummer || position.artikelId || position.serviceId || "-");
                            const positionMitIndividualisierung = hasIndividualisierungen(leistung);
                            const optionGroups = positionMitIndividualisierung
                                 getOptionGroups(leistung.individualisierungen)
                                : [];
                            const endpreisProEinheit = Number(position.einzelpreis || 0) + calculateOptionAufpreisProEinheit(position, leistung);
                            const endpreisGesamt = endpreisProEinheit * Number(position.menge || 0);

                            return <Fragment key={`${position.leistungTyp}-${position.artikelId || position.serviceId || index}-${position.rowId}`}>
                                <tr>
                                    <td>{nummer}</td>
                                    <td>{position.artikel}</td>
                                    <td className="position-table-quantity-cell">
                                        <NumberField
                                            value={position.menge}
                                            min="1"
                                            onChange={wert => setDraft((items: any) => {
                                                const aktualisiertePositionen = items.positionenDraft.map((item: any) => item.rowId === position.rowId
                                                     { ...item, menge: wert }
                                                    : item
                                                );
                                                const parentPosition = aktualisiertePositionen.find((item: any) => item.rowId === position.rowId);
                                                return {
                                                    ...items,
                                                    positionenDraft: parentPosition  syncOptionRows(aktualisiertePositionen, parentPosition, leistung, artikel) : aktualisiertePositionen
                                                };
                                            })}
                                        />
                                    </td>
                                    <td>{endpreisProEinheit.toFixed(2)} EUR</td>
                                    <td>{endpreisGesamt.toFixed(2)} EUR</td>
                                    <td>
                                        <button type="button" className="link-button" onClick={() => setDraft((items: any) => ({
                                            ...items,
                                            positionenDraft: items.positionenDraft.filter((item: any) => item.rowId !== position.rowId && item.isOptionForId !== position.rowId)
                                        }))}>Entfernen</button>
                                    </td>
                                </tr>
                                <tr className="position-table-detail-row">
                                    <td colSpan={6}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                            <p className={`position-availability${verfuegbarkeit.istKritisch  " position-availability-critical" : ""}`}>
                                                {verfuegbarkeit.text}
                                            </p>
                                            {optionGroups.length > 0 && (
                                                <div style={{ padding: "0.75rem", background: "var(--background-alt)", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                                                        <strong>Konfiguration</strong>
                                                        <span>Änderung: {calculateOptionAufpreisProEinheit(position, leistung) > 0  "+" : ""}{calculateOptionAufpreisProEinheit(position, leistung).toFixed(2)} EUR</span>
                                                    </div>
                                                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                                                        {optionGroups.map((groupId: any) => {
                                                            const gruppenOptionen = leistung.individualisierungen.filter((i: any) => i.kategorieId === groupId);
                                                            const defaultOpt = gruppenOptionen.find((i: any) => i.standard) || gruppenOptionen[0];
                                                            const currentVal = position.selectedOptionen.[groupId] || defaultOpt.individualArtikelId || "";
                                                            const aktuelleOption = gruppenOptionen.find((opt: any) => String(opt.individualArtikelId) === String(currentVal)) || defaultOpt;
                                                            const optionsArtikel = artikel.find((item: any) => String(item.id) === String(aktuelleOption.individualArtikelId));
                                                            const optionsBestand = Number(optionsArtikel.bestand || 0);
                                                            const optionsVerplant = Number(verplanteMengen[String(aktuelleOption.individualArtikelId || "")] || 0);
                                                            const optionsAngebotsbedarf = Number(aktuellerAngebotsbedarf[String(aktuelleOption.individualArtikelId || "")] || 0);
                                                            const optionsVerfuegbar = optionsBestand - optionsVerplant;
                                                            const optionsMindestbestand = Number(optionsArtikel.mindestmenge || 0);
                                                            const optionsProjected = optionsVerfuegbar - optionsAngebotsbedarf;
                                                            const optionsKritisch = optionsAngebotsbedarf > optionsVerfuegbar || optionsProjected < optionsMindestbestand;

                                                            return <div key={groupId} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
                                                                <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-secondary)", minHeight: "1.2rem", display: "block" }}>Individualisierung ({getIndividualisierungsLabel(groupId)})</label>
                                                                <select
                                                                    value={currentVal}
                                                                    onChange={e => handleOptionChange(position.rowId, groupId, e.target.value)}
                                                                >
                                                                    {gruppenOptionen.map((opt: any) => (
                                                                        <option key={opt.individualArtikelId} value={opt.individualArtikelId}>
                                                                            {opt.artikel} {Number(opt.preisaenderung || 0) > 0  `(+${Number(opt.preisaenderung).toFixed(2)} EUR)` : Number(opt.preisaenderung || 0) < 0  `(${Number(opt.preisaenderung).toFixed(2)} EUR)` : ""}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <small
                                                                    className={optionsKritisch  "form-error" : undefined}
                                                                    title={`Im Zulauf: ${Number(offeneBestellmengen[String(aktuelleOption.individualArtikelId || "")] || 0)}${optionsProjected < optionsMindestbestand  ` | Sicherheitsbestand von ${optionsMindestbestand} wird unterschritten` : ""}`}
                                                                >
                                                                    Bestand: {optionsBestand} | Verfuegbar: {optionsVerfuegbar}
                                                                </small>
                                                            </div>;
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            </Fragment>;
                        })}
                    </tbody>
                </table>
            </div>}
            <div className="thread-summary-card">
                <Label>Kalkulationsübersicht</Label>
                <div className="thread-summary-lines">
                    <div><span>Zwischensumme</span><strong>{calculatePositionenTotal(draft.positionenDraft).toFixed(2)} EUR</strong></div>
                    {draft.preispositionenDraft.length > 0 && draft.preispositionenDraft.map((position: any) => {
                        const baseTotal = calculatePositionenTotal(draft.positionenDraft);
                        return <div key={position.id}>
                            <span>{position.beschreibung || (position.typ === "percent"  "Prozent-Anpassung" : "Betrag")}</span>
                            <strong>{position.typ === "percent"  `${Number(position.wert || 0).toFixed(2)} % ≈ ${(baseTotal * Number(position.wert || 0) / 100).toFixed(2)} EUR` : `${Number(position.wert || 0).toFixed(2)} EUR`}</strong>
                        </div>;
                    })}
                    <div className="offer-total"><span>Gesamtbetrag exkl. MwSt</span><strong style={{ fontSize: "1.15em" }}>{calculateNetto(draft.positionenDraft, draft.preispositionenDraft, draft.rabattBetrag).toFixed(2)} EUR</strong></div>
                    <div><span>MwSt ({(MWST_RATE * 100).toFixed(0)}%)</span><strong>{calculateMwSt(draft.positionenDraft, draft.preispositionenDraft, draft.rabattBetrag).toFixed(2)} EUR</strong></div>
                    <div className="offer-total"><span>Gesamtbetrag inkl. MwSt</span><strong style={{ fontSize: "1.15em" }}>{gesamtNachAbzug(draft.positionenDraft, draft.preispositionenDraft, draft.rabattBetrag).toFixed(2)} EUR</strong></div>
                </div>
            </div>
        </div>
        <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label glossaryKey="zuAbschlaege">Zu- und Abschläge</Label>
            </div>
            <div className="position-table-wrapper">
                <table className="position-table">
                    <thead>
                        <tr>
                            <th>Beschreibung</th>
                            <th>Typ</th>
                            <th>Wert</th>
                            <th>Aktion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {draft.preispositionenDraft.map((position: any) => (
                            <tr key={position.id}>
                                <td>
                                    <input
                                        type="text"
                                        value={position.beschreibung}
                                        placeholder="z. B. Bundle-Rabatt oder Expresslieferung"
                                        onChange={event => setDraft((current: any) => ({
                                            ...current,
                                            preispositionenDraft: current.preispositionenDraft.map((item: any) => item.id === position.id  { ...item, beschreibung: event.target.value } : item)
                                        }))}
                                    />
                                </td>
                                <td>
                                    <select
                                        value={position.typ}
                                        onChange={event => setDraft((current: any) => ({
                                            ...current,
                                            preispositionenDraft: current.preispositionenDraft.map((item: any) => item.id === position.id  { ...item, typ: event.target.value } : item)
                                        }))}
                                    >
                                        <option value="amount">Betrag</option>
                                        <option value="percent">Prozent</option>
                                    </select>
                                </td>
                                <td>
                                    <NumberField
                                        value={position.wert}
                                        min="-999999"
                                        step="0.01"
                                        format={position.typ === "percent"  "percent" : "currency"}
                                        onChange={wert => setDraft((current: any) => ({
                                            ...current,
                                            preispositionenDraft: current.preispositionenDraft.map((item: any) => item.id === position.id  { ...item, wert } : item)
                                        }))}
                                    />
                                </td>
                                <td>
                                    <button type="button" className="link-button" onClick={() => setDraft((current: any) => ({
                                        ...current,
                                        preispositionenDraft: current.preispositionenDraft.filter((item: any) => item.id !== position.id)
                                    }))}>
                                        Entfernen
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button type="button" onClick={() => setDraft((current: any) => ({
                ...current,
                preispositionenDraft: [...current.preispositionenDraft, createPreispositionDraft()]
            }))}>
                Neue Preisposition hinzufügen
            </button>
        </div>
        <div className="form-row thread-section">
            <div className="thread-section-header">
                <Label glossaryKey="freigabe">Freigabe</Label>
            </div>
            {hatUnvollstaendigeKundenadresse(kundeImDialog) && <p className="form-error">
                Beim Kunden fehlen Adressdaten. Bitte vor dem Versenden des Angebots Anschrift, PLZ und Ort beim Kunden nachfragen.
            </p>}
            <div className="offer-send-checkbox-row">
                <Checkbox checked={!brauchtFreigabe && draft.direktSenden} onChange={value => setDraft((item: any) => ({ ...item, direktSenden: value, freigabeDurchGf: value  false : item.freigabeDurchGf }))} disabled={brauchtFreigabe || gfFreigabeAktivImDialog}>
                    Freigabe direkt erteilen
                </Checkbox>
                <Checkbox checked={gfFreigabeAktivImDialog} onChange={value => setDraft((item: any) => ({ ...item, freigabeDurchGf: value, direktSenden: value  false : item.direktSenden }))} disabled={automatischeGfFreigabeImDialog || draft.direktSenden}>
                    Freigabe durch GF
                </Checkbox>
            </div>
            {brauchtFreigabe && <div className="form-error">
                <p>Du hast keine Berechtigung zur eigenständigen Freigabe.</p>
            </div>}
            {sicherheitsbestandFreigabeImDialog && <p className="form-error">
                Die GF-Freigabe wurde automatisch gesetzt, da ein Artikel unter den Sicherheitsbestand gerät.
            </p>}
            {preisabweichungFreigabeImDialog && <p className="form-error">
                Die GF-Freigabe wurde automatisch gesetzt, weil die Abweichung zur Artikelsumme den Grenzwert von {Number(optionen.angebotGfFreigabeAbweichungProzent || 10).toFixed(1)} % erreicht oder überschreitet.
            </p>}
        </div>
        {draft.fehler && <p className="form-error">{draft.fehler}</p>}
    </Dialog>;
}

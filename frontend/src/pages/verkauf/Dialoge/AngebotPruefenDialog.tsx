import OfferApprovalDialog from "../../../components/OfferApprovalDialog";
import { getCustomerName } from "../../../utils/customerReferences";
import { gesamtNachAbzug } from "../angeboteHelpers";

type AngebotPruefenDialogProps = {
    approvalOffer: any;
    approvalOpen: boolean;
    approvalNote: string;
    setApprovalOpen: (value: boolean) => void;
    setApprovalOffer: (value: any) => void;
    setApprovalNote: (value: string) => void;
    angebotAlsPdf: (angebot: any) => void;
    getVerfuegbarkeitFuerPosition: (position: any) => { text: string; istKritisch: boolean };
    angebote: any[];
    listNachrichtenZuVorgang: (vorgangId: string) => any[];
    getOffersForVorgang: (vorgangId: string, angebote: any[]) => any[];
    angebotFreigeben: (angebot: any) => void;
    angebotZurUeberarbeitungBearbeiten: (angebot: any) => void;
    angebotInternAblehnen: (angebot: any) => void;
    angebotAnGfWeiterleiten: (angebot: any) => void;
};

export default function AngebotPruefenDialog({
    approvalOffer,
    approvalOpen,
    approvalNote,
    setApprovalOpen,
    setApprovalOffer,
    setApprovalNote,
    angebotAlsPdf,
    getVerfuegbarkeitFuerPosition,
    angebote,
    listNachrichtenZuVorgang,
    getOffersForVorgang,
    angebotFreigeben,
    angebotZurUeberarbeitungBearbeiten,
    angebotInternAblehnen,
    angebotAnGfWeiterleiten
}: AngebotPruefenDialogProps) {
    if (!approvalOffer) return null;

    return <OfferApprovalDialog
        open={approvalOpen}
        title="Angebot prüfen"
        onClose={() => {
            setApprovalOpen(false);
            setApprovalOffer(null);
            setApprovalNote("");
        }}
        kunde={getCustomerName(approvalOffer.kundeId, approvalOffer.kunde)}
        vorgangId={approvalOffer.vorgangId || ""}
        status={approvalOffer.freigabeText || approvalOffer.status}
        currentOfferLabel={approvalOffer.angebotsNr}
        currentOfferAmount={`${gesamtNachAbzug(approvalOffer.positionen, approvalOffer.preispositionen || [], approvalOffer.rabattBetrag).toFixed(2)} EUR`}
        currentOfferNote={approvalOffer.verguenstigungsGrund || ""}
        discountLabel={Number(approvalOffer.rabattBetrag || 0) > 0 ? `${Number(approvalOffer.rabattBetrag || 0).toFixed(2)} EUR` : "Keine"}
        totalAmountLabel={`${gesamtNachAbzug(approvalOffer.positionen, approvalOffer.preispositionen || [], approvalOffer.rabattBetrag).toFixed(2)} EUR`}
        onOpenCurrentOffer={() => angebotAlsPdf(approvalOffer)}
        positionInfos={(approvalOffer.positionen || []).map((position: any, index: number) => {
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
        previousOffers={getOffersForVorgang(approvalOffer.vorgangId, angebote)
            .filter((item: any) => String(item.id) !== String(approvalOffer.id))
            .sort((a: any, b: any) => Number(a.revision || 0) - Number(b.revision || 0))
            .map((item: any) => ({
                id: item.id,
                label: item.angebotsNr,
                onClick: () => angebotAlsPdf(item)
            }))}
        messages={listNachrichtenZuVorgang(approvalOffer.vorgangId || "")}
        noteValue={approvalNote}
        onNoteChange={setApprovalNote}
        onApprove={() => angebotFreigeben(approvalOffer)}
        onRevise={() => angebotZurUeberarbeitungBearbeiten(approvalOffer)}
        onReject={() => angebotInternAblehnen(approvalOffer)}
        onForward={() => angebotAnGfWeiterleiten(approvalOffer)}
    />;
}

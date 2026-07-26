import PlaceholderModule from "../components/PlaceholderModule";
import angeboteService from "../services/angeboteService";
import auftraegeService from "../services/auftraegeService";
import customerInquiryService from "../services/customerInquiryService";
import kundenService from "../services/customerService";
import reklamationenService from "../services/reklamationenService";

export default function VerkaufOverview() {
    return <PlaceholderModule
        title="Verkauf"
        intro="Kurze Übersicht über die Verkaufsprozesse mit Kunden, Angeboten, Aufträgen, Anfragen und Reklamationen."
        cards={[
            { label: "Kunden", value: kundenService.list().length },
            { label: "Angebote", value: angeboteService.list().length },
            { label: "Aufträge", value: auftraegeService.list().length },
            { label: "Anfragen", value: customerInquiryService.list().length },
            { label: "Reklamationen", value: reklamationenService.list().length }
        ]}
        nextSteps={["Kunden pflegen", "Angebote erstellen", "Aufträge weiterbearbeiten", "Anfragen dokumentieren", "Reklamationen verfolgen"]}
        links={[
            { to: "/kunden", label: "Kunden" },
            { to: "/kundenanfragen", label: "Kundenanfragen" },
            { to: "/angebote", label: "Angebote" },
            { to: "/auftraege", label: "Aufträge" },
            { to: "/reklamationen", label: "Reklamationen" }
        ]}
    />;
}

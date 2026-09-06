import { Link } from "react-router-dom";

const SALES_FLOW_STEPS = [
    { key: "kundenanfragen", label: "Kundenanfrage", to: "/kundenanfragen" },
    { key: "angebote", label: "Angebot", to: "/angebote" },
    { key: "auftraege", label: "Auftrag", to: "/auftraege" },
    { key: "auftragsbestaetigung", label: "Auftragsbestätigung", to: "/vertriebsdokumente" },
    { key: "lieferschein", label: "Lieferschein", to: "/vertriebsdokumente" },
    { key: "versand", label: "Versand", to: "/versand" },
    { key: "rechnungen", label: "Rechnung", to: "/rechnungen" }
];

type SalesFlowBarProps = {
    currentStep: string;
};

export default function SalesFlowBar({ currentStep }: SalesFlowBarProps) {
    const currentIndex = SALES_FLOW_STEPS.findIndex(step => step.key === currentStep);
    const previousStep = currentIndex > 0 ? SALES_FLOW_STEPS[currentIndex - 1] : null;
    const nextStep = currentIndex >= 0 && currentIndex < SALES_FLOW_STEPS.length - 1 ? SALES_FLOW_STEPS[currentIndex + 1] : null;
    const previousTarget = previousStep?.to || "#";
    const nextTarget = nextStep?.to || "#";

    return <section className="sales-flow-bar" aria-labelledby="sales-flow-title">
        <div className="sales-flow-header">
            <div className="sales-flow-copy">
                <strong id="sales-flow-title">Verkaufsfluss</strong>
                <p className="module-hint">Führt Schritt für Schritt von der Kundenanfrage bis zur Rechnung.</p>
            </div>
            <div className="sales-flow-actions">
                <Link className={`button-secondary sales-flow-button${!previousStep ? " is-disabled" : ""}`} to={previousTarget} onClick={event => {
                    if (!previousStep) event.preventDefault();
                }}>
                    <span aria-hidden="true">←</span> Zurück
                </Link>
                <Link className={`button-primary sales-flow-button${!nextStep ? " is-disabled" : ""}`} to={nextTarget} onClick={event => {
                    if (!nextStep) event.preventDefault();
                }}>
                    Weiter <span aria-hidden="true">→</span>
                </Link>
            </div>
        </div>
        <nav className="sales-flow-track" aria-label="Schritte im Verkaufsfluss">
            {SALES_FLOW_STEPS.map((step, index) => {
                const isActive = step.key === currentStep;
                const isCompleted = currentIndex > index;

                return <Link key={step.key} className={`sales-flow-step${isActive ? " is-active" : ""}${isCompleted ? " is-completed" : ""}`} to={step.to} aria-current={isActive ? "step" : undefined}>
                    <span className="sales-flow-index">{index + 1}</span>
                    <span className="sales-flow-label">{step.label}</span>
                </Link>;
            })}
        </nav>
    </section>;
}

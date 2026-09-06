import ModuleOverview from "./ModuleOverview";

export default function PlaceholderModule({ title, intro, cards = [], nextSteps = [], links = [] }) {
    return <ModuleOverview
        title={title}
        intro={intro}
        cards={cards}
        links={links}
    >
        {nextSteps.length > 0 && <section className="module-panel">
            <h2>Geplante Lernfunktionen</h2>
            <ul className="module-list">
                {nextSteps.map(step => <li key={step}>{step}</li>)}
            </ul>
        </section>}
    </ModuleOverview>;
}

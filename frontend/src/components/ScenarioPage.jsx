import { Link } from "react-router-dom";

export default function ScenarioPage({ title, intro, documentInfo, tasks, completionChecks, targetPages }) {
    return <div className="scenario-page">
        <h1>{title}</h1>
        <p>{intro}</p>

        <section className="module-panel">
            <h2>Fallakte</h2>
            <div className="scenario-document">
                {documentInfo.map(section => <div key={section.title} className="scenario-document-section">
                    <strong>{section.title}</strong>
                    <p>{section.text}</p>
                </div>)}
            </div>
        </section>

        <section className="module-panel">
            <h2>Arbeitsauftrag</h2>
            <ol className="scenario-list">
                {tasks.map(task => <li key={task}>{task}</li>)}
            </ol>
        </section>

        <section className="module-panel">
            <h2>Woran man die Lösung erkennt</h2>
            <ul className="scenario-list">
                {completionChecks.map(check => <li key={check}>{check}</li>)}
            </ul>
        </section>

        <section className="module-panel">
            <h2>Bearbeitung im System</h2>
            <div className="link-list">
                {targetPages.map(page => <Link key={page.to} className="button-link" to={page.to}>{page.label}</Link>)}
            </div>
        </section>
    </div>;
}

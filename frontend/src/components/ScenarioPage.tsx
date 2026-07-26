import { Link } from "react-router-dom";

export default function ScenarioPage({
    title,
    intro,
    caseProfile = [],
    documentInfo,
    tasks,
    completionChecks,
    targetPages,
    documentTemplates = [],
    teacherChecks = []
}) {
    return <div className="scenario-page">
        <h1>{title}</h1>
        <p>{intro}</p>

        {caseProfile.length > 0 && <section className="dashboard-two-column">
            {caseProfile.map(item => <article key={item.label} className="dashboard-panel">
                <div className="dashboard-panel-header">
                    <h2>{item.label}</h2>
                    <span>Fallprofil</span>
                </div>
                <p>{item.value}</p>
            </article>)}
        </section>}

        <section className="module-panel">
            <h2>Fallakte</h2>
            <div className="scenario-document">
                {documentInfo.map(section => <div key={section.title} className="scenario-document-section">
                    <strong>{section.title}</strong>
                    <p>{section.text}</p>
                </div>)}
            </div>
        </section>

        {documentTemplates.length > 0 && <section className="module-panel">
            <h2>Hilfreiche Vorlagen und Dokumente</h2>
            <ul className="scenario-list">
                {documentTemplates.map(item => <li key={item}>{item}</li>)}
            </ul>
        </section>}

        <section className="module-panel">
            <h2>Arbeitsauftrag</h2>
            <ol className="scenario-list">
                {tasks.map(task => <li key={task}>{task}</li>)}
            </ol>
        </section>

        {teacherChecks.length > 0 && <section className="module-panel">
            <h2>Worauf die Lehrkraft achten kann</h2>
            <ul className="scenario-list">
                {teacherChecks.map(check => <li key={check}>{check}</li>)}
            </ul>
        </section>}

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

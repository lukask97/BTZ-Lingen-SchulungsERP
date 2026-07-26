import { Link } from "react-router-dom";
import OverviewCards from "./OverviewCards";

export default function PlaceholderModule({ title, intro, cards = [], nextSteps = [], links = [] }) {
    return <>
        <h1>{title}</h1>
        <p>{intro}</p>
        {cards.length > 0 && <OverviewCards cards={cards}/>}
        {nextSteps.length > 0 && <section className="module-panel">
            <h2>Geplante Lernfunktionen</h2>
            <ul className="module-list">
                {nextSteps.map(step => <li key={step}>{step}</li>)}
            </ul>
        </section>}
        {links.length > 0 && <section className="module-panel">
            <h2>Direkte Einstiege</h2>
            <div className="link-list">
                {links.map(link => <Link key={link.to} className="button-link" to={link.to}>{link.label}</Link>)}
            </div>
        </section>}
    </>;
}

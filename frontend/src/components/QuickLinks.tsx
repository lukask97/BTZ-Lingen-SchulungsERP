import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { DashboardLink } from "./DashboardPanel";

interface QuickLinksProps {
    title?: ReactNode;
    links: DashboardLink[];
}

export default function QuickLinks({ title = "Direkte Einstiege", links }: QuickLinksProps) {
    if (links.length === 0) return null;

    return <section className="module-panel quick-links-panel">
        <h2>{title}</h2>
        <div className="link-list">
            {links.map(link => <Link key={link.to} className="button-link" to={link.to}>{link.label}</Link>)}
        </div>
    </section>;
}

import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface DashboardLink {
    to: string;
    label: ReactNode;
}

interface DashboardPanelProps {
    title: ReactNode;
    badge?: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    items?: ReactNode[];
    links?: DashboardLink[];
}

export default function DashboardPanel({ title, badge, description, children, items = [], links = [] }: DashboardPanelProps) {
    return <article className="dashboard-panel">
        <div className="dashboard-panel-header">
            <h2>{title}</h2>
            {badge && <span>{badge}</span>}
        </div>

        {description && <p className="dashboard-panel-description">{description}</p>}

        {items.length > 0 && <ul className="dashboard-note-list">
            {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>}

        {children}

        {links.length > 0 && <div className="link-list">
            {links.map(link => <Link key={link.to} className="button-link" to={link.to}>{link.label}</Link>)}
        </div>}
    </article>;
}

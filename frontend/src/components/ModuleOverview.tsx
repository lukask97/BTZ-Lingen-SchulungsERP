import type { ReactNode } from "react";
import DashboardPanel, { type DashboardLink } from "./DashboardPanel";
import DashboardPanelGrid from "./DashboardPanelGrid";
import OverviewCards, { type OverviewCard } from "./OverviewCards";
import PageIntro from "./PageIntro";
import QuickLinks from "./QuickLinks";

export interface ModuleOverviewPanel {
    title: ReactNode;
    badge?: ReactNode;
    description?: ReactNode;
    items?: ReactNode[];
    links?: DashboardLink[];
    children?: ReactNode;
}

interface ModuleOverviewProps {
    title: ReactNode;
    intro: ReactNode;
    cards?: OverviewCard[];
    panels?: ModuleOverviewPanel[];
    links?: DashboardLink[];
    children?: ReactNode;
}

export default function ModuleOverview({
    title,
    intro,
    cards = [],
    panels = [],
    links = [],
    children,
}: ModuleOverviewProps) {
    return <>
        <PageIntro title={title} intro={intro} />
        <OverviewCards cards={cards} />

        {panels.length > 0 && <DashboardPanelGrid>
            {panels.map((panel, index) => <DashboardPanel
                key={`${String(panel.title)}-${index}`}
                title={panel.title}
                badge={panel.badge}
                description={panel.description}
                items={panel.items}
                links={panel.links}
            >
                {panel.children}
            </DashboardPanel>)}
        </DashboardPanelGrid>}

        <QuickLinks links={links} />
        {children}
    </>;
}

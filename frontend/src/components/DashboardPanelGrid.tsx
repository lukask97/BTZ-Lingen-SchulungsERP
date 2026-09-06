import type { ReactNode } from "react";

interface DashboardPanelGridProps {
    children: ReactNode;
}

export default function DashboardPanelGrid({ children }: DashboardPanelGridProps) {
    return <section className="dashboard-two-column">{children}</section>;
}

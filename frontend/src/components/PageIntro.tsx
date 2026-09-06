import type { ReactNode } from "react";

interface PageIntroProps {
    title: ReactNode;
    intro?: ReactNode;
    actions?: ReactNode;
}

export default function PageIntro({ title, intro, actions }: PageIntroProps) {
    return <header className="page-intro">
        <div className="page-intro-copy">
            <h1>{title}</h1>
            {intro && <p>{intro}</p>}
        </div>
        {actions && <div className="page-intro-actions">{actions}</div>}
    </header>;
}

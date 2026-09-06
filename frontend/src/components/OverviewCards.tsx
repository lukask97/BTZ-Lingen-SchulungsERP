import type { ReactNode } from "react";

export interface OverviewCard {
    label: ReactNode;
    value: ReactNode;
    note?: ReactNode;
}

interface OverviewCardsProps {
    cards: OverviewCard[];
    className?: string;
}

export default function OverviewCards({ cards, className = "" }: OverviewCardsProps) {
    if (cards.length === 0) return null;

    return <div className={["kennzahlen", className].filter(Boolean).join(" ")}>
        {cards.map(card => <div className="kennzahl" key={String(card.label)}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            {card.note && <small>{card.note}</small>}
        </div>)}
    </div>;
}

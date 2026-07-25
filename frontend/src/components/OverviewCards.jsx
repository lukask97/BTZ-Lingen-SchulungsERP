export default function OverviewCards({ cards }) {
    return <div className="kennzahlen">
        {cards.map(card => <div className="kennzahl" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            {card.note && <small>{card.note}</small>}
        </div>)}
    </div>;
}

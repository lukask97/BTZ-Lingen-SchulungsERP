import { useState } from "react";
import DataTable from "../components/DataTable";
import bestellungenService from "../services/bestellungenService";
import { bucheWareneingang } from "../services/wareneingangService";
import OverviewCards from "../components/OverviewCards";

export default function Wareneingaenge() {
    const [bestellungen, setBestellungen] = useState(bestellungenService.getAll());
    const offeneBestellungen = bestellungen.filter(item => item.status === "offen");
    const offenePositionen = offeneBestellungen.reduce((summe, bestellung) => summe + bestellung.positionen.length, 0);

    const buchen = bestellung => {
        if (!confirm(`Wareneingang für ${bestellung.bestellNr} buchen? Der Artikelbestand wird erhöht.`)) return;
        bucheWareneingang(bestellung.id);
        setBestellungen(bestellungenService.getAll());
    };

    return <>
        <OverviewCards cards={[
            { label: "Offene Wareneingänge", value: offeneBestellungen.length },
            { label: "Offene Positionen", value: offenePositionen },
            { label: "Bereits gebucht", value: bestellungen.length - offeneBestellungen.length }
        ]}/>
        <DataTable
        title="Offene Wareneingänge"
        columns={[
            { field: "bestellNr", title: "Bestellnummer" },
            { field: "lieferant", title: "Lieferant" },
            { field: "datum", title: "Bestelldatum" },
            { field: "positionen", title: "Lieferung", render: row => row.positionen.map(position => `${position.artikel}: ${position.menge}`).join(", ") }
        ]}
        data={offeneBestellungen}
        selectableColumns={false}
        rowActions={[{ name: "book", label: "Wareneingang buchen", permission: "lager.buchen", onClick: buchen }]}
        />
    </>;
}

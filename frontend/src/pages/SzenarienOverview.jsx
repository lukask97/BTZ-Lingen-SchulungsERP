import PlaceholderModule from "../components/PlaceholderModule";

export default function SzenarienOverview() {
    return <PlaceholderModule
        title="Verkaufsszenarien"
        intro="Die Szenarien sind als Fallakten aufgebaut. Die Lehrkraft stellt einen Fall bereit und die Bearbeitung erfolgt in den zugehörigen Fachmodulen."
        cards={[
            { label: "Szenarien", value: 7 },
            { label: "Fokus", value: "Praxisfälle" },
            { label: "Bearbeitung", value: "Im System" }
        ]}
        nextSteps={["Fallakte lesen", "Passende Module öffnen", "Lösung dokumentieren", "Ergebnis in Tabellen prüfen"]}
        links={[
            { to: "/szenarien/regionale-bestellung", label: "Regionale Bestellung" },
            { to: "/szenarien/grossbestellung", label: "Großbestellung" },
            { to: "/szenarien/firmenauftrag", label: "Firmenauftrag" },
            { to: "/szenarien/eventbestellung", label: "Eventbestellung" },
            { to: "/szenarien/service", label: "Service" },
            { to: "/szenarien/transportverzoegerung", label: "Transportverzögerung" },
            { to: "/szenarien/kooperation", label: "Kooperation" }
        ]}
    />;
}

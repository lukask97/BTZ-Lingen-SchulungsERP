import { useEffect } from "react";
import AppRouter from "./router/AppRouter";

function DebugDelayBootstrap() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const url = new URL(window.location.href);
        const delayParam = url.searchParams.get("debugApiDelayMs");
        if (!delayParam) return;

        const parsedDelay = Number(delayParam);
        if (Number.isFinite(parsedDelay) && parsedDelay >= 0) {
            window.localStorage.setItem("debug-api-delay-ms", String(parsedDelay));
        } else {
            window.localStorage.removeItem("debug-api-delay-ms");
        }

        url.searchParams.delete("debugApiDelayMs");
        window.history.replaceState({}, document.title, url.toString());
    }, []);

    return null;
}

function App() {
    return <>
        <DebugDelayBootstrap/>
        <AppRouter/>
    </>;
}

export default App;

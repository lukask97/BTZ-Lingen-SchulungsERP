import { Navigate, useLocation } from "react-router-dom";


const mediaFiles = import.meta.glob(
    "./Bilder/*.{png,jpg,jpeg,gif,webp,svg,jfif}",
    {
        eager: true,
        query: "?url",
        import: "default"
    }
) as Record<string, string>;

function getRandomMedia(): string | null {
    const files = Object.values(mediaFiles);
    console.log(files);
    if (files.length == 0) {
        console.log("Länge:" + files.length);
        return null;
    }
    
    const randomIndex = Math.floor(Math.random() * files.length);
    console.log([randomIndex]);
    return files[randomIndex];
}


function normalizeLegacyFocusPath(pathname: string): string | null {
    const cleanPath = pathname.trim();
    if (!cleanPath || cleanPath === "/") {
        return null;
    }

    const match = cleanPath.match(/^\/?(.+)focus=(.+)$/);
    if (!match) {
        return null;
    }

    const [, routePart, focusValue] = match;
    const normalizedRoute = routePart.replace(/\/+$/, "");
    const safeRoute = normalizedRoute ? `/${normalizedRoute}` : "/";

    return `${safeRoute}?focus=${focusValue}`;
}

export default function LegacyLinkFallback() {
    const location = useLocation();
    const target = normalizeLegacyFocusPath(location.pathname);
    const randomMedia = getRandomMedia();


    if (target) {
        return <Navigate to={target} replace />;
    }

    

    return (
        <div style={{
            minHeight: "50vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2rem",
            gap: "0.75rem"
        }}>
            <h1>Es ist ein Fehler aufgetreten.</h1>
            <p>Diese Adresse ist fehlerhaft oder es ist ein Fehler aufgetreten</p>
        <hr
            style={{
                width: "90%",
                margin: "1rem 0",
                border: "none",
                borderTop: "3px solid black",
                fill: "black",
                opacity: 0.8
            }}
        />
            {randomMedia && (
                <img
                    src={randomMedia}
                    alt="Zufälliges Bild"
                    style={{
                        width: "75vw",
                        height: "80vh", 
                        objectFit: "contain"
                    }}
                />
            )}
        </div>
    );
}

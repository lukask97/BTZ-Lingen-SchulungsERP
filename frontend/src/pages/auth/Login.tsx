import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { SESSION_EXPIRED_MESSAGE_KEY } from "../../auth/AuthContext";
import { login as loginService } from "../../services/auth/authService";
import { BACKEND_ORIGIN } from "../../services/core/api";

const QUICK_LOGINS = [
    { label: "Admin", username: "admin", password: "admin" },
    { label: "Verkauf Azubi", username: "verkauf_azubi", password: "verkauf" },
    { label: "Verkauf Senior", username: "verkauf_senior", password: "verkauf" },
    { label: "Lager", username: "lager", password: "lager" },
    { label: "Einkauf", username: "einkauf", password: "einkauf" },
    { label: "Buchhaltung", username: "buchhaltung", password: "buchhaltung" },
    { label: "Marketing", username: "marketing", password: "marketing" },
    { label: "Personalwesen", username: "personalwesen", password: "personalwesen" },
    { label: "Geschäftsführung", username: "gf", password: "gf" }
];

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, authError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const authErrorMessage = authError.includes("Backend unter")
        ? authError
        : `${authError} Backend unter \`${BACKEND_ORIGIN}\` starten.`;

    useEffect(() => {
        const state = location.state as { sessionExpired?: boolean } | null;
        const storedMessage = sessionStorage.getItem(SESSION_EXPIRED_MESSAGE_KEY);
        if (!state?.sessionExpired && !storedMessage) {
            return;
        }

        const message = storedMessage || "Deine Sitzung ist aufgrund Inaktivität abgelaufen";
        setSessionExpiredMessage(message);
        sessionStorage.removeItem(SESSION_EXPIRED_MESSAGE_KEY);
        if (state?.sessionExpired) {
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, location.state, navigate]);

    async function anmelden(e) {
        e.preventDefault();
        if (isSubmitting) return;

        setError("");
        setSessionExpiredMessage("");
        setIsSubmitting(true);

        let user = null;

        try {
            user = await loginService(username, password);
        } catch (loginError) {
            setError(
                loginError instanceof Error
                    ? loginError.message
                    : "Anmeldung derzeit nicht möglich"
            );
            setPassword("");
            setIsSubmitting(false);
            return;
        }

        if (user) {
            login(user);
            navigate("/");
        } else {
            setError("Benutzername oder Passwort falsch");
            setPassword("");
            setIsSubmitting(false);
        }
    }

    function quickLogin(user) {
        setUsername(user.username);
        setPassword(user.password);
    }

    return (
        <div className="login">
            <h1>Anmeldung</h1>
            <form onSubmit={anmelden}>
                <input
                    name="username"
                    disabled={isSubmitting}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Benutzername"
                    autoFocus
                />
                <br />
                <br />
                <input
                    name="password"
                    disabled={isSubmitting}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passwort"
                />
                <br />
                {isSubmitting && (
                    <div className="login-status">
                        Anmeldung läuft, Daten werden geladen...
                    </div>
                )}
                {authError && (
                    <div className="login-error">
                        {authErrorMessage}
                    </div>
                )}
                {sessionExpiredMessage && (
                    <div className="login-error">
                        {sessionExpiredMessage}
                    </div>
                )}
                {error && <div className="login-error">{error}</div>}
                <br />
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Anmeldung läuft..." : "Anmelden"}
                </button>
            </form>
            <div className="quick-logins">
                <h1>Demo Nutzer:</h1>
                {QUICK_LOGINS.map((user) => (
                    <button
                        key={user.username}
                        onClick={() => quickLogin(user)}
                        disabled={isSubmitting}
                    >
                        {user.label}
                    </button>
                ))}
                <h2>Danach auf "Anmelden" klicken</h2>
            </div>
        </div>
    );
}

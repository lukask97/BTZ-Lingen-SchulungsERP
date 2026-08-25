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
    { label: "Geschaeftsfuehrung", username: "gf", password: "gf" }
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
        const state = location.state as { sessionExpired: boolean } | null;
        const storedMessage = sessionStorage.getItem(SESSION_EXPIRED_MESSAGE_KEY);
        if (!state?.sessionExpired && !storedMessage) {
            return;
        }

        const message = storedMessage || "Deine Sitzung ist aufgrund Inaktivitaet abgelaufen";
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
                    : "Anmeldung derzeit nicht moeglich"
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
            <section className="login-hero">
                <div className="login-copy">
                    <h1 className="title is-2">Schulungs-ERP</h1>
                    <p className="subtitle is-5">
                        Wilkommen auf der Login Seite für die Demo von dem Schulungs-ERP
                    </p>
                </div>
                <div className="login-card card">
                    <div className="card-content">
                        <p className="login-card-kicker">Anmeldung</p>
                        <h2 className="title is-4">Zugang waehlen</h2>
                        <form onSubmit={anmelden} className="login-form">
                            <div className="field">
                                <label className="label" htmlFor="login-username">Benutzername</label>
                                <div className="control">
                                    <input
                                        id="login-username"
                                        className="input"
                                        name="username"
                                        disabled={isSubmitting}
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Benutzername"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="field">
                                <label className="label" htmlFor="login-password">Passwort</label>
                                <div className="control">
                                    <input
                                        id="login-password"
                                        className="input"
                                        name="password"
                                        disabled={isSubmitting}
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Passwort"
                                    />
                                </div>
                            </div>
                            {isSubmitting && (
                                <div className="notification is-info is-light login-status">
                                    Anmeldung läuft, Daten werden geladen...
                                </div>
                            )}
                            {authError && (
                                <div className="notification is-danger is-light login-error">
                                    {authErrorMessage}
                                </div>
                            )}
                            {sessionExpiredMessage && (
                                <div className="notification is-warning is-light login-error">
                                    {sessionExpiredMessage}
                                </div>
                            )}
                            {error && <div className="notification is-danger is-light login-error">{error}</div>}
                            <button className="button is-primary is-fullwidth" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Anmeldung läuft..." : "Anmelden"}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
            <section className="quick-logins">
                <div className="quick-logins-header">
                    <p className="quick-logins-kicker">Demo-Rollen</p>
                    <h2 className="title is-4">Schnelleinstiege für Unterricht und Tests</h2>
                    <p>Rolle auswaehlen, Zugangsdaten uebernehmen und danach auf <strong>Anmelden</strong> klicken.</p>
                </div>
                <div className="quick-logins-grid">
                    {QUICK_LOGINS.map((user) => (
                        <button
                            className="button is-link is-light quick-login-button"
                            key={user.username}
                            onClick={() => quickLogin(user)}
                            disabled={isSubmitting}
                            type="button"
                        >
                            {user.label}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}

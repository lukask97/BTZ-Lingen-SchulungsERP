import { useState } from "react";
import { useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { login as loginService } from "../../services/auth/authService";
import { BACKEND_ORIGIN } from "../../services/core/api";

const QUICK_LOGINS = [
    { label: "Admin", username: "admin", password: "admin" },
    { label: "Verkauf", username: "verkauf", password: "verkauf" },
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, authError } = useAuth();
    const navigate = useNavigate();

    async function anmelden(e) {
        e.preventDefault();
        if (isSubmitting) return;

        setError("");
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
                    disabled={isSubmitting}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Benutzername"
                    autoFocus
                />
                <br />
                <br />
                <input
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
                        {authError} Backend unter `{BACKEND_ORIGIN}` starten.
                    </div>
                )}
                {error && <div className="login-error">{error}</div>}
                <br />
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Anmeldung läuft..." : "Anmelden"}
                </button>
            </form>
            <div className="quick-logins">
                <h2>Demo Nutzer:</h2>
                {QUICK_LOGINS.map((user) => (
                    <button
                        key={user.username}
                        onClick={() => quickLogin(user)}
                        disabled={isSubmitting}
                    >
                        {user.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

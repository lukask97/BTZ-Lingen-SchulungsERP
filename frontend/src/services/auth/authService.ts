import { apiRequest } from "../core/api";

export async function getCurrentBackendUser() {
    try {
        const result = await apiRequest("/auth/me");
        if (!result.authenticated) {
            return null;
        }

        return result.user || null;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Backend nicht erreichbar.");
    }
}

export async function login(username,password){
    try {
        const result = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });
        return result.user || null;
    } catch (error) {
        if (error instanceof Error && error.message === "Benutzername oder Passwort falsch.") {
            return null;
        }
        throw error;
    }
}

export async function logoutSession() {
    await apiRequest("/auth/logout", { method: "POST" });
}

export async function setActiveClass(klasseId) {
    const result = await apiRequest("/auth/active-class", {
        method: "POST",
        body: JSON.stringify({ klasseId })
    });
    return result.user || null;
}

import {users} from "../mockup/mockData.js";
import { apiRequest, isDatabaseModeEnabled } from "../core/api";

export async function getCurrentBackendUser() {
    if (!isDatabaseModeEnabled()) return null;

    try {
        const result = await apiRequest("/auth/me");
        if (!result?.authenticated) {
            return null;
        }

        return result.user || null;
    } catch {
        return null;
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

        if (isDatabaseModeEnabled()) {
            throw error;
        }
    }

    const user = users.find(
        u =>
            u.username === username &&
            u.password === password
    );


    if(!user)
        return null;


    return user;

}

export async function logoutPreviewSession() {
    if (!isDatabaseModeEnabled()) return;
    await apiRequest("/auth/logout", { method: "POST" });
}

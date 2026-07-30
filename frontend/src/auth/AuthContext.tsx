import { useEffect, useState } from "react";
import { AuthContext } from "./authStore";
import type { AuthProviderProps, AuthUser } from "../types/auth";
import { getCurrentBackendUser, logoutPreviewSession } from "../services/auth/authService";

const AUTH_STORAGE_KEY = "session-user";

function readInitialUser(): AuthUser | null {
    const rawUser = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawUser) return null;
    try {
        return JSON.parse(rawUser) as AuthUser;
    } catch {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
    }
}

export function AuthProvider({ children }: AuthProviderProps) {

    const [user, setUser] = useState<AuthUser | null>(readInitialUser);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function syncUserWithBackend() {
            const backendUser = await getCurrentBackendUser();
            if (!isMounted) return;

            setUser(backendUser);

            if (backendUser) {
                sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(backendUser));
            } else {
                sessionStorage.removeItem(AUTH_STORAGE_KEY);
            }

            setIsAuthReady(true);
        }

        syncUserWithBackend();

        return () => {
            isMounted = false;
        };
    }, []);


    function login(userData: AuthUser) {

        setUser(userData);
        setIsAuthReady(true);

        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));

    }


    async function logout() {

        setUser(null);
        setIsAuthReady(true);

        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        await logoutPreviewSession();

    }


    function hasPermission(permission: string) {

        if (!user || !user.permissions) return false;


        if (user.permissions.includes("*")) return true;


        return user.permissions.includes(permission);
    }


    function hasAccess(access: string) {

        if (!user || !user.permissions) return false;


        if (user.permissions.includes("*")) return true;


        return user.permissions.some(permission => permission === access || permission.startsWith(access + "."));
    }


    return (<AuthContext.Provider
        value={{
            user, isAuthReady, login, logout, hasPermission, hasAccess
        }}
    >
        {children}
    </AuthContext.Provider>);

}

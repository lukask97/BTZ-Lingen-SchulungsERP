import { useEffect, useState } from "react";
import { AuthContext } from "./authStore";
import type { AuthProviderProps, AuthUser } from "../types/auth";
import { getCurrentBackendUser, logoutSession } from "../services/auth/authService";
import { userHasAccess, userHasFullAccess, userHasPermission } from "./permissions";

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
    const [authError, setAuthError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function syncUserWithBackend() {
            try {
                const backendUser = await getCurrentBackendUser();
                if (!isMounted) return;

                setUser(backendUser);
                setAuthError("");

                if (backendUser) {
                    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(backendUser));
                } else {
                    sessionStorage.removeItem(AUTH_STORAGE_KEY);
                }
            } catch (error) {
                if (!isMounted) return;
                setUser(null);
                sessionStorage.removeItem(AUTH_STORAGE_KEY);
                setAuthError(
                    error instanceof Error
                         ? error.message
                        : "Backend nicht erreichbar."
                );
            } finally {
                if (isMounted) {
                    setIsAuthReady(true);
                }
            }
        }

        syncUserWithBackend();

        return () => {
            isMounted = false;
        };
    }, []);


    function login(userData: AuthUser) {

        setUser(userData);
        setIsAuthReady(true);
        setAuthError("");

        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));

    }


    async function logout() {

        setUser(null);
        setIsAuthReady(true);
        setAuthError("");

        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        await logoutSession();

    }


    function hasPermission(permission: string) {
        return userHasPermission(user, permission);
    }


    function hasAccess(access: string) {
        return userHasAccess(user, access);
    }


    function hasFullAccess() {
        return userHasFullAccess(user);
    }


    return (<AuthContext.Provider
        value={{
            user, isAuthReady, authError, login, logout, hasFullAccess, hasPermission, hasAccess
        }}
    >
        {children}
    </AuthContext.Provider>);

}

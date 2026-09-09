import { useEffect, useState } from "react";
import { AuthContext } from "./authStore";
import type { AuthProviderProps, AuthUser } from "../types/auth";
import { getCurrentBackendUser, logoutSession, setActiveClass } from "../services/auth/authService";
import { clearTableCache } from "../services/core/dataCache";
import { userHasAccess, userHasFullAccess, userHasPermission } from "./permissions";

const AUTH_STORAGE_KEY = "session-user";
export const SESSION_EXPIRED_MESSAGE_KEY = "session-expired-message";

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

    function persistUser(nextUser: AuthUser | null) {
        setUser(nextUser);
        if (nextUser) {
            sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
            sessionStorage.removeItem(SESSION_EXPIRED_MESSAGE_KEY);
        } else {
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
        }
    }

    useEffect(() => {
        let isMounted = true;

        async function syncUserWithBackend() {
            try {
                const backendUser = await getCurrentBackendUser();
                if (!isMounted) return;

                const hadStoredUser = Boolean(readInitialUser());
                persistUser(backendUser);
                setAuthError("");

                if (!backendUser && hadStoredUser) {
                    sessionStorage.setItem(SESSION_EXPIRED_MESSAGE_KEY, "Deine Sitzung ist aufgrund Inaktivitaet abgelaufen");
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

        persistUser(userData);
        setIsAuthReady(true);
        setAuthError("");

    }


    async function logout() {

        persistUser(null);
        setIsAuthReady(true);
        setAuthError("");
        await logoutSession();

    }


    async function refreshUser() {

        const backendUser = await getCurrentBackendUser();
        persistUser(backendUser);
        setIsAuthReady(true);
        setAuthError("");
        return backendUser;

    }


    async function switchActiveClass(classId: number | string) {

        const updatedUser = await setActiveClass(classId);
        clearTableCache();
        persistUser(updatedUser);
        window.location.reload();

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
            user, isAuthReady, authError, login, logout, refreshUser, switchActiveClass, hasFullAccess, hasPermission, hasAccess
        }}
    >
        {children}
    </AuthContext.Provider>);

}

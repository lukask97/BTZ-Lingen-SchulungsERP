import { useState } from "react";
import { AuthContext } from "./authStore";
import type { AuthProviderProps, AuthUser } from "../types/auth";


function readInitialUser(): AuthUser | null {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;
    try {
        return JSON.parse(rawUser) as AuthUser;
    } catch {
        localStorage.removeItem("user");
        return null;
    }
}

export function AuthProvider({ children }: AuthProviderProps) {

    const [user, setUser] = useState<AuthUser | null>(readInitialUser);


    function login(userData: AuthUser) {

        setUser(userData);

        localStorage.setItem("user", JSON.stringify(userData));

    }


    function logout() {

        setUser(null);

        localStorage.removeItem("user");

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
            user, login, logout, hasPermission, hasAccess
        }}
    >
        {children}
    </AuthContext.Provider>);

}

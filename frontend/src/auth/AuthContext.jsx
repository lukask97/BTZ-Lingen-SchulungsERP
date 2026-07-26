import { useState } from "react";
import { AuthContext } from "./authStore";


export function AuthProvider({children}) {

    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);


    function login(userData) {

        setUser(userData);

        localStorage.setItem("user", JSON.stringify(userData));

    }


    function logout() {

        setUser(null);

        localStorage.removeItem("user");

    }


    function hasPermission(permission) {

        if (!user || !user.permissions) return false;


        if (user.permissions.includes("*")) return true;


        return user.permissions.includes(permission);
    }


    function hasAccess(access) {

        if (!user || !user.permissions) return false;


        if (user.permissions.includes("*")) return true;


        return user.permissions.some(p => p === access || p.startsWith(access + "."));
    }


    return (<AuthContext.Provider
        value={{
            user, login, logout, hasPermission, hasAccess
        }}
    >
        {children}
    </AuthContext.Provider>);

}

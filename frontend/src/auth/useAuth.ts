import { useContext } from "react";
import { AuthContext } from "./authStore";
import type { AuthContextValue } from "../types/auth";

export default function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider.");
    }
    return context;
}

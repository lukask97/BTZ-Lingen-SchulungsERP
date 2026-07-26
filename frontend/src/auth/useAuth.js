import { useContext } from "react";
import { AuthContext } from "./authStore";

export default function useAuth() {
    return useContext(AuthContext);
}

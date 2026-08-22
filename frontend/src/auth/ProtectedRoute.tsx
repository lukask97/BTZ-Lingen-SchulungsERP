import { Navigate } from "react-router-dom";
import useAuth from "./useAuth";
import AccessDenied from "../components/AccessDenied";
import type { ProtectedRouteProps } from "../types/auth";
import { SESSION_EXPIRED_MESSAGE_KEY } from "./AuthContext";


export default function ProtectedRoute({
    children,
    access
}: ProtectedRouteProps) {

    const { user, isAuthReady, hasAccess } = useAuth();


    if (!isAuthReady) {
        return null;
    }


    if (!user) {
        const sessionExpiredMessage = sessionStorage.getItem(SESSION_EXPIRED_MESSAGE_KEY);
        return <Navigate to="/login" replace state={sessionExpiredMessage ? { sessionExpired: true } : undefined}/>;
    }


    if (access && !hasAccess(access)) {
        return <AccessDenied/>;
    }


    return children;

}

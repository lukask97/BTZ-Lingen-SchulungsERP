import { Navigate } from "react-router-dom";
import useAuth from "./useAuth";
import AccessDenied from "../components/AccessDenied";
import type { ProtectedRouteProps } from "../types/auth";


export default function ProtectedRoute({
    children,
    access
}: ProtectedRouteProps) {

    const { user, hasAccess } = useAuth();


    if (!user) {
        return <Navigate to="/login"/>;
    }


    if (access && !hasAccess(access)) {
        return <AccessDenied/>;
    }


    return children;

}

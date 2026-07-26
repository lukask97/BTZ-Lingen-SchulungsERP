import useAuth from "./useAuth";
import type { CanProps } from "../types/auth";


export default function Can({
    access, permission, children
}: CanProps) {

    const {
        hasAccess, hasPermission
    } = useAuth();


    if (access && !hasAccess(access)) return null;


    if (permission && !hasPermission(permission)) return null;


    return children;

}

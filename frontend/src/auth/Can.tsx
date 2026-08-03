import useAuth from "./useAuth";
import { userCanAccess } from "./permissions";
import type { CanProps } from "../types/auth";


export default function Can({
    access, permission, children
}: CanProps) {

    const { user } = useAuth();


    if (!userCanAccess(user, { access, permission })) return null;


    return children;

}

import useAuth from "./AuthContext";


export default function Can({
                                access, permission, children
                            }) {

    const {
        hasAccess, hasPermission
    } = useAuth();


    if (access && !hasAccess(access)) return null;


    if (permission && !hasPermission(permission)) return null;


    return children;

}
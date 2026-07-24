import useAuth from "./useAuth";


export function Can({permission, children}) {

    const {
        user
    }
        =
        useAuth();

    if (
        user.permissions.includes(permission)
    ) {
        return children;
    }

    return null;
}
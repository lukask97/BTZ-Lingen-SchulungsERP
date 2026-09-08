import type { AccessKey, AuthUser, PermissionKey } from "../types/auth";

export const FULL_ACCESS_PERMISSION = "*";

export function userHasFullAccess(user: AuthUser | null) {
    return Boolean(user?.permissions?.includes(FULL_ACCESS_PERMISSION));
}

export function userHasPermission(user: AuthUser | null, permission?: PermissionKey) {
    if (!permission) return true;
    if (!user.permissions) return false;
    if (userHasFullAccess(user)) return true;

    return user.permissions.includes(permission);
}

export function userHasAccess(user: AuthUser | null, access?: AccessKey) {
    if (!access) return true;
    if (!user.permissions) return false;
    if (userHasFullAccess(user)) return true;

    if (Array.isArray(access)) {
        return access.some(entry => userHasAccess(user, entry));
    }

    return user.permissions.some(permission => permission === access || permission.startsWith(`${access}.`));
}

export function userCanAccess(user: AuthUser | null, options: { access?: AccessKey; permission?: PermissionKey }) {
    return userHasAccess(user, options.access) && userHasPermission(user, options.permission);
}

import type { ReactNode } from "react";

export type PermissionKey = string;

export interface AuthUser {
    id?: number | string | null;
    username?: string;
    name?: string;
    rolle?: string;
    permissions?: PermissionKey[];
    [key: string]: unknown;
}

export interface AuthContextValue {
    user: AuthUser | null;
    login: (userData: AuthUser) => void;
    logout: () => void;
    hasPermission: (permission: PermissionKey) => boolean;
    hasAccess: (access: string) => boolean;
}

export interface AuthProviderProps {
    children: ReactNode;
}

export interface ProtectedRouteProps {
    children: ReactNode;
    access?: string;
}

export interface CanProps {
    children: ReactNode;
    access?: string;
    permission?: PermissionKey;
}

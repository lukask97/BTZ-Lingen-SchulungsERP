import type { ReactNode } from "react";

export type PermissionKey = string;
export type AccessKey = string | string[];

export interface AuthUser {
    id: number | string | null;
    username: string;
    name: string;
    rolle: string;
    permissions: PermissionKey[];
    [key: string]: unknown;
}

export interface AuthClass {
    id: number | string;
    name: string;
    datenbankName: string;
    status?: string;
    beschreibung?: string;
}

export interface AuthContextValue {
    user: AuthUser | null;
    isAuthReady: boolean;
    authError: string;
    login: (userData: AuthUser) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<AuthUser | null>;
    switchActiveClass: (classId: number | string) => Promise<void>;
    hasFullAccess: () => boolean;
    hasPermission: (permission: PermissionKey) => boolean;
    hasAccess: (access: AccessKey) => boolean;
}

export interface AuthProviderProps {
    children: ReactNode;
}

export interface ProtectedRouteProps {
    children: ReactNode;
    access?: AccessKey;
}

export interface CanProps {
    children: ReactNode;
    access?: AccessKey;
    permission?: PermissionKey;
}

export interface PermissionButtonProps {
    children: ReactNode;
    permission?: PermissionKey;
    access?: AccessKey;
    onClick: (...args: any[]) => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
    deniedTitle?: string;
}

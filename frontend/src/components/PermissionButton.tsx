import useAuth from "../auth/useAuth";
import { userCanAccess } from "../auth/permissions";
import type { PermissionButtonProps } from "../types/auth";

export default function PermissionButton({
    permission,
    access,
    children,
    onClick,
    disabled = false,
    variant = "primary",
    className = "",
    deniedTitle = "Keine Berechtigung"
}: PermissionButtonProps) {
    const { user } = useAuth();
    const isAuthorized = userCanAccess(user, { access, permission });
    const isDisabled = disabled || !isAuthorized;
    const variantClassMap = {
        primary: "is-primary",
        secondary: "is-link is-light",
        success: "is-success",
        warning: "is-warning",
        danger: "is-danger"
    };
    const variantClass = variantClassMap[variant] || variantClassMap.primary;

    return (
        <button
            type="button"
            className={`button erp-button ${variantClass} ${className}`.trim()}
            disabled={isDisabled}
            title={isDisabled && !disabled ? deniedTitle : undefined}
            aria-disabled={isDisabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

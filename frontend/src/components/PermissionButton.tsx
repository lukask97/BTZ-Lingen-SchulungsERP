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

    return (
        <button
            type="button"
            className={`button-${variant} ${className}`.trim()}
            disabled={isDisabled}
            title={isDisabled && !disabled ? deniedTitle : undefined}
            aria-disabled={isDisabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

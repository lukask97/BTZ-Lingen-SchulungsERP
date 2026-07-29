import useAuth from "../auth/useAuth";


export default function PermissionButton({
                                             permission,
                                             children,
                                             onClick,
                                             disabled = false,
                                             variant = "primary",
                                             className = ""
                                         }) {

    const {hasPermission} = useAuth();
    return (
        <button
            type="button"
            className={`button-${variant} ${className}`.trim()}
            disabled={disabled || (permission ? !hasPermission(permission) : false)}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

import useAuth from "../auth/AuthContext";


export default function PermissionButton({
                                             permission,
                                             children,
                                             onClick,
                                             disabled = false
                                         }) {

    const {hasPermission} = useAuth();
    return (
        <button
            disabled={disabled || !hasPermission(permission)}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
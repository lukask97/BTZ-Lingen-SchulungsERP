export default function Label({
    children,
    required = false
}) {

    return (
        <label className="form-label">

            {children}

            {required && (
                <span className="required">
                    *
                </span>
            )}

        </label>
    );

}
import { useId } from "react";

export default function Checkbox({
    id,
    name,
    children,
    checked = false,
    onChange,
    disabled = false
}) {
    const generatedId = useId();
    const fieldId = id || `checkbox-${generatedId}`;
    const fieldName = name || fieldId;

    return (
        <label className="checkbox">

            <input
                id={fieldId}
                name={fieldName}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={e => onChange && onChange(e.target.checked)}
            />

            <span>{children}</span>

        </label>
    );

}

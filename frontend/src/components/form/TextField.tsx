import { useId } from "react";
import type { TextFieldProps } from "../../types/ui";

export default function TextField({
    id,
    name,
    value = "",
    onChange,
    type = "text",
    placeholder = "",
    disabled = false,
    required = false,
    maxLength,
    autoFocus = false
}: TextFieldProps) {
    const generatedId = useId();
    const fieldId = id || `text-field-${generatedId}`;
    const fieldName = name || fieldId;

    return (
        <input
            id={fieldId}
            name={fieldName}
            type={type}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            autoFocus={autoFocus}
            onChange={e => onChange && onChange(e.target.value)}
        />
    );

}

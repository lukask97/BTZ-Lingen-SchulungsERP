import type { TextFieldProps } from "../../types/ui";

export default function TextField({
    value = "",
    onChange,
    type = "text",
    placeholder = "",
    disabled = false,
    required = false,
    maxLength,
    autoFocus = false
}: TextFieldProps) {

    return (
        <input
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

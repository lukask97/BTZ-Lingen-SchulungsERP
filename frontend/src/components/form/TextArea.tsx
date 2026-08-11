import { useId } from "react";
import type { TextAreaProps } from "../../types/ui";

export default function TextArea({
    id,
    name,
    value,
    onChange,
    rows = 4,
    placeholder = "",
    onKeyDown
}: TextAreaProps) {
    const generatedId = useId();
    const fieldId = id || `textarea-${generatedId}`;
    const fieldName = name || fieldId;

    return (
        <textarea
            id={fieldId}
            name={fieldName}
            className="form-textarea"
            rows={rows}
            value={value}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            onKeyDown={onKeyDown}
        />
    );

}

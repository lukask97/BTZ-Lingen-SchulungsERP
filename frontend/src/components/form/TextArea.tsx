import type { TextAreaProps } from "../../types/ui";

export default function TextArea({
    value,
    onChange,
    rows = 4,
    placeholder = ""
}: TextAreaProps) {

    return (
        <textarea
            rows={rows}
            value={value}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
        />
    );

}

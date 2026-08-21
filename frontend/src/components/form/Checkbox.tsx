import { useId } from "react";

type CheckboxProps = {
    id?: string;
    name?: string;
    children: any;
    checked?: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
};

export default function Checkbox({
    id,
    name,
    children,
    checked = false,
    onChange,
    disabled = false
}: CheckboxProps) {
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

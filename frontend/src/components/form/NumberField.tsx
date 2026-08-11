import { useEffect, useId, useState } from "react";
import type { NumberFieldProps } from "../../types/ui";

export default function NumberField({
    id,
    name,
    value = "",
    onChange,
    onBlur,
    type = "number",
    format,
    min,
    max,
    step,
    placeholder = "",
    disabled = false
}: NumberFieldProps) {
    const generatedId = useId();
    const fieldId = id || `number-field-${generatedId}`;
    const fieldName = name || fieldId;

    const config = {
        number: {
            inputType: "number"
        },
        date: {
            inputType: "date"
        },
        time: {
            inputType: "time"
        },
        "datetime-local": {
            inputType: "datetime-local"
        },
        month: {
            inputType: "month"
        },
        week: {
            inputType: "week"
        }
    };

    const field = config[type] || config.number;
    const normalizedValue = String(value ?? "");
    const [draftValue, setDraftValue] = useState(normalizedValue);
    const [isFocused, setIsFocused] = useState(false);

    let suffix = "";

    switch (format) {
        case "currency":
            suffix = "€";
            break;

        case "percent":
            suffix = "%";
            break;

        default:
            suffix = "";
    }

    useEffect(() => {
        if (!isFocused) {
            setDraftValue(normalizedValue);
        }
    }, [isFocused, normalizedValue]);

    return (
        <div className={`number-field${suffix ? " number-field-has-suffix" : ""}`}>

            <input
                id={fieldId}
                name={fieldName}
                type={field.inputType}
                value={draftValue}
                min={min}
                max={max}
                step={step}
                placeholder={placeholder}
                disabled={disabled}
                onChange={e => {
                    setDraftValue(e.target.value);
                    onChange && onChange(e.target.value);
                }}
                onFocus={() => setIsFocused(true)}
                onWheel={event => {
                    if (field.inputType !== "number") return;
                    event.currentTarget.blur();
                }}
                onBlur={() => {
                    setIsFocused(false);
                    onBlur && onBlur();
                }}
            />

            {suffix && (
                <span className="number-field-suffix">
                    {suffix}
                </span>
            )}

        </div>
    );

}

import type { NumberFieldProps } from "../../types/ui";

export default function NumberField({
    value = "",
    onChange,
    type = "number",
    format,
    min,
    max,
    step,
    placeholder = "",
    disabled = false
}: NumberFieldProps) {

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

    return (
        <div className="number-field">

            <input
                type={field.inputType}
                value={value}
                min={min}
                max={max}
                step={step}
                placeholder={placeholder}
                disabled={disabled}
                onChange={e => onChange && onChange(e.target.value)}
            />

            {suffix && (
                <span className="number-field-suffix">
                    {suffix}
                </span>
            )}

        </div>
    );

}

import { useEffect, useMemo, useState } from "react";
import type { LookupFieldProps, LookupOption } from "../../types/ui";

export default function LookupField({
    value = "",
    options = [],
    onChange,
    onCreate,
    onEdit,
    placeholder = "Bitte auswählen...",
    disabled = false,
    required = false
}: LookupFieldProps) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);

    const selectedOption = options.find(option => String(option.value) === String(value));

    useEffect(() => {
        setQuery(selectedOption?.label || "");
    }, [selectedOption?.label]);

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const selectedLabel = selectedOption?.label?.trim().toLowerCase() || "";
        if (!normalizedQuery || normalizedQuery === selectedLabel) return options;
        return options.filter(option => option.label.toLowerCase().includes(normalizedQuery));
    }, [options, query, selectedOption?.label]);

    const selectOption = (option: LookupOption) => {
        setQuery(option.label);
        setOpen(false);
        if (onChange) onChange(String(option.value));
    };

    return <div className="lookup-field">
        <div className="lookup-input-wrapper">
            <input
                value={query}
                disabled={disabled}
                required={required}
                placeholder={placeholder}
                onFocus={() => setOpen(true)}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                    if (!event.target.value && onChange) onChange("");
                }}
            />
            {open && !disabled && <div className="lookup-dropdown">
                {filteredOptions.length === 0 ? <div className="lookup-empty">Keine Treffer</div> :
                    filteredOptions.map(option => <button
                        key={option.value}
                        type="button"
                        className="lookup-option"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectOption(option)}
                    >
                        {option.label}
                    </button>)}
            </div>}
        </div>

        {onCreate && <button
            type="button"
            onClick={onCreate}
            title="Neu anlegen"
        >
            +
        </button>}

        {onEdit && <button
            type="button"
            disabled={!value}
            onClick={() => onEdit(value)}
            title="Bearbeiten"
        >
            ✎
        </button>}
    </div>;
}

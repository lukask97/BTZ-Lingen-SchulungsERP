import { useState } from "react";

type MultiStatusFilterOption = {
    value: string,
    label: string
};

type MultiStatusFilterProps = {
    options: MultiStatusFilterOption[],
    selectedValues: string[],
    onToggle: (value: string) => void
};

export default function MultiStatusFilter({ options, selectedValues, onToggle }: MultiStatusFilterProps) {
    const [open, setOpen] = useState(false);
    const safeSelectedValues = selectedValues || [];
    const activeCount = safeSelectedValues.length;

    return (
        <div className="multi-filter">
            <button type="button" className="multi-filter-trigger" onClick={() => setOpen(current => !current)}>
                Statusfilter ({activeCount})
            </button>
            {open && <div className="multi-filter-menu">
                <strong>Status anzeigen</strong>
                {options.map(option => <label key={option.value} className="multi-filter-option">
                    <input
                        type="checkbox"
                        checked={safeSelectedValues.includes(option.value)}
                        onChange={() => onToggle(option.value)}
                    />
                    <span>{option.label}</span>
                </label>)}
            </div>}
        </div>
    );
}

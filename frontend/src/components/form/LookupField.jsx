export default function LookupField({
                                        value = "",
                                        options = [],
                                        onChange,
                                        onCreate,
                                        onEdit,
                                        placeholder = "Bitte auswählen...",
                                        disabled = false,
                                        required = false

                                    }) {

    return (<div className="lookup-field">

            <select
                value={value}
                disabled={disabled}
                required={required}
                onChange={e => onChange && onChange(e.target.value)}
            >
                <option value="">
                    {placeholder}
                </option>

                {options.map(option => (<option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>))}
            </select>

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

        </div>);

}
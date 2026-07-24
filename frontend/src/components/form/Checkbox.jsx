export default function Checkbox({
    children,
    checked = false,
    onChange,
    disabled = false
}) {

    return (
        <label className="checkbox">

            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={e => onChange && onChange(e.target.checked)}
            />

            <span>{children}</span>

        </label>
    );

}
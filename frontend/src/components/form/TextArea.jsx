export default function TextArea({
    value,
    onChange,
    rows = 4
}) {

    return (
        <textarea
            rows={rows}
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    );

}
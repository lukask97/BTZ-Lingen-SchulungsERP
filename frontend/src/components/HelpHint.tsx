import { useEffect, useRef, useState } from "react";

export default function HelpHint({
    text,
    delay = 1000
}) {
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef(null);

    const clearExistingTimeout = () => {
        if (!timeoutRef.current) return;
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    };

    const handleOpen = () => {
        clearExistingTimeout();
        timeoutRef.current = setTimeout(() => {
            setOpen(true);
            timeoutRef.current = null;
        }, delay);
    };

    const handleClose = () => {
        clearExistingTimeout();
        setOpen(false);
    };

    useEffect(() => () => clearExistingTimeout(), []);

    return (
        <span
            className="help-hint"
            onMouseEnter={handleOpen}
            onMouseLeave={handleClose}
            onFocus={handleOpen}
            onBlur={handleClose}
            tabIndex={0}
            role="button"
            aria-label="Hilfe anzeigen"
        >
            
            {open && <span className="help-hint-tooltip">{text}</span>}
        </span>
    );
}

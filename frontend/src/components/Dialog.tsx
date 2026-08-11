import { useEffect } from "react";
import type { DialogProps } from "../types/ui";

export default function Dialog({
    open,
    title,
    children,
    onClose,
    footer
}: DialogProps) {

    useEffect(() => {
        if (!open) return;

        function keyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }

        document.addEventListener("keydown", keyDown);
        return () => document.removeEventListener("keydown", keyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div
                className="dialog"
                onClick={e => e.stopPropagation()}
            >
                <div className="dialog-header">
                    <h2>{title}</h2>
                    <button
                        type="button"
                        aria-label="Dialog schliessen"
                        className="dialog-close"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        ×
                    </button>
                </div>

                <div className="dialog-body">
                    {children}
                </div>

                <div className="dialog-footer">
                    <button
                        type="button"
                        className="dialog-cancel"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        Abbrechen
                    </button>
                    {footer && (
                        <div className="dialog-footer-extra">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

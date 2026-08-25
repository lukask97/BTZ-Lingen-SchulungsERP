import { useEffect } from "react";
import type { DialogProps } from "../types/ui";

export default function Dialog({
    open,
    title,
    children,
    onClose,
    footer,
    bodyClassName = "",
    contentClassName = "",
    showCancelButton = true,
    cancelLabel = "Abbrechen"
}: DialogProps) {
    useEffect(() => {
        if (!open) return;

        function keyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", keyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", keyDown);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div
                className={`dialog erp-dialog card ${contentClassName}`.trim()}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
                tabIndex={-1}
            >
                <div className="dialog-header">
                    <div className="dialog-title-group">
                        <p className="dialog-eyebrow">Dialog</p>
                        <h2 className="dialog-title" id="dialog-title">{title}</h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Dialog schliessen"
                        className="dialog-close button is-light is-rounded"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        <span aria-hidden="true">Schliessen</span>
                    </button>
                </div>

                <div className={`dialog-body ${bodyClassName}`.trim()}>
                    {children}
                </div>

                {(footer || showCancelButton) && <div className="dialog-footer">
                    {footer && (
                        <div className="dialog-footer-extra">
                            {footer}
                        </div>
                    )}
                    {showCancelButton && <button
                        type="button"
                        className="dialog-cancel button is-light"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        {cancelLabel}
                    </button>
                    }
                </div>}
            </div>
        </div>
    );
}

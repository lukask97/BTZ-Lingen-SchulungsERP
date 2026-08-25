import { useEffect, useRef, useState } from "react";

type SaveButtonProps = {
    onSave: () => unknown | Promise<unknown>;
    onSuccess: () => void;
    children: string;
    className: string;
    type: "button" | "submit" | "reset";
    disabled: boolean;
    savingLabel: string;
    successLabel: string;
    errorLabel: string;
    successCloseDelayMs: number;
    minSavingDurationMs: number;
};

type SaveState = "idle" | "saving" | "success" | "error";

function getDebugSaveDelayMs() {
    if (typeof window === "undefined") return 0;

    const rawValue = window.localStorage.getItem("debug-save-delay-ms")
        || window.localStorage.getItem("debug-api-delay-ms");
    if (!rawValue) return 0;

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;

    return parsed;
}

function wait(ms: number) {
    return new Promise(resolve => {
        window.setTimeout(resolve, ms);
    });
}

function waitForPaint() {
    return new Promise(resolve => {
        window.requestAnimationFrame(() => resolve(undefined));
    });
}

export default function SaveButton({
    onSave,
    onSuccess,
    children = "Speichern",
    className = "",
    type = "button",
    disabled = false,
    savingLabel = "Warten...",
    successLabel = "Erfolgreich",
    errorLabel = "Nicht erfolgreich",
    successCloseDelayMs = 2000,
    minSavingDurationMs = 450
}: SaveButtonProps) {
    const [state, setState] = useState<SaveState>("idle");
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => () => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }
    }, []);

    const resetLater = (nextState: SaveState, callback: () => void) => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
            if (callback) {
                callback();
            }
            if (nextState !== "saving") {
                setState("idle");
            }
        }, nextState === "success" ? successCloseDelayMs : 2200);
    };

    const handleClick = async () => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }

        const startedAt = Date.now();
        setState("saving");

        try {
            // Erst den Saving-State rendern, bevor ein synchroner Speichervorgang den UI-Thread blockiert.
            await waitForPaint();

            const debugDelayMs = getDebugSaveDelayMs();
            if (debugDelayMs > 0) {
                await wait(debugDelayMs);
            }

            const result = await Promise.resolve(onSave());
            const elapsed = Date.now() - startedAt;
            if (elapsed < minSavingDurationMs) {
                await wait(minSavingDurationMs - elapsed);
            }
            if (result === false) {
                console.log("Nicht erfolgreich");
                setState("error");
                resetLater("error");
                return;
            }

            setState("success");
            resetLater("success", onSuccess);
        } catch {
            console.log("Nicht erfolgreich");
            const elapsed = Date.now() - startedAt;
            if (elapsed < minSavingDurationMs) {
                await wait(minSavingDurationMs - elapsed);
            }
            setState("error");
            resetLater("error");
        }
    };

    const label = state === "saving"
        ? savingLabel
        : state === "success"
            ? successLabel
            : state === "error"
                ? errorLabel
                : children;

    return <button
        type={type}
        className={`${className}${state !== "idle" ? ` save-button is-${state}` : " save-button"}`.trim()}
        onClick={handleClick}
        disabled={disabled || state === "saving"}
    >
        {state === "saving" && <span className="save-button-spinner" aria-hidden="true"></span>}
        <span>{label}</span>
    </button>;
}

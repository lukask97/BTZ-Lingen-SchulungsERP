import { loadData, saveData } from "../mockup/mockStorage";

const STORAGE_KEY = "fristenOptionen";

const DEFAULT_OPTIONS = {
    skontoTage: 7,
    skontoProzent: 2,
    zahlungszielTage: 14,
    zahlungserinnerungTage: 3,
    mahnung1AbTage: 1,
    mahnung2AbTage: 8,
    inkassoAbTage: 22
};

function toNonNegativeNumber(value: unknown, fallback: number) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) return fallback;
    return Math.floor(numericValue);
}

function toNonNegativeDecimal(value: unknown, fallback: number) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) return fallback;
    return Math.round(numericValue * 100) / 100;
}

function sanitizeOptions(value: any = {}) {
    const skontoTage = toNonNegativeNumber(value.skontoTage, DEFAULT_OPTIONS.skontoTage);
    const skontoProzent = toNonNegativeDecimal(value.skontoProzent, DEFAULT_OPTIONS.skontoProzent);
    const zahlungszielTage = Math.max(
        skontoTage,
        toNonNegativeNumber(value.zahlungszielTage, DEFAULT_OPTIONS.zahlungszielTage)
    );
    const zahlungserinnerungTage = toNonNegativeNumber(value.zahlungserinnerungTage, DEFAULT_OPTIONS.zahlungserinnerungTage);
    const mahnung1AbTage = toNonNegativeNumber(value.mahnung1AbTage, DEFAULT_OPTIONS.mahnung1AbTage);
    const mahnung2AbTage = Math.max(
        mahnung1AbTage + 1,
        toNonNegativeNumber(value.mahnung2AbTage, DEFAULT_OPTIONS.mahnung2AbTage)
    );
    const inkassoAbTage = Math.max(
        mahnung2AbTage + 1,
        toNonNegativeNumber(value.inkassoAbTage, DEFAULT_OPTIONS.inkassoAbTage)
    );

    return {
        skontoTage,
        skontoProzent,
        zahlungszielTage,
        zahlungserinnerungTage,
        mahnung1AbTage,
        mahnung2AbTage,
        inkassoAbTage
    };
}

const fristenOptionenService = {
    get() {
        return sanitizeOptions(loadData(STORAGE_KEY, DEFAULT_OPTIONS));
    },
    update(partial: any) {
        const nextValue = sanitizeOptions({
            ...this.get(),
            ...partial
        });
        saveData(STORAGE_KEY, nextValue);
        return nextValue;
    },
    reset() {
        saveData(STORAGE_KEY, DEFAULT_OPTIONS);
        return DEFAULT_OPTIONS;
    }
};

export default fristenOptionenService;

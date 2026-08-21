import optionenDefault from "../../constants/optionenDefault";
import { createCRUDService } from "../core/genericService";
import { fristenOptionen as initialFristenOptionen } from "../mockup/mockData";

const STORAGE_KEY = "fristenOptionen";

const DEFAULT_OPTIONS = optionenDefault.fristenOptionen;

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
    const angebotGfFreigabeAbweichungProzent = toNonNegativeDecimal(
        value.angebotGfFreigabeAbweichungProzent,
        DEFAULT_OPTIONS.angebotGfFreigabeAbweichungProzent
    );
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
        angebotGfFreigabeAbweichungProzent,
        zahlungszielTage,
        zahlungserinnerungTage,
        mahnung1AbTage,
        mahnung2AbTage,
        inkassoAbTage
    };
}

const baseService = createCRUDService(STORAGE_KEY, [
    ...(initialFristenOptionen || [])
]);

function getStoredOptions() {
    try {
        return baseService.getById(1) || baseService.list()[0] || baseService.create({
            ...(initialFristenOptionen?.[0] || { id: 1 })
        });
    } catch {
        try {
            return baseService.create({
                ...(initialFristenOptionen?.[0] || { id: 1 })
            });
        } catch {
            return {
                ...(initialFristenOptionen?.[0] || { id: 1 })
            };
        }
    }
}

const fristenOptionenService = {
    get() {
        return sanitizeOptions(getStoredOptions());
    },
    update(partial: any) {
        const nextValue = sanitizeOptions({
            ...this.get(),
            ...partial
        });
        return sanitizeOptions(baseService.update(1, {
            id: 1,
            ...nextValue
        }));
    },
    reset() {
        return sanitizeOptions(baseService.update(1, {
            id: 1,
            ...DEFAULT_OPTIONS
        }));
    }
};

export default fristenOptionenService;

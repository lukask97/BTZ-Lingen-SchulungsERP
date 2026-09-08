import optionenDefault from "../../constants/optionenDefault";
import { createCRUDService } from "../core/genericService";

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

function toTime(value: unknown, fallback: string) {
    const time = String(value || "");
    const match = time.match(/^(\d{2}):(\d{2})$/);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return fallback;
    return time;
}

function sanitizeOptions(value: any = {}) {
    const skontoTage = toNonNegativeNumber(value.skontoTage, DEFAULT_OPTIONS.skontoTage);
    const skontoProzent = toNonNegativeDecimal(value.skontoProzent, DEFAULT_OPTIONS.skontoProzent);
    const angebotGfFreigabeAbweichungProzent = toNonNegativeDecimal(
        value.angebotGfFreigabeAbweichungProzent,
        DEFAULT_OPTIONS.angebotGfFreigabeAbweichungProzent
    );
    const angeboteTagesabschlussAktiv = Boolean(
        value.angeboteTagesabschlussAktiv ?? DEFAULT_OPTIONS.angeboteTagesabschlussAktiv
    );
    const angeboteTagesabschlussUhrzeit = toTime(
        value.angeboteTagesabschlussUhrzeit,
        DEFAULT_OPTIONS.angeboteTagesabschlussUhrzeit
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
        angeboteTagesabschlussAktiv,
        angeboteTagesabschlussUhrzeit,
        zahlungszielTage,
        zahlungserinnerungTage,
        mahnung1AbTage,
        mahnung2AbTage,
        inkassoAbTage
    };
}

const baseService = createCRUDService(STORAGE_KEY, []);

function getStoredOptions() {
    try {
        return baseService.getById(1) || baseService.list()[0] || baseService.create({
            id: 1,
            ...DEFAULT_OPTIONS
        });
    } catch {
        try {
            return baseService.create({
                id: 1,
            ...DEFAULT_OPTIONS
            });
        } catch {
            return {
                id: 1,
            ...DEFAULT_OPTIONS
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



import optionenDefault from "../../constants/optionenDefault";
import { createCRUDService } from "../core/genericService";

const STORAGE_KEY = "lehrkraftOptionen";

const DEFAULT_PAYMENT_RULES = optionenDefault.lehrkraftOptionen.debitorenzahlungRegeln;

const DEFAULT_OPTIONS = optionenDefault.lehrkraftOptionen;

function toNonNegativeInteger(value: any, fallback: number) {
    const parsed = Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function sanitizePaymentRule(rule: any, index: number) {
    const startTag = toNonNegativeInteger(rule.startTag, 0);
    const endTagRaw = toNonNegativeInteger(rule.endTag, startTag);
    const endTag = endTagRaw < startTag ? startTag : endTagRaw;
    const gewichtung = Math.max(1, toNonNegativeInteger(rule.gewichtung, 1));

    return {
        id: String(rule.id || `regel-${index + 1}`),
        startTag,
        endTag,
        gewichtung
    };
}

function sanitizeOptions(value: any = {}) {
    return {
        autoLieferannahmeNach1Tag: Boolean(value.autoLieferannahmeNach1Tag),
        autoDebitorenzahlungNach1Tag: Boolean(value.autoDebitorenzahlungNach1Tag),
        debitorenzahlungRegeln: Array.isArray(value.debitorenzahlungRegeln) && value.debitorenzahlungRegeln.length > 0
            ? value.debitorenzahlungRegeln.map(sanitizePaymentRule)
            : DEFAULT_PAYMENT_RULES.map(sanitizePaymentRule)
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

const lehrkraftOptionenService = {
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

export default lehrkraftOptionenService;



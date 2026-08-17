import { createCRUDService } from "../core/genericService";

const STORAGE_KEY = "lehrkraftOptionen";

const DEFAULT_PAYMENT_RULES = [
    { id: "regel-1", startTag: 0, endTag: 0, gewichtung: 1 },
    { id: "regel-2", startTag: 3, endTag: 14, gewichtung: 35 },
    { id: "regel-3", startTag: 15, endTag: 28, gewichtung: 61 },
    { id: "regel-4", startTag: 29, endTag: 42, gewichtung: 2 },
    { id: "regel-5", startTag: 43, endTag: 56, gewichtung: 1 }
];

const DEFAULT_OPTIONS = {
    autoLieferannahmeNach1Tag: false,
    autoDebitorenzahlungNach1Tag: false,
    debitorenzahlungRegeln: DEFAULT_PAYMENT_RULES
};

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

const baseService = createCRUDService(STORAGE_KEY, [
    {
        id: 1,
        ...DEFAULT_OPTIONS
    }
]);

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

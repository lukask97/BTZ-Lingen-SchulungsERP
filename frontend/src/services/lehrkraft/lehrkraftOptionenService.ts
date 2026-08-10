import { loadData, saveData } from "../mockup/mockStorage";

const STORAGE_KEY = "lehrkraftOptionen";

const DEFAULT_OPTIONS = {
    autoLieferannahmeNach1Tag: false,
    autoDebitorenzahlungNach1Tag: false
};

function sanitizeOptions(value: any = {}) {
    return {
        autoLieferannahmeNach1Tag: Boolean(value.autoLieferannahmeNach1Tag),
        autoDebitorenzahlungNach1Tag: Boolean(value.autoDebitorenzahlungNach1Tag)
    };
}

const lehrkraftOptionenService = {
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

export default lehrkraftOptionenService;

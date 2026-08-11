const BERLIN_TIME_ZONE = "Europe/Berlin";

function getBerlinParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat("sv-SE", {
        timeZone: BERLIN_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    });

    return Object.fromEntries(
        formatter.formatToParts(date)
            .filter(part => part.type !== "literal")
            .map(part => [part.type, part.value])
    );
}

export function getBerlinTimestamp(date = new Date()) {
    const parts = getBerlinParts(date);
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

export function getBerlinDate(date = new Date()) {
    const parts = getBerlinParts(date);
    return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addDaysToIsoDate(dateValue: string, days: number) {
    const shiftedDate = new Date(`${dateValue}T12:00:00`);
    shiftedDate.setDate(shiftedDate.getDate() + days);
    return getBerlinDate(shiftedDate);
}

export function getRelativeBerlinDate(days: number, baseDate = getBerlinDate()) {
    return addDaysToIsoDate(baseDate, days);
}

export function formatTimestampForDisplay(value?: string) {
    if (!value) return "";
    return String(value).replace("T", " ").slice(0, 16);
}

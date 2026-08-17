export function getUserFullName(user: any = {}) {
    const vorname = String(user.vorname || "").trim();
    const nachname = String(user.nachname || "").trim();
    const fullName = [vorname, nachname].filter(Boolean).join(" ").trim();
    return fullName || String(user.name || user.username || "").trim();
}

export function getUserDisplayNameWithRole(user: any = {}, fallback = "Team") {
    const fullName = getUserFullName(user);
    const rolle = String(user.rolle || "").trim();

    if (fullName && rolle) return `${fullName} (${rolle})`;
    if (fullName) return fullName;
    if (rolle) return `Unbekannt (${rolle})`;
    return fallback;
}

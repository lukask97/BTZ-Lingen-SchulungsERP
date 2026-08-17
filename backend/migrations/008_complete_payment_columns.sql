alter table if exists buchhaltung.zahlungen
    add column if not exists ausfuehrungsdatum date,
    add column if not exists verwendungszweck text;

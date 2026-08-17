alter table if exists buchhaltung.zahlungen
    add column if not exists name text,
    add column if not exists iban text;

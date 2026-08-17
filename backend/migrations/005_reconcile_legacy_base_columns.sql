alter table if exists kunden.kunden
    add column if not exists iban text;

alter table if exists lieferanten.lieferanten
    add column if not exists iban text;

alter table if exists waren.artikel
    add column if not exists mindestmenge numeric(12,2) default 0;

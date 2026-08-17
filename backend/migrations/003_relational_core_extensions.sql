alter table if exists kunden.kunden
    add column if not exists abc text,
    add column if not exists optionen jsonb not null default '[]'::jsonb;

alter table if exists organisation.abteilungen
    add column if not exists aufgaben jsonb not null default '[]'::jsonb;

alter table if exists organisation.berichte
    add column if not exists startdatum date,
    add column if not exists enddatum date,
    add column if not exists intervall text,
    add column if not exists empfohlen_aktion text;

alter table if exists organisation.freigaben
    add column if not exists angebot_id bigint references verkauf.angebote(id) on delete set null;

alter table if exists lieferanten.lieferanten
    add column if not exists abc text;

alter table if exists waren.artikel
    add column if not exists kategorie_id bigint,
    add column if not exists kategorie_pfad text,
    add column if not exists bedarfsmeldung_bei numeric(12,2) default 0,
    add column if not exists komponenten jsonb not null default '[]'::jsonb;

alter table if exists waren.services
    add column if not exists berechnungstyp text,
    add column if not exists ze_einheit text;

alter table if exists verkauf.kundenanfragen
    add column if not exists beantwortet_am date,
    add column if not exists antwort text;

alter table if exists verkauf.angebote
    add column if not exists vorgang_id text,
    add column if not exists preispositionen jsonb not null default '[]'::jsonb;

alter table if exists verkauf.auftraege
    add column if not exists vorgang_id text,
    add column if not exists rabatt_betrag numeric(12,2) default 0,
    add column if not exists verguenstigungsgrund text,
    add column if not exists gesamtbetrag numeric(12,2) default 0;

alter table if exists einkauf.bestellungen
    add column if not exists anfrage_quelle text,
    add column if not exists bedarfsmeldung_id text,
    add column if not exists rechnung_status text,
    add column if not exists faellig_am date,
    add column if not exists anfrage_notiz text,
    add column if not exists versendet_am date,
    add column if not exists lehrkraft_angebot_am date,
    add column if not exists lehrkraft_angebot_preis numeric(12,2),
    add column if not exists lehrkraft_lieferzeit_tage integer,
    add column if not exists lehrkraft_angebot_text text;

alter table if exists verkauf.vertriebsdokumente
    add column if not exists angebot_id bigint references verkauf.angebote(id) on delete set null,
    add column if not exists anfrage_id bigint references verkauf.kundenanfragen(id) on delete set null,
    add column if not exists vorgang_id text,
    add column if not exists dokument_nr text,
    add column if not exists annahme_am date;

alter table if exists verkauf.nachrichten
    alter column zeitpunkt set default now();

alter table if exists buchhaltung.firmenkonto
    add column if not exists konto text;

alter table if exists buchhaltung.belege
    add column if not exists rechnung_id bigint;

alter table if exists personal.bewerber
    add column if not exists mitarbeiter_id bigint references personal.mitarbeiter(id) on delete set null;

alter table if exists verwaltung.rollen
    add column if not exists permissions jsonb not null default '[]'::jsonb;

alter table if exists verwaltung.benutzer
    add column if not exists vorname text,
    add column if not exists nachname text,
    add column if not exists password_plain text,
    add column if not exists rolle text,
    add column if not exists permissions jsonb not null default '[]'::jsonb;

alter table if exists verwaltung.benutzer
    alter column password_hash set default '';

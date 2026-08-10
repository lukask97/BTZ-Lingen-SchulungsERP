create table if not exists kunden (
    id bigserial primary key,
    kunden_nr text not null unique,
    firma text not null,
    anschrift text,
    plz text,
    ort text,
    segment text,
    iban text,
    website text,
    notiz text
);

create table if not exists lieferanten (
    id bigserial primary key,
    lieferanten_nr text not null unique,
    firma text not null,
    anschrift text,
    plz text,
    ort text,
    segment text,
    iban text,
    fuer_btz boolean default false,
    bewertung numeric(4,2),
    favorit boolean default false,
    notiz text
);

create table if not exists artikel (
    id bigserial primary key,
    artikel_nr text not null unique,
    name text not null,
    kategorie text,
    artikel_typ text not null,
    einkaufspreis numeric(12,2),
    verkaufspreis numeric(12,2),
    bestand numeric(12,2) default 0,
    mindestmenge numeric(12,2) default 0,
    bedarfsmeldung_bei numeric(12,2) default 0,
    beschreibung text,
    ist_verkaufbar boolean default true
);

create table if not exists services (
    id bigserial primary key,
    service_nr text not null unique,
    name text not null,
    kategorie text,
    einkaufspreis numeric(12,2),
    verkaufspreis numeric(12,2),
    beschreibung text
);

create table if not exists lager (
    id bigserial primary key,
    name text not null,
    standort text,
    kapazitaet numeric(12,2)
);

create table if not exists rollen (
    id bigserial primary key,
    name text not null unique,
    beschreibung text
);

create table if not exists rechte (
    id bigserial primary key,
    name text not null unique,
    beschreibung text
);

create table if not exists mitarbeiter (
    id bigserial primary key,
    name text not null,
    abteilung text,
    rolle text,
    eintritt date,
    status text
);

create table if not exists schulungen (
    id bigserial primary key,
    titel text not null,
    zielgruppe text,
    datum date,
    status text,
    ort text
);

create table if not exists benutzer (
    id bigserial primary key,
    username text not null unique,
    email text unique,
    password_hash text not null,
    rolle_id bigint references rollen(id) on delete set null,
    aktiv boolean default true
);

create table if not exists abteilungen (
    id bigserial primary key,
    kuerzel text not null unique,
    name text not null,
    zuordnung text
);

create table if not exists marketingaktionen (
    id bigserial primary key,
    typ text not null,
    titel text not null,
    datum date,
    status text,
    beschreibung text
);

create table if not exists freigaben (
    id bigserial primary key,
    titel text not null,
    bereich text,
    status text not null,
    verantwortung text,
    datum date,
    bezug text,
    notiz text
);

create table if not exists berichte (
    id bigserial primary key,
    titel text not null,
    bereich text,
    datum date,
    status text,
    zusammenfassung text,
    zielgruppe text,
    empfohlene_aktion text
);

create table if not exists bewerber (
    id bigserial primary key,
    name text not null,
    stelle text,
    datum date,
    status text not null,
    notiz text
);

create table if not exists firmenkonto (
    id bigserial primary key,
    datum date not null,
    betreff text not null,
    info text,
    soll numeric(12,2) default 0,
    haben numeric(12,2) default 0,
    saldo numeric(12,2) default 0
);

create table if not exists belege (
    id bigserial primary key,
    beleg_typ text not null,
    bezug_typ text,
    bezug_id bigint,
    datum date,
    status text,
    beschreibung text
);

create table if not exists lagerbestaende (
    id bigserial primary key,
    lager_id bigint not null references lager(id) on delete cascade,
    artikel_id bigint not null references artikel(id) on delete cascade,
    bestand numeric(12,2) not null default 0,
    unique (lager_id, artikel_id)
);

create table if not exists artikel_stueckliste (
    id bigserial primary key,
    hauptartikel_id bigint not null references artikel(id) on delete cascade,
    komponentenartikel_id bigint not null references artikel(id) on delete restrict,
    menge numeric(12,2) not null,
    unique (hauptartikel_id, komponentenartikel_id)
);

create table if not exists kundenanfragen (
    id bigserial primary key,
    vorgang_id text not null unique,
    typ text not null,
    kunde_id bigint not null references kunden(id) on delete restrict,
    kanal text,
    status text not null,
    datum date not null,
    anliegen text not null,
    angebot_id bigint,
    auftrag_id bigint
);

create table if not exists angebote (
    id bigserial primary key,
    vorgang_id text not null,
    angebots_nr text not null unique,
    angebots_basis_nr text not null,
    revision integer not null default 0,
    anfrage_id bigint references kundenanfragen(id) on delete set null,
    kunde_id bigint not null references kunden(id) on delete restrict,
    datum date not null,
    gueltig_bis date,
    status text not null,
    rabatt_betrag numeric(12,2) default 0,
    verguenstigungsgrund text,
    gesamtbetrag numeric(12,2) default 0
);

create table if not exists auftraege (
    id bigserial primary key,
    auftrag_nr text not null unique,
    kunde_id bigint not null references kunden(id) on delete restrict,
    anfrage_id bigint references kundenanfragen(id) on delete set null,
    angebot_id bigint references angebote(id) on delete set null,
    datum date not null,
    status text not null,
    faellig_am date,
    notiz text
);

alter table kundenanfragen
    drop constraint if exists kundenanfragen_angebot_id_fkey;

alter table kundenanfragen
    drop constraint if exists kundenanfragen_auftrag_id_fkey;

alter table kundenanfragen
    add constraint kundenanfragen_angebot_id_fkey
        foreign key (angebot_id) references angebote(id) on delete set null;

alter table kundenanfragen
    add constraint kundenanfragen_auftrag_id_fkey
        foreign key (auftrag_id) references auftraege(id) on delete set null;

create table if not exists reklamationen (
    id bigserial primary key,
    reklamations_nr text not null unique,
    kunde_id bigint not null references kunden(id) on delete restrict,
    auftrag_id bigint references auftraege(id) on delete set null,
    datum date not null,
    beschreibung text not null,
    status text not null
);

create table if not exists retouren (
    id bigserial primary key,
    retouren_nr text not null unique,
    kunde_id bigint references kunden(id) on delete set null,
    artikel_id bigint references artikel(id) on delete set null,
    datum date not null,
    status text not null,
    grund text
);

create table if not exists bestellungen (
    id bigserial primary key,
    bestell_nr text not null unique,
    lieferant_id bigint not null references lieferanten(id) on delete restrict,
    datum date not null,
    status text not null,
    wareneingang_am date,
    notiz text
);

create table if not exists rechnungen (
    id bigserial primary key,
    rechnungs_nr text not null unique,
    rechnungstyp text not null,
    auftrag_id bigint references auftraege(id) on delete set null,
    bestellung_id bigint references bestellungen(id) on delete set null,
    kunde_id bigint references kunden(id) on delete set null,
    lieferant_id bigint references lieferanten(id) on delete set null,
    datum date not null,
    faellig_am date,
    betrag numeric(12,2) not null,
    status text not null
);

create table if not exists angebotspositionen (
    id bigserial primary key,
    angebot_id bigint not null references angebote(id) on delete cascade,
    artikel_id bigint references artikel(id) on delete set null,
    service_id bigint references services(id) on delete set null,
    bezeichnung text not null,
    positions_typ text not null,
    menge numeric(12,2) not null,
    einzelpreis numeric(12,2) not null,
    check (
        (artikel_id is not null and service_id is null)
        or (artikel_id is null and service_id is not null)
    )
);

create table if not exists auftragspositionen (
    id bigserial primary key,
    auftrag_id bigint not null references auftraege(id) on delete cascade,
    artikel_id bigint references artikel(id) on delete set null,
    service_id bigint references services(id) on delete set null,
    bezeichnung text not null,
    positions_typ text not null,
    menge numeric(12,2) not null,
    einzelpreis numeric(12,2) not null,
    check (
        (artikel_id is not null and service_id is null)
        or (artikel_id is null and service_id is not null)
    )
);

create table if not exists bestellpositionen (
    id bigserial primary key,
    bestellung_id bigint not null references bestellungen(id) on delete cascade,
    artikel_id bigint references artikel(id) on delete set null,
    bezeichnung text not null,
    menge numeric(12,2) not null,
    einstandspreis numeric(12,2) not null
);

create table if not exists vertriebsdokumente (
    id bigserial primary key,
    auftrag_id bigint not null references auftraege(id) on delete cascade,
    kunde_id bigint references kunden(id) on delete set null,
    dokument_typ text not null,
    titel text not null,
    datum date not null,
    status text not null,
    versendet_am date,
    notiz text
);

create table if not exists versandauftraege (
    id bigserial primary key,
    versand_nr text not null unique,
    auftrag_id bigint not null references auftraege(id) on delete cascade,
    datum date not null,
    status text not null,
    transport text,
    liefertermin date
);

create table if not exists einkaufsdokumente (
    id bigserial primary key,
    bestellung_id bigint not null references bestellungen(id) on delete cascade,
    lieferant_id bigint references lieferanten(id) on delete set null,
    dokument_typ text not null,
    titel text not null,
    datum date not null,
    status text not null,
    versendet_am date,
    notiz text
);

create table if not exists zahlungen (
    id bigserial primary key,
    rechnung_id bigint references rechnungen(id) on delete set null,
    auftrag_id bigint references auftraege(id) on delete set null,
    bestellung_id bigint references bestellungen(id) on delete set null,
    zahlungsart text not null,
    name text,
    iban text,
    datum date not null,
    ausfuehren_am date,
    ausfuehrungsdatum date,
    betrag numeric(12,2) not null,
    verwendungszweck text,
    methode text,
    status text not null
);

create table if not exists mahnungen (
    id bigserial primary key,
    rechnung_id bigint not null references rechnungen(id) on delete cascade,
    datum date not null,
    status text not null,
    stufe text not null,
    notiz text
);

create table if not exists arbeitszeiten (
    id bigserial primary key,
    mitarbeiter_id bigint not null references mitarbeiter(id) on delete cascade,
    datum date not null,
    von_uhrzeit time,
    bis_uhrzeit time,
    status text not null
);

create table if not exists urlaubsantraege (
    id bigserial primary key,
    mitarbeiter_id bigint not null references mitarbeiter(id) on delete cascade,
    von date not null,
    bis date not null,
    tage numeric(6,2),
    status text not null
);

create table if not exists krankmeldungen (
    id bigserial primary key,
    mitarbeiter_id bigint not null references mitarbeiter(id) on delete cascade,
    von date not null,
    bis date not null,
    grund text,
    status text not null
);

create table if not exists personalakten (
    id bigserial primary key,
    mitarbeiter_id bigint not null references mitarbeiter(id) on delete cascade,
    dokument_typ text not null,
    titel text not null,
    datum date,
    status text,
    notiz text
);

create table if not exists schulung_teilnehmer (
    id bigserial primary key,
    schulung_id bigint not null references schulungen(id) on delete cascade,
    mitarbeiter_id bigint not null references mitarbeiter(id) on delete cascade,
    unique (schulung_id, mitarbeiter_id)
);

create table if not exists rollen_rechte (
    rolle_id bigint not null references rollen(id) on delete cascade,
    recht_id bigint not null references rechte(id) on delete cascade,
    primary key (rolle_id, recht_id)
);

create table if not exists nachrichten (
    id bigserial primary key,
    vorgang_id text not null,
    anfrage_id bigint references kundenanfragen(id) on delete set null,
    angebot_id bigint references angebote(id) on delete set null,
    datum date not null,
    zeitpunkt timestamp not null,
    sender_rolle text not null,
    sender_name text,
    kanal text,
    betreff text,
    nachricht text not null,
    typ text
);

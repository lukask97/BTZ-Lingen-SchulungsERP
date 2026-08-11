create schema if not exists kunden;
create schema if not exists lieferanten;
create schema if not exists waren;
create schema if not exists verkauf;
create schema if not exists einkauf;
create schema if not exists buchhaltung;
create schema if not exists personal;
create schema if not exists verwaltung;
create schema if not exists organisation;

do $$
begin
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'kunden') then
        alter table public.kunden set schema kunden;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'lieferanten') then
        alter table public.lieferanten set schema lieferanten;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'artikel') then
        alter table public.artikel set schema waren;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'services') then
        alter table public.services set schema waren;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'lager') then
        alter table public.lager set schema waren;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'lagerbestaende') then
        alter table public.lagerbestaende set schema waren;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'artikel_stueckliste') then
        alter table public.artikel_stueckliste set schema waren;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'kundenanfragen') then
        alter table public.kundenanfragen set schema verkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'angebote') then
        alter table public.angebote set schema verkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'angebotspositionen') then
        alter table public.angebotspositionen set schema verkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'auftraege') then
        alter table public.auftraege set schema verkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'auftragspositionen') then
        alter table public.auftragspositionen set schema verkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'vertriebsdokumente') then
        alter table public.vertriebsdokumente set schema verkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'versandauftraege') then
        alter table public.versandauftraege set schema verkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'reklamationen') then
        alter table public.reklamationen set schema verkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'retouren') then
        alter table public.retouren set schema verkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'nachrichten') then
        alter table public.nachrichten set schema verkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'bestellungen') then
        alter table public.bestellungen set schema einkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'bestellpositionen') then
        alter table public.bestellpositionen set schema einkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'einkaufsdokumente') then
        alter table public.einkaufsdokumente set schema einkauf;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'rechnungen') then
        alter table public.rechnungen set schema buchhaltung;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'zahlungen') then
        alter table public.zahlungen set schema buchhaltung;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'mahnungen') then
        alter table public.mahnungen set schema buchhaltung;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'belege') then
        alter table public.belege set schema buchhaltung;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'firmenkonto') then
        alter table public.firmenkonto set schema buchhaltung;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'bewerber') then
        alter table public.bewerber set schema personal;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'mitarbeiter') then
        alter table public.mitarbeiter set schema personal;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'arbeitszeiten') then
        alter table public.arbeitszeiten set schema personal;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'urlaubsantraege') then
        alter table public.urlaubsantraege set schema personal;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'krankmeldungen') then
        alter table public.krankmeldungen set schema personal;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'schulungen') then
        alter table public.schulungen set schema personal;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'schulung_teilnehmer') then
        alter table public.schulung_teilnehmer set schema personal;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'personalakten') then
        alter table public.personalakten set schema personal;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'benutzer') then
        alter table public.benutzer set schema verwaltung;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'rollen') then
        alter table public.rollen set schema verwaltung;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'rechte') then
        alter table public.rechte set schema verwaltung;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'rollen_rechte') then
        alter table public.rollen_rechte set schema verwaltung;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'abteilungen') then
        alter table public.abteilungen set schema organisation;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'marketingaktionen') then
        alter table public.marketingaktionen set schema organisation;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'freigaben') then
        alter table public.freigaben set schema organisation;
    end if;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'berichte') then
        alter table public.berichte set schema organisation;
    end if;
end $$;

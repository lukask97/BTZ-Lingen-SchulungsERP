alter table verwaltung.rollen_rechte
    add column if not exists id bigserial;

create unique index if not exists rollen_rechte_id_uidx
    on verwaltung.rollen_rechte (id);

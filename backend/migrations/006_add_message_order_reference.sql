alter table if exists verkauf.nachrichten
    add column if not exists auftrag_id bigint references verkauf.auftraege(id) on delete set null;

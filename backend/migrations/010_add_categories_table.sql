create table if not exists waren.kategorien (
    id bigint primary key,
    name text not null,
    parent_id bigint references waren.kategorien(id) on delete restrict,
    beschreibung text
);

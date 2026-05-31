-- ============================================================
-- Tem no SUS! — Migration inicial (schema + RPC + RLS + seed)
-- Banco: Postgres 17 + PostGIS (Supabase)
-- Município piloto: Joaçaba/SC
-- ============================================================

create extension if not exists postgis;
create extension if not exists pg_trgm;

-- ---------- Tabelas ----------

create table if not exists municipios (
  id          bigint primary key generated always as identity,
  codigo_ibge text unique not null,
  nome        text not null,
  uf          char(2) not null
);

create table if not exists estabelecimentos (
  id            bigint primary key generated always as identity,
  cnes_id       text unique not null,
  nome          text not null,
  nome_fantasia text,
  tipo          text,
  endereco      text,
  bairro        text,
  telefone      text,
  horario       text,
  municipio_id  bigint references municipios(id),
  lat           double precision,
  lng           double precision,
  localizacao   geography(point, 4326),
  ativo         boolean default true,
  atualizado_em timestamptz default now()
);

-- mantém `localizacao` em sincronia com lat/lng (o app lê lat/lng; a RPC usa localizacao)
create or replace function set_localizacao()
returns trigger language plpgsql as $$
begin
  if new.lat is not null and new.lng is not null then
    new.localizacao := st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  else
    new.localizacao := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_localizacao on estabelecimentos;
create trigger trg_localizacao
  before insert or update on estabelecimentos
  for each row execute function set_localizacao();

create index if not exists idx_estab_geo on estabelecimentos using gist (localizacao);
create index if not exists idx_estab_nome on estabelecimentos using gin (nome gin_trgm_ops);

create table if not exists servicos (
  codigo       text primary key,
  nome_tecnico text not null
);

create table if not exists estabelecimento_servicos (
  estabelecimento_id bigint references estabelecimentos(id) on delete cascade,
  servico_codigo     text references servicos(codigo) on delete cascade,
  primary key (estabelecimento_id, servico_codigo)
);

create table if not exists necessidades (
  id             bigint primary key generated always as identity,
  slug           text unique not null,
  texto_cidadao  text not null,
  sinonimos      text[],
  servico_codigo text references servicos(codigo),
  icone          text,
  ativo          boolean default true
);
create index if not exists idx_neces_trgm on necessidades using gin (texto_cidadao gin_trgm_ops);

create table if not exists confirmacoes (
  id                 bigint primary key generated always as identity,
  estabelecimento_id bigint references estabelecimentos(id) on delete cascade,
  usuario_id         uuid references auth.users(id),
  status             text check (status in ('funciona','fechou','mudou')),
  comentario         text,
  criado_em          timestamptz default now()
);

-- ---------- RPC de busca (necessidade -> serviço -> distância) ----------

create or replace function buscar_servicos(
  termo text,
  lat double precision,
  lng double precision,
  raio_metros int default 15000
)
returns table (
  estabelecimento_id bigint,
  nome text,
  endereco text,
  telefone text,
  horario text,
  distancia_metros double precision
)
language sql stable
as $$
  with ponto as (
    select st_setsrid(st_makepoint(lng, lat), 4326)::geography as g
  ),
  alvo as (
    select n.servico_codigo
    from necessidades n
    where n.ativo and (
      termo ilike '%' || n.texto_cidadao || '%'
      or n.texto_cidadao ilike '%' || termo || '%'
      or n.texto_cidadao % termo
      or exists (
        select 1 from unnest(coalesce(n.sinonimos, '{}')) s
        where termo ilike '%' || s || '%' or s % termo
      )
    )
    order by similarity(n.texto_cidadao, termo) desc
    limit 1
  )
  select e.id, e.nome, e.endereco, e.telefone, e.horario,
         st_distance(e.localizacao, (select g from ponto)) as distancia_metros
  from estabelecimentos e
  join estabelecimento_servicos es on es.estabelecimento_id = e.id
  join alvo a on a.servico_codigo = es.servico_codigo
  where e.ativo
    and e.localizacao is not null
    and st_dwithin(e.localizacao, (select g from ponto), raio_metros)
  order by distancia_metros
  limit 30;
$$;

-- ---------- Permissões / RLS ----------

grant usage on schema public to anon, authenticated;
grant select on municipios, estabelecimentos, servicos,
  estabelecimento_servicos, necessidades to anon, authenticated;
grant insert on confirmacoes to authenticated;
grant execute on function buscar_servicos(text, double precision, double precision, int)
  to anon, authenticated;

alter table estabelecimentos enable row level security;
alter table necessidades enable row level security;
alter table servicos enable row level security;
alter table estabelecimento_servicos enable row level security;
alter table municipios enable row level security;
alter table confirmacoes enable row level security;

drop policy if exists "leitura publica estab" on estabelecimentos;
create policy "leitura publica estab" on estabelecimentos for select using (true);
drop policy if exists "leitura publica neces" on necessidades;
create policy "leitura publica neces" on necessidades for select using (true);
drop policy if exists "leitura publica serv" on servicos;
create policy "leitura publica serv" on servicos for select using (true);
drop policy if exists "leitura publica es" on estabelecimento_servicos;
create policy "leitura publica es" on estabelecimento_servicos for select using (true);
drop policy if exists "leitura publica mun" on municipios;
create policy "leitura publica mun" on municipios for select using (true);
drop policy if exists "confirmar autenticado" on confirmacoes;
create policy "confirmar autenticado" on confirmacoes
  for insert to authenticated with check (auth.uid() = usuario_id);

-- ============================================================
-- SEED — Joaçaba/SC (dados de exemplo p/ Fase 1; substituir por ingestão CNES)
-- ============================================================

insert into municipios (codigo_ibge, nome, uf)
values ('4209003', 'Joaçaba', 'SC')
on conflict (codigo_ibge) do nothing;

insert into servicos (codigo, nome_tecnico) values
  ('atencao_basica', 'Atenção Primária (UBS)'),
  ('saude_mental',   'Atenção Psicossocial (CAPS)'),
  ('odonto_esp',     'Especialidades Odontológicas (CEO)'),
  ('farmacia',       'Farmácia Popular'),
  ('fono',           'Fonoaudiologia'),
  ('reabilitacao',   'Reabilitação (CER)'),
  ('vacina',         'Sala de Vacina'),
  ('prenatal',       'Pré-natal'),
  ('dependencia',    'Atenção a Dependência Química (CAPS AD)')
on conflict (codigo) do nothing;

insert into necessidades (slug, texto_cidadao, sinonimos, servico_codigo, icone) values
  ('psicologo', 'psicólogo', array['terapia','saúde mental','psiquiatra','cabeça','ansiedade','depressão'], 'saude_mental', 'happy-outline'),
  ('dentista', 'dentista', array['dente','canal','aparelho','odontologia','boca'], 'odonto_esp', 'medical-outline'),
  ('remedio-gratis', 'remédio de graça', array['remédio','farmácia','medicamento','farmácia popular'], 'farmacia', 'bandage-outline'),
  ('fonoaudiologo', 'fono', array['fonoaudiólogo','fala','meu filho não fala','audição'], 'fono', 'ear-outline'),
  ('vacina', 'vacina', array['vacinar','vacinação','imunização'], 'vacina', 'shield-checkmark-outline'),
  ('pre-natal', 'pré-natal', array['grávida','gestante','gravidez','prenatal'], 'prenatal', 'heart-outline'),
  ('dependencia', 'dependência química', array['álcool','droga','alcoolismo','vício','beber'], 'dependencia', 'people-outline'),
  ('fisioterapia', 'reabilitação', array['fisioterapia','fisioterapeuta','reabilitar','avc'], 'reabilitacao', 'fitness-outline')
on conflict (slug) do nothing;

-- estabelecimentos de exemplo em Joaçaba (coordenadas aproximadas)
insert into estabelecimentos (cnes_id, nome, tipo, endereco, bairro, telefone, horario, municipio_id, lat, lng)
select v.cnes_id, v.nome, v.tipo, v.endereco, v.bairro, v.telefone, v.horario, m.id, v.lat, v.lng
from (values
  ('SEED0001', 'CAPS II Joaçaba', 'Centro de Atenção Psicossocial',
   'Rua XV de Novembro, 120 - Centro', 'Centro', '(49) 3522-0000', 'Seg a sex, 7h-17h', -27.1768, -51.5052),
  ('SEED0002', 'UBS Centro', 'Unidade Básica de Saúde',
   'Av. XV de Novembro, 800 - Centro', 'Centro', '(49) 3522-1111', 'Seg a sex, 7h-19h', -27.1779, -51.5031),
  ('SEED0003', 'Farmácia Popular - Drogaria São José', 'Farmácia Popular',
   'Rua Frei Bruno, 230 - Centro', 'Centro', '(49) 3522-2222', 'Seg a sáb, 8h-20h', -27.1755, -51.5048),
  ('SEED0004', 'CEO - Centro de Especialidades Odontológicas', 'Centro de Especialidades Odontológicas',
   'Rua Roberto Trompowsky, 45 - Centro', 'Centro', '(49) 3522-3333', 'Seg a sex, 8h-17h', -27.1790, -51.5070),
  ('SEED0005', 'CER Meio Oeste - Reabilitação', 'Centro Especializado em Reabilitação',
   'Rua Tijucas, 510 - Flor da Serra', 'Flor da Serra', '(49) 3522-4444', 'Seg a sex, 8h-17h', -27.1820, -51.4990),
  ('SEED0006', 'CAPS AD Joaçaba', 'CAPS Álcool e Drogas',
   'Rua Manoel Marcondes, 77 - Nazaré', 'Nazaré', '(49) 3522-5555', 'Seg a sex, 8h-18h', -27.1740, -51.5100)
) as v(cnes_id, nome, tipo, endereco, bairro, telefone, horario, lat, lng)
cross join (select id from municipios where codigo_ibge = '4209003') m
on conflict (cnes_id) do nothing;

-- vínculos estabelecimento -> serviço
insert into estabelecimento_servicos (estabelecimento_id, servico_codigo)
select e.id, s.codigo
from estabelecimentos e
join (values
  ('SEED0001','saude_mental'),
  ('SEED0002','atencao_basica'),
  ('SEED0002','vacina'),
  ('SEED0002','prenatal'),
  ('SEED0003','farmacia'),
  ('SEED0004','odonto_esp'),
  ('SEED0005','reabilitacao'),
  ('SEED0005','fono'),
  ('SEED0006','dependencia')
) as v(cnes_id, servico_codigo) on v.cnes_id = e.cnes_id
join servicos s on s.codigo = v.servico_codigo
on conflict do nothing;

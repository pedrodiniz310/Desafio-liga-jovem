-- ============================================================
-- Migration 0005: descoberta_texto, jornadas e buscar_descobertas
-- ============================================================

-- Coluna de texto emocional para o Modo Descoberta
alter table necessidades add column if not exists descoberta_texto text;

-- Tabela de jornadas guiadas
create table if not exists jornadas (
  id        bigint primary key generated always as identity,
  slug      text unique not null,
  titulo    text not null,
  descricao text not null,
  icone     text not null,
  cor       text not null,   -- hex p/ fundo do card (ex: '#f8e6dd')
  passos    jsonb not null default '[]',
  -- cada passo: {ordem:int, servico_codigo:text, titulo_passo:text, por_que_importa:text}
  ativo     boolean default true
);

alter table jornadas enable row level security;
drop policy if exists "jornadas publico" on jornadas;
create policy "jornadas publico" on jornadas for select using (ativo = true);
grant select on jornadas to anon, authenticated;

-- RPC: retorna 1 estabelecimento por tipo de serviço "descobrível" no raio
create or replace function buscar_descobertas(
  lat         double precision,
  lng         double precision,
  raio_metros int default 20000
)
returns table (
  necessidade_id       bigint,
  slug                 text,
  descoberta_texto     text,
  icone                text,
  estabelecimento_id   bigint,
  nome_estabelecimento text,
  endereco             text,
  distancia_metros     double precision
)
language sql stable as $$
  with ponto as (
    select st_setsrid(st_makepoint(lng, lat), 4326)::geography as g
  ),
  candidatos as (
    select distinct on (n.servico_codigo)
      n.id                          as necessidade_id,
      n.slug,
      n.descoberta_texto,
      n.icone,
      e.id                          as estabelecimento_id,
      e.nome                        as nome_estabelecimento,
      e.endereco,
      st_distance(e.localizacao, (select g from ponto)) as distancia_metros
    from necessidades n
    join estabelecimento_servicos es on es.servico_codigo = n.servico_codigo
    join estabelecimentos e on e.id = es.estabelecimento_id
    where n.descoberta_texto is not null
      and n.ativo
      and e.ativo
      and e.localizacao is not null
      and st_dwithin(e.localizacao, (select g from ponto), raio_metros)
    order by n.servico_codigo,
             st_distance(e.localizacao, (select g from ponto))
  )
  select * from candidatos
  order by distancia_metros
  limit 10;
$$;

grant execute on function buscar_descobertas(double precision, double precision, int)
  to anon, authenticated;

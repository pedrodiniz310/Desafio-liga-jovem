-- ============================================================
-- Migration 0009: descobertas universais (decoupladas de local)
-- ============================================================

-- 1) Flag: descoberta vale em qualquer lugar (não exige estabelecimento próximo)
alter table necessidades add column if not exists universal boolean not null default false;

-- 2) buscar_descobertas: une descobertas LOCAIS (com distância) + UNIVERSAIS (sem local),
--    intercalando os dois grupos para um feed mais rico.
--    DROP necessário: o retorno mudou (nova coluna `universal`).
drop function if exists buscar_descobertas(double precision, double precision, int);
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
  universal            boolean,
  estabelecimento_id   bigint,
  nome_estabelecimento text,
  endereco             text,
  distancia_metros     double precision
)
language sql stable as $$
  with ponto as (
    select st_setsrid(st_makepoint(lng, lat), 4326)::geography as g
  ),
  locais as (
    select distinct on (n.servico_codigo)
      n.id                          as necessidade_id,
      n.slug,
      n.descoberta_texto,
      n.icone,
      false                         as universal,
      e.id                          as estabelecimento_id,
      e.nome                        as nome_estabelecimento,
      e.endereco,
      st_distance(e.localizacao, (select g from ponto)) as distancia_metros
    from necessidades n
    join estabelecimento_servicos es on es.servico_codigo = n.servico_codigo
    join estabelecimentos e on e.id = es.estabelecimento_id
    where n.descoberta_texto is not null
      and n.ativo
      and not n.universal
      and e.ativo
      and e.localizacao is not null
      and st_dwithin(e.localizacao, (select g from ponto), raio_metros)
    order by n.servico_codigo,
             st_distance(e.localizacao, (select g from ponto))
  ),
  universais as (
    select
      n.id                          as necessidade_id,
      n.slug,
      n.descoberta_texto,
      n.icone,
      true                          as universal,
      null::bigint                  as estabelecimento_id,
      null::text                    as nome_estabelecimento,
      null::text                    as endereco,
      null::double precision        as distancia_metros
    from necessidades n
    where n.descoberta_texto is not null
      and n.ativo
      and n.universal
  ),
  combinado as (
    select *,
      row_number() over (partition by universal order by distancia_metros nulls last, necessidade_id) as rn
    from (
      select * from locais
      union all
      select * from universais
    ) t
  )
  select
    necessidade_id, slug, descoberta_texto, icone, universal,
    estabelecimento_id, nome_estabelecimento, endereco, distancia_metros
  from combinado
  order by rn, universal      -- intercala: local(rn1), universal(rn1), local(rn2), universal(rn2)...
  limit 20;
$$;

grant execute on function buscar_descobertas(double precision, double precision, int)
  to anon, authenticated;

-- 3) buscar_servicos: descobertas universais NÃO devem virar alvo de busca
--    (não têm estabelecimento → resultado vazio "dead-end"). Excluímos via not n.universal.
--    Replica a definição da migration 0003 (com necessidade_texto + ordenação por score),
--    adicionando apenas o filtro not n.universal no CTE alvo.
create or replace function buscar_servicos(
  termo       text,
  lat         double precision,
  lng         double precision,
  raio_metros int default 15000
)
returns table (
  estabelecimento_id bigint,
  nome               text,
  endereco           text,
  telefone           text,
  horario            text,
  distancia_metros   double precision,
  necessidade_texto  text
)
language sql stable
as $$
  with ponto as (
    select st_setsrid(st_makepoint(lng, lat), 4326)::geography as g
  ),
  alvo as (
    select n.servico_codigo, n.texto_cidadao,
      greatest(
        similarity(n.texto_cidadao, termo),
        coalesce(
          (select max(similarity(s, termo))
           from unnest(coalesce(n.sinonimos, '{}')) s),
          0
        )
      ) as score
    from necessidades n
    where n.ativo
      and not n.universal
      and (
        termo ilike '%' || n.texto_cidadao || '%'
        or n.texto_cidadao ilike '%' || termo || '%'
        or n.texto_cidadao % termo
        or exists (
          select 1 from unnest(coalesce(n.sinonimos, '{}')) s
          where termo ilike '%' || s || '%' or s ilike '%' || termo || '%' or s % termo
        )
      )
    order by score desc
    limit 1
  )
  select e.id, e.nome, e.endereco, e.telefone, e.horario,
         st_distance(e.localizacao, (select g from ponto)) as distancia_metros,
         (select texto_cidadao from alvo) as necessidade_texto
  from estabelecimentos e
  join estabelecimento_servicos es on es.estabelecimento_id = e.id
  join alvo a on a.servico_codigo = es.servico_codigo
  where e.ativo
    and e.localizacao is not null
    and st_dwithin(e.localizacao, (select g from ponto), raio_metros)
  order by distancia_metros
  limit 30;
$$;

grant execute on function buscar_servicos(text, double precision, double precision, int)
  to anon, authenticated;

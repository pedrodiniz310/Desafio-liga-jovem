-- ============================================================
-- Migration 0012: adiciona lat e lng ao retorno de buscar_servicos
-- Necessário para renderizar pins no mapa de resultados.
-- DROP obrigatório: o retorno da função mudou (novas colunas).
-- ============================================================

drop function if exists buscar_servicos(text, double precision, double precision, int);

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
  necessidade_texto  text,
  lat                double precision,
  lng                double precision
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
         (select texto_cidadao from alvo)                  as necessidade_texto,
         e.lat,
         e.lng
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

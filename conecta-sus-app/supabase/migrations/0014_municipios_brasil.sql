-- ============================================================
-- Migration 0014: municipios do Brasil + resolucao por proximidade
-- ============================================================

-- Centroide do municipio + cache de ingestao CNES.
alter table municipios
  add column if not exists lat         double precision,
  add column if not exists lng         double precision,
  add column if not exists localizacao geography(point, 4326),
  add column if not exists importado_em timestamptz;

-- Mantem localizacao em sincronia com lat/lng (mesmo padrao de estabelecimentos).
create or replace function set_municipio_localizacao()
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

drop trigger if exists trg_municipio_localizacao on municipios;
create trigger trg_municipio_localizacao
  before insert or update on municipios
  for each row execute function set_municipio_localizacao();

create index if not exists idx_municipios_geo on municipios using gist (localizacao);

-- RPC: municipio de centroide mais proximo das coordenadas dadas.
-- IMPORTANTE: params com prefixo p_ para NAO colidir com as colunas
-- municipios.lat/lng (colisao faria cada linha medir distancia a si mesma = 0).
create or replace function municipio_mais_proximo(
  p_lat double precision,
  p_lng double precision
)
returns table (
  codigo_ibge  text,
  nome         text,
  uf           char(2),
  importado_em timestamptz,
  distancia_km double precision
)
language sql stable as $$
  select m.codigo_ibge, m.nome, m.uf, m.importado_em,
         round((st_distance(
           m.localizacao,
           st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
         ) / 1000)::numeric, 1)::double precision as distancia_km
  from municipios m
  where m.localizacao is not null
  order by m.localizacao <-> st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
  limit 1;
$$;

grant execute on function municipio_mais_proximo(double precision, double precision)
  to anon, authenticated;
grant select on municipios to anon, authenticated;

alter table municipios enable row level security;
drop policy if exists "leitura publica municipios" on municipios;
create policy "leitura publica municipios" on municipios for select using (true);

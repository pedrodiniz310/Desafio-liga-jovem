-- ============================================================
-- Migration 0003: perfis, gamificação e alertas de direitos
-- ============================================================

-- ---------- perfis de usuário ----------
create table if not exists perfis (
  id               uuid primary key references auth.users(id) on delete cascade,
  data_nascimento  date,
  condicoes        text[] not null default '{}',
  pontos           int not null default 0,
  criado_em        timestamptz default now()
);

-- ---------- badges ----------
create table if not exists badges (
  slug                text primary key,
  nome                text not null,
  descricao           text not null,
  icone               text not null,
  pontos_necessarios  int not null default 0
);

create table if not exists usuario_badges (
  usuario_id     uuid references auth.users(id) on delete cascade,
  badge_slug     text references badges(slug) on delete cascade,
  conquistado_em timestamptz default now(),
  primary key (usuario_id, badge_slug)
);

-- ---------- regras de direitos ----------
create table if not exists regras_direitos (
  id             bigint primary key generated always as identity,
  titulo         text not null,
  mensagem       text not null,
  -- { "idade_min"?: int, "idade_max"?: int, "condicoes"?: string[] }
  condicao       jsonb not null default '{}',
  servico_codigo text references servicos(codigo),
  icone          text,
  ativo          boolean default true
);

-- ---------- trigger: 10 pontos por confirmação ----------
create or replace function fn_pontos_confirmacao()
returns trigger language plpgsql security definer as $$
begin
  if new.usuario_id is not null and auth.uid() = new.usuario_id then
    insert into perfis (id, pontos)
    values (new.usuario_id, 10)
    on conflict (id) do update set pontos = perfis.pontos + 10;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pontos_confirmacao on confirmacoes;
create trigger trg_pontos_confirmacao
  after insert on confirmacoes
  for each row execute function fn_pontos_confirmacao();

-- ---------- RPC: conceder badges por marco de confirmações ----------
create or replace function verificar_badges(uid uuid)
returns void language plpgsql security definer as $$
declare
  qtd int;
begin
  if auth.uid() is null or auth.uid() <> uid then
    raise exception 'usuario nao autorizado para verificar badges';
  end if;

  select count(*) into qtd from confirmacoes where usuario_id = uid;
  if qtd >= 1 then
    insert into usuario_badges (usuario_id, badge_slug)
    values (uid, 'primeira-confirmacao') on conflict do nothing;
  end if;
  if qtd >= 10 then
    insert into usuario_badges (usuario_id, badge_slug)
    values (uid, 'guia-comunidade') on conflict do nothing;
  end if;
  if qtd >= 50 then
    insert into usuario_badges (usuario_id, badge_slug)
    values (uid, 'guardiao-saude') on conflict do nothing;
  end if;
end;
$$;

-- ---------- buscar_servicos: adiciona campo necessidade_texto ----------
-- Ordena pelo score do melhor sinônimo para busca semântica correta.
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
    where n.ativo and (
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

-- ---------- RLS ----------
alter table perfis enable row level security;
alter table badges enable row level security;
alter table usuario_badges enable row level security;
alter table regras_direitos enable row level security;

drop policy if exists "perfil proprio" on perfis;
create policy "perfil proprio" on perfis
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "badges publico" on badges;
create policy "badges publico" on badges for select using (true);

drop policy if exists "ub proprio" on usuario_badges;
create policy "ub proprio" on usuario_badges
  for select using (auth.uid() = usuario_id);

drop policy if exists "regras publico" on regras_direitos;
create policy "regras publico" on regras_direitos for select using (ativo = true);

drop policy if exists "leitura publica confirmacoes" on confirmacoes;
create policy "leitura publica confirmacoes" on confirmacoes
  for select to anon, authenticated using (true);

-- ---------- Grants ----------
revoke insert, update, delete on perfis from authenticated;
grant select on perfis to authenticated;
grant insert (id, data_nascimento, condicoes) on perfis to authenticated;
grant update (data_nascimento, condicoes) on perfis to authenticated;
grant select on badges to anon, authenticated;
revoke insert, update, delete on usuario_badges from authenticated;
grant select on usuario_badges to authenticated;
grant select on regras_direitos to anon, authenticated;
grant select (estabelecimento_id, status, criado_em) on confirmacoes to anon;
grant select (id, estabelecimento_id, usuario_id, status, criado_em) on confirmacoes to authenticated;
grant execute on function verificar_badges(uuid) to authenticated;

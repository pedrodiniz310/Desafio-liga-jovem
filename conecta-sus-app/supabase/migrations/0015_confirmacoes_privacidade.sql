-- ============================================================
-- Migration 0015: privacidade + anti-abuso das confirmacoes
-- (code review multi-LLM, 03/06/2026)
--
-- PROBLEMA 1 (vazamento): a policy "leitura publica confirmacoes" (0003)
--   permitia SELECT publico em TODAS as linhas, e o grant expunha usuario_id
--   -> qualquer um correlacionava o UUID de um usuario com os servicos de
--      saude que ele confirmou (deanonimizacao de atividade de saude).
-- PROBLEMA 2 (abuso): insert anonimo ilimitado + trigger de +10 pontos sem
--   dedupe -> ballot-stuffing de status e farm de pontos.
--
-- CORRECAO:
--   - estatisticas da comunidade passam por RPC AGREGADA (sem usuario_id);
--   - o dono ainda le APENAS as proprias linhas (gamificacao conta as suas);
--   - anti-flood: 1 confirmacao por usuario/estabelecimento a cada 6h.
-- ============================================================

-- 1) Reset dos grants (estavam amplos: anon/auth com SELECT/UPDATE/REFERENCES em tudo).
revoke all on confirmacoes from anon;
revoke all on confirmacoes from authenticated;

-- anon: SO insere (validacao comunitaria anonima); nunca le direto.
grant insert (estabelecimento_id, usuario_id, status, comentario, tempo_espera_minutos)
  on confirmacoes to anon;

-- authenticated: insere + le APENAS as proprias linhas (RLS abaixo).
grant insert (estabelecimento_id, usuario_id, status, comentario, tempo_espera_minutos)
  on confirmacoes to authenticated;
grant select (id, estabelecimento_id, usuario_id, status, criado_em, tempo_espera_minutos)
  on confirmacoes to authenticated;

-- 2) RLS: remove a leitura publica (vazava usuario_id); dono le so as suas.
drop policy if exists "leitura publica confirmacoes" on confirmacoes;
drop policy if exists "confirmacoes proprias" on confirmacoes;
create policy "confirmacoes proprias" on confirmacoes
  for select to authenticated using (auth.uid() = usuario_id);
-- (a policy de INSERT "confirmar publico" da migration 0002 permanece valida)

-- 3) RPC agregada de estatisticas (janela de 6h), SEM expor usuario_id.
--    SECURITY DEFINER: le confirmacoes mesmo apos o revoke de SELECT do invocador.
create or replace function estatisticas_confirmacoes(p_estab bigint)
returns table (
  total                bigint,
  funciona             bigint,
  fechou               bigint,
  mudou                bigint,
  status_dominante     text,
  tempo_espera_recente int
)
language sql
stable
security definer
set search_path = public
as $$
  with recentes as (
    select status, tempo_espera_minutos
    from confirmacoes
    where estabelecimento_id = p_estab
      and criado_em >= now() - interval '6 hours'
  ),
  agg as (
    select
      count(*)                                          as total,
      count(*) filter (where status = 'funciona')       as funciona,
      count(*) filter (where status = 'fechou')         as fechou,
      count(*) filter (where status = 'mudou')          as mudou,
      percentile_disc(0.5) within group (order by tempo_espera_minutos)
        filter (where tempo_espera_minutos is not null) as tempo_espera_recente
    from recentes
  )
  select
    a.total, a.funciona, a.fechou, a.mudou,
    case
      when a.total = 0 then null
      when a.funciona >= a.fechou and a.funciona >= a.mudou then 'funciona'
      when a.fechou >= a.mudou then 'fechou'
      else 'mudou'
    end as status_dominante,
    a.tempo_espera_recente::int
  from agg a;
$$;

grant execute on function estatisticas_confirmacoes(bigint) to anon, authenticated;

-- 4) Anti-flood: bloqueia confirmacao repetida do mesmo usuario no mesmo
--    estabelecimento dentro de 6h (impede farm de pontos / multi-voto).
--    anon (usuario_id null) nao e barrado aqui (precisa de device id no futuro),
--    mas anon nao ganha pontos (trigger fn_pontos_confirmacao exige usuario_id).
create or replace function fn_confirmacao_antiflood()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.usuario_id is not null and exists (
    select 1 from confirmacoes c
    where c.usuario_id = new.usuario_id
      and c.estabelecimento_id = new.estabelecimento_id
      and c.criado_em > now() - interval '6 hours'
  ) then
    raise exception 'Voce ja avaliou este servico recentemente. Tente mais tarde.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_confirmacao_antiflood on confirmacoes;
create trigger trg_confirmacao_antiflood
  before insert on confirmacoes
  for each row execute function fn_confirmacao_antiflood();

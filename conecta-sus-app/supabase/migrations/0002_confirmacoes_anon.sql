-- ============================================================
-- Conecta SUS — Migration 0002
-- Permite validação comunitária anônima (sem login).
-- A coluna confirmacoes.usuario_id continua nullable; no piloto
-- aceitamos confirmações sem atribuição de usuário.
-- ============================================================

grant insert on confirmacoes to anon;

drop policy if exists "confirmar autenticado" on confirmacoes;

create policy "confirmar publico" on confirmacoes
  for insert to anon, authenticated with check (true);

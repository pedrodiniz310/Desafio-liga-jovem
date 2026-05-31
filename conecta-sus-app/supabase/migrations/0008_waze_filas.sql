-- Adiciona campo de tempo de espera às confirmações (Pulso da Comunidade)
alter table confirmacoes
  add column if not exists tempo_espera_minutos int check (tempo_espera_minutos in (0, 30, 60, 120));

-- Índice para busca de confirmações recentes por estabelecimento
create index if not exists idx_confirmacoes_estab_recente
  on confirmacoes(estabelecimento_id, criado_em desc);

comment on column confirmacoes.tempo_espera_minutos is
  'Tempo de espera informado pelo usuário: 0=sem fila, 30=~30min, 60=~1h, 120=>2h. NULL se não informado.';

-- ============================================================
-- Migration 0005: suporte a ingestao CNES/DATASUS
-- ============================================================

create extension if not exists pgcrypto;

-- Metadados usados pelo app para diferenciar seed de dado oficial.
alter table estabelecimentos
  add column if not exists fonte_dados text not null default 'seed_prototipo',
  add column if not exists competencia_cnes date,
  add column if not exists importado_em timestamptz,
  add column if not exists geocoding_status text not null default 'sem_geocoding';

update estabelecimentos
set fonte_dados = 'seed_prototipo',
    geocoding_status = 'coordenada_demo'
where cnes_id like 'SEED%';

create index if not exists idx_estab_fonte_dados on estabelecimentos (fonte_dados);
create index if not exists idx_estab_competencia_cnes on estabelecimentos (competencia_cnes);

-- Registro de cada execucao do pipeline de dados.
create table if not exists importacoes_dados (
  id                          uuid primary key default gen_random_uuid(),
  fonte                       text not null,
  escopo_municipio_codigo_ibge text not null,
  escopo_municipio_nome       text not null,
  escopo_uf                   char(2) not null,
  competencia                 date,
  status                      text not null check (status in ('em_andamento', 'concluida', 'falhou', 'dry_run')),
  registros_lidos             int not null default 0,
  registros_importados        int not null default 0,
  registros_com_erro          int not null default 0,
  iniciada_em                 timestamptz not null default now(),
  finalizada_em               timestamptz,
  observacoes                 jsonb not null default '{}'
);

create table if not exists cnes_estabelecimentos_raw (
  importacao_id uuid not null references importacoes_dados(id) on delete cascade,
  codigo_cnes   text not null,
  codigo_municipio text,
  payload       jsonb not null,
  recebido_em   timestamptz not null default now(),
  primary key (importacao_id, codigo_cnes)
);

create table if not exists cnes_tipos_unidade_raw (
  importacao_id uuid not null references importacoes_dados(id) on delete cascade,
  codigo_tipo_unidade int not null,
  payload       jsonb not null,
  recebido_em   timestamptz not null default now(),
  primary key (importacao_id, codigo_tipo_unidade)
);

-- Mapeamento estavel por tipo de unidade. Regras por nome ficam no importador
-- porque dependem de heuristica e revisao manual.
create table if not exists cnes_tipo_unidade_servicos (
  codigo_tipo_unidade int not null,
  servico_codigo      text not null references servicos(codigo) on delete cascade,
  regra               text not null default 'tipo_unidade',
  observacao          text,
  primary key (codigo_tipo_unidade, servico_codigo, regra)
);

insert into cnes_tipo_unidade_servicos
  (codigo_tipo_unidade, servico_codigo, observacao)
values
  (43, 'farmacia',       'Farmacia'),
  (70, 'saude_mental',   'Centro de Atencao Psicossocial'),
  (71, 'atencao_basica', 'Centro de Apoio a Saude da Familia')
on conflict do nothing;

alter table importacoes_dados enable row level security;
alter table cnes_estabelecimentos_raw enable row level security;
alter table cnes_tipos_unidade_raw enable row level security;
alter table cnes_tipo_unidade_servicos enable row level security;

# Ingestao CNES/DATASUS

O app continua com seed de prototipo na migration inicial, mas a base real deve ser carregada pelo pipeline em `scripts/import-cnes.mjs`.

Fonte oficial usada:

- Dataset CNES no Portal de Dados Abertos do SUS: `https://dadosabertos.saude.gov.br/dataset/cnes-cadastro-nacional-de-estabelecimentos-de-saude`
- API de Dados Abertos: `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos`

## Antes de importar

1. Aplicar as migrations ate `0005_importacao_cnes.sql`.
2. Configurar `.env` com:

```txt
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

Use a service role key apenas em ambiente administrativo local ou CI. Ela nunca deve ser exposta no app.

## Dry-run

```bash
npm run import:cnes:dry-run
```

Por padrao o escopo e Joaçaba/SC (`codigo_ibge=4209003`). Para outro municipio:

```bash
npm run import:cnes:dry-run -- --codigo-ibge=4209003 --municipio=Joacaba --uf=SC
```

## Importacao

```bash
npm run import:cnes
```

O script:

- baixa estabelecimentos e tipos de unidade da API oficial;
- registra payload bruto em tabelas `cnes_*_raw`;
- faz upsert em `municipios` e `estabelecimentos`;
- grava `fonte_dados`, `competencia_cnes`, `importado_em` e `geocoding_status`;
- recria os vinculos em `estabelecimento_servicos` para estabelecimentos importados;
- desativa `SEED%` quando ao menos um estabelecimento oficial for importado.

Para manter os seeds ativos durante validacao:

```bash
npm run import:cnes -- --keep-seeds
```

## Validacao no Supabase

```sql
select count(*) as seeds_ativos
from estabelecimentos
where cnes_id like 'SEED%' and ativo = true;

select cnes_id, nome, tipo, fonte_dados, competencia_cnes
from estabelecimentos
where fonte_dados like 'CNES%'
order by nome
limit 20;

select *
from importacoes_dados
order by iniciada_em desc
limit 5;
```

## Mapeamento de servicos

O mapeamento estavel por tipo CNES fica em `cnes_tipo_unidade_servicos`.
O importador tambem aplica heuristicas conservadoras por nome para CAPS AD, CEO, CER, fonoaudiologia, fisioterapia e farmacia.

Qualquer mapeamento novo deve ser validado manualmente antes de ampliar para outros municipios.

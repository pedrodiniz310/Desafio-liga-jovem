# Refinar Heurísticas de Inferência de Serviço CNES — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: executing-plans (inline).

**Goal:** Mapear mais serviços **SUS reais** (odonto/CEO, fono, fisioterapia/reabilitação) e tornar UBS robusta por tipo — **sem** incluir clínicas privadas (app é SUS gratuito; honestidade > recall).

**Architecture:** A inferência de serviço (`inferServicos`) existe idêntica em 2 lugares: `supabase/functions/importar-municipio/cnes.ts` (edge, caminho vivo) e `scripts/import-cnes.mjs` (script local). Refinar os dois igual: (1) mapeamento **estrutural por tipo de unidade** (UBS/POSTO/CENTRO DE SAUDE, CAPS, FARMACIA) — robusto, independe do nome; (2) **especialidade por nome com gate SUS** (`atende_sus=SIM` ou nome público) — pega CEO/CER/fono municipais, exclui consultórios privados.

**Tech Stack:** Deno (edge), Node (script), Supabase CLI, PostgreSQL (verificação via MCP).

**Projeto Supabase:** `eydegpjzlxuxttzoinnh`.

---

## Baseline (antes) — medido 01/06

| Município | odonto_esp | fono | reabilitacao | dependencia |
|---|---|---|---|---|
| Chapecó (4204202) | 1 | 0 | 0 | 1 |
| Joaçaba (4209003) | 0 | 0 | 0 | 0 |

Meta: subir odonto/fono/reabilitacao onde houver centro SUS nomeado (CEO/CER/CLEO em Chapecó), mantendo privados de fora.

---

## Task 1: Refinar `inferServicos` na Edge Function

**File:** `supabase/functions/importar-municipio/cnes.ts`

**Implementation:** substituir a função `inferServicos` inteira por:
```typescript
export function inferServicos(e: EstabNormalizado): string[] {
  const servicos = new Set<string>(SERVICOS_POR_TIPO.get(e._codigoTipoUnidade) ?? []);

  const tipoDesc = normalizeText(e.tipo);
  const textoNome = normalizeText([e.nome, e.nome_fantasia, e._raw?.nome_razao_social].join(" "));

  // ── 1) Estrutural por TIPO de unidade (unidades SUS por natureza) ──
  if (/\b(UNIDADE BASICA|CENTRO DE SAUDE|POSTO DE SAUDE)\b/.test(tipoDesc)
      || /\b(UBS|POSTO DE SAUDE|SAUDE DA FAMILIA|ESF)\b/.test(textoNome)) {
    servicos.add("atencao_basica");
    servicos.add("vacina");
    servicos.add("prenatal");
  }
  if (/CENTRO DE ATENCAO PSICOSSOCIAL/.test(tipoDesc)
      || /\bCAPS\b|PSICOSSOCIAL|SAUDE MENTAL/.test(textoNome)) {
    servicos.add("saude_mental");
  }
  if (/\bFARMAC/.test(tipoDesc) || /\bFARMAC/.test(textoNome)) {
    servicos.add("farmacia");
  }

  // ── 2) Especialidade por NOME, com gate SUS honesto ──
  // So inclui se o estabelecimento atende SUS ambulatorial OU tem marca publica
  // no nome. Exclui consultorios/clinicas privadas (atende_sus=NAO).
  const atendeSus = normalizeText(e._raw?.estabelecimento_faz_atendimento_ambulatorial_sus) === "SIM";
  const nomePublico = /\b(MUNICIPAL|PREFEITURA|SECRETARIA|ESTADUAL|FEDERAL|\bSUS\b)\b/.test(textoNome);
  const ehSus = atendeSus || nomePublico;

  if (ehSus && /\b(ODONTO|SAUDE BUCAL|\bCEO\b)\b/.test(textoNome)) servicos.add("odonto_esp");
  if (ehSus && /\b(FONO|FONOAUDIO)\b/.test(textoNome)) servicos.add("fono");
  if (ehSus && /(FISIOTER|REABIL|\bCER\b)/.test(textoNome)) servicos.add("reabilitacao");

  // dependencia: CAPS AD / alcool / drogas
  if (/\bCAPS\b.*\b(AD|ALCOOL|DROG)\b|DEPENDENCIA QUIMICA/.test(textoNome)) {
    servicos.add("dependencia");
  }

  return [...servicos];
}
```
> Mantém `SERVICOS_POR_TIPO` (numérico) como semente inicial. `normalizeText` já existe no arquivo (remove acento + upper).

**Verification:**
```bash
cd conecta-sus-app
deno check supabase/functions/importar-municipio/cnes.ts
# Esperado: sem erros de tipo
```

**Commit:** `feat(edge): heuristica CNES por tipo + especialidade com gate SUS`

---

## Task 2: Espelhar a mesma heurística no script local

**File:** `scripts/import-cnes.mjs`

**Implementation:** substituir a função `inferServicos` (a versão JS atual) pela mesma lógica, adaptada ao shape do script (campos via `estabelecimento.*` e `estabelecimento._raw.*`, sem tipos TS):
```javascript
function inferServicos(estabelecimento) {
  const servicos = new Set(SERVICOS_POR_TIPO.get(estabelecimento._codigoTipoUnidade) ?? []);

  const tipoDesc = normalizeText(estabelecimento.tipo);
  const textoNome = normalizeText(
    [
      estabelecimento.nome,
      estabelecimento.nome_fantasia,
      estabelecimento._raw?.nome_razao_social,
    ].join(" "),
  );

  // 1) Estrutural por TIPO
  if (/\b(UNIDADE BASICA|CENTRO DE SAUDE|POSTO DE SAUDE)\b/.test(tipoDesc)
      || /\b(UBS|POSTO DE SAUDE|SAUDE DA FAMILIA|ESF)\b/.test(textoNome)) {
    servicos.add("atencao_basica");
    servicos.add("vacina");
    servicos.add("prenatal");
  }
  if (/CENTRO DE ATENCAO PSICOSSOCIAL/.test(tipoDesc)
      || /\bCAPS\b|PSICOSSOCIAL|SAUDE MENTAL/.test(textoNome)) {
    servicos.add("saude_mental");
  }
  if (/\bFARMAC/.test(tipoDesc) || /\bFARMAC/.test(textoNome)) {
    servicos.add("farmacia");
  }

  // 2) Especialidade por NOME com gate SUS
  const atendeSus = normalizeText(
    estabelecimento._raw?.estabelecimento_faz_atendimento_ambulatorial_sus,
  ) === "SIM";
  const nomePublico = /\b(MUNICIPAL|PREFEITURA|SECRETARIA|ESTADUAL|FEDERAL|\bSUS\b)\b/.test(textoNome);
  const ehSus = atendeSus || nomePublico;

  if (ehSus && /\b(ODONTO|SAUDE BUCAL|\bCEO\b)\b/.test(textoNome)) servicos.add("odonto_esp");
  if (ehSus && /\b(FONO|FONOAUDIO)\b/.test(textoNome)) servicos.add("fono");
  if (ehSus && /(FISIOTER|REABIL|\bCER\b)/.test(textoNome)) servicos.add("reabilitacao");

  if (/\bCAPS\b.*\b(AD|ALCOOL|DROG)\b|DEPENDENCIA QUIMICA/.test(textoNome)) {
    servicos.add("dependencia");
  }

  return [...servicos];
}
```

**Verification:**
```bash
cd conecta-sus-app
node --check scripts/import-cnes.mjs
# Esperado: sem saída (sintaxe OK)
```

**Commit:** `feat(import): espelha heuristica refinada no script local`

---

## Task 3: Redeploy + re-ingestão + verificação antes/depois

**Ação (CLI já logado):**
```bash
cd conecta-sus-app
npx supabase functions deploy importar-municipio --project-ref eydegpjzlxuxttzoinnh
```
Zerar cache dos 2 municípios (via MCP supabase-db):
```sql
update municipios set importado_em = null where codigo_ibge in ('4204202','4209003');
```
Disparar re-ingestão dos 2 (curl, header apikey):
```bash
for IBGE in 4204202 4209003; do
  curl -s -X POST "https://eydegpjzlxuxttzoinnh.supabase.co/functions/v1/importar-municipio" \
    -H "apikey: sb_publishable_dI6fb2JixVX0UrNeP_ULGg_Vvv2Q7YX" \
    -H "Content-Type: application/json" -d "{\"codigo_ibge\":\"$IBGE\"}"; echo;
done
# Esperado: cada um retorna {"status":"ok","importados":N,"vinculos":M} com M maior que antes
```

**Verification (via MCP):**
```sql
select m.nome, es.servico_codigo, count(distinct e.id) as ativos
from estabelecimentos e
join municipios m on m.id=e.municipio_id and m.codigo_ibge in ('4204202','4209003')
join estabelecimento_servicos es on es.estabelecimento_id=e.id
where e.ativo
group by m.nome, es.servico_codigo
order by m.nome, ativos desc;
-- Esperado Chapecó: odonto_esp >= 1 (CEO), reabilitacao >= 1 (CER/CLEO), e UBS/farmacia/saude_mental mantidos.
-- Esperado: NENHUM consultorio privado (CONSULTORIO ISOLADO sem atende_sus) vinculado a fono/fisio/odonto.

-- Conferir honestidade: estabelecimentos privados de fisio/odonto NAO devem ter servico
select e.nome, e.tipo
from estabelecimentos e
join municipios m on m.id=e.municipio_id and m.codigo_ibge='4204202'
join estabelecimento_servicos es on es.estabelecimento_id=e.id and es.servico_codigo in ('odonto_esp','fono','reabilitacao')
where e.ativo
order by e.nome;
-- Esperado: só nomes com cara de SUS (CEO/CENTRO ESPECIALIZADO/MUNICIPAL), nada de "CLINICA X PILATES".
```

**Commit:** (sem código — deploy + dados. Documentar resultado no Obsidian.)

---

## Riscos / decisões

- **Honestidade > recall:** o gate `ehSus` exclui de propósito clínicas privadas. Melhor mostrar menos do que mostrar serviço pago como se fosse grátis.
- **Limite intrínseco:** fono/fisio embutidos em UBS/policlínica sem nome específico continuam invisíveis (CNES /estabelecimentos não traz especialidade). Aceito; melhoria futura = endpoint de serviços especializados por estabelecimento (caro, fora do pitch).
- **Re-ingestão sobrescreve vínculos** desses municípios (delete+insert no edge) — idempotente.
- Manter as 2 cópias em sincronia (edge + script) — TODO futuro: extrair p/ módulo único.

## Execution Options

1. **Inline** (recomendado) — `/executing-plans`: Claude edita os 2 arquivos, deploya, re-ingere e verifica.
2. Subagent — desnecessário (mudança contida).

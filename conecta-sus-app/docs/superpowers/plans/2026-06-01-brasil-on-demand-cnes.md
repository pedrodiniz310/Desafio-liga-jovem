# Brasil On-Demand (Ingestão CNES por Município) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans.

**Goal:** Fazer o "Tem no SUS!" funcionar em qualquer lugar do Brasil: o GPS do usuário resolve o município mais próximo (PostGIS), e se ele ainda não tem dados, uma Edge Function baixa o CNES daquele município sob demanda e cacheia.

**Architecture:** Tabela `municipios` é semeada com os 5.570 municípios brasileiros (centroide + `geography`). Uma RPC `municipio_mais_proximo(lat,lng)` resolve coords → município via `st_distance` (sem geocoder externo). O app, ao obter GPS, resolve o município, atualiza o nome no header e — se `importado_em` for nulo — invoca a Edge Function `importar-municipio` (Deno, service-role) que porta a lógica do `scripts/import-cnes.mjs`, baixa o CNES do município, faz upsert de `estabelecimentos` + `estabelecimento_servicos` e marca `importado_em`. A busca (`buscar_servicos`) já é geográfica e não muda.

**Tech Stack:** Supabase (Postgres 17 + PostGIS, Edge Functions/Deno), Expo SDK 54 / React Native, TypeScript, React Query, `expo-location`.

**Projeto Supabase:** ref `eydegpjzlxuxttzoinnh` — confirmar antes de qualquer SQL/deploy (existe 2º projeto BlindAR na conta).

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `supabase/migrations/0014_municipios_brasil.sql` | **criar** — colunas centroide + `importado_em` em `municipios`, índice GiST, RPC `municipio_mais_proximo`, grants |
| `scripts/seed-municipios.mjs` | **criar** — baixa CSV dos 5.570 municípios e faz upsert em `municipios` |
| `supabase/functions/importar-municipio/index.ts` | **criar** — Edge Function Deno (porta do import-cnes core) |
| `supabase/functions/importar-municipio/cnes.ts` | **criar** — helpers de fetch/normalize/inferência de serviço (compartilhável/testável) |
| `src/lib/queries/use-municipio-ativo.ts` | **criar** — hook: resolve município + dispara ingest |
| `src/types/models.ts` | **editar** — tipo `MunicipioProximo` |
| `src/stores/use-localizacao.tsx` | **editar** — guardar `codigoIbge` do município ativo |
| `src/app/(tabs)/index.tsx` | **editar** — wire do hook + banner de loading "Carregando serviços da sua cidade…" |
| `scripts/flow-e2e.mjs` | **editar** — etapa que valida resolução de município/estado de carga |

> `buscar_servicos` (migration 0012) **não muda** — já é geográfica.

---

## Pré-requisito 0: confirmar projeto Supabase e CLI

**Verification (rodar e conferir ANTES de qualquer task):**
```bash
# (a) MCP supabase-db aponta pro projeto certo (deve listar necessidades=ubs etc. de Tem no SUS)
#     via MCP: select current_database(), (select count(*) from municipios) as munis;
#     Esperado: poucos municípios hoje (só Joaçaba) — confirma projeto Tem no SUS.

# (b) Supabase CLI instalado? (necessário pra deploy da Edge Function na Task 5)
npx supabase --version
# Se falhar: npm i -g supabase  (ou usar npx supabase em todos os comandos)
```
Se o MCP mostrar um banco que NÃO tem a tabela `necessidades` com slug `ubs`, PARE — é o projeto errado (BlindAR).

---

## Task 1: Migration — centroide, cache e RPC de município mais próximo

**File:** `supabase/migrations/0014_municipios_brasil.sql`

**Implementation:**
```sql
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
create or replace function municipio_mais_proximo(
  lat double precision,
  lng double precision
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
           st_setsrid(st_makepoint(lng, lat), 4326)::geography
         ) / 1000)::numeric, 1)::double precision as distancia_km
  from municipios m
  where m.localizacao is not null
  order by m.localizacao <-> st_setsrid(st_makepoint(lng, lat), 4326)::geography
  limit 1;
$$;

grant execute on function municipio_mais_proximo(double precision, double precision)
  to anon, authenticated;
grant select on municipios to anon, authenticated;

-- RLS de leitura publica em municipios (caso ainda nao exista).
alter table municipios enable row level security;
drop policy if exists "leitura publica municipios" on municipios;
create policy "leitura publica municipios" on municipios for select using (true);
```

**Verification (SQL via MCP supabase-db):**
```sql
-- coluna e RPC existem
select column_name from information_schema.columns
where table_name='municipios' and column_name in ('lat','lng','localizacao','importado_em');
-- Esperado: 4 linhas

-- RPC roda (ainda sem centroides => 0 linhas é OK neste ponto)
select * from municipio_mais_proximo(-27.1768, -51.5052);
-- Esperado: 0 linhas agora (Task 2 popula). Não deve dar erro.
```

**Commit:** `feat(db): municipios com centroide + RPC municipio_mais_proximo`

---

## Task 2: Seed dos 5.570 municípios brasileiros

**File:** `scripts/seed-municipios.mjs`

**Contexto:** dataset público com `codigo_ibge,nome,latitude,longitude,...,uf` (7 dígitos IBGE). Fonte raw: `https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv`. Colunas relevantes: `codigo_ibge`, `nome`, `latitude`, `longitude`, `codigo_uf`. A UF (sigla) vem do `codigo_uf` (1–2 dígitos) → mapear via tabela fixa de 27 UFs.

**Implementation:**
```javascript
#!/usr/bin/env node
// Semeia a tabela `municipios` com os 5.570 municipios do Brasil (centroide).
// Fonte: kelvins/municipios-brasileiros (CSV publico). Usa SERVICE_ROLE_KEY.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const CSV_URL =
  "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv";

const UF_POR_CODIGO = {
  11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
  21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL",
  28: "SE", 29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR",
  42: "SC", 43: "RS", 50: "MS", 51: "MT", 52: "GO", 53: "DF",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

main().catch((e) => { console.error(`Falha seed municipios: ${e.message}`); process.exit(1); });

async function main() {
  loadEnv(path.join(projectRoot, ".env"));
  const dryRun = process.argv.includes("--dry-run");

  const csv = await (await fetch(CSV_URL)).text();
  const linhas = csv.trim().split(/\r?\n/);
  const header = linhas[0].split(",").map((c) => c.trim());
  const idx = (nome) => header.indexOf(nome);
  const iCodigo = idx("codigo_ibge");
  const iNome = idx("nome");
  const iLat = idx("latitude");
  const iLng = idx("longitude");
  const iUf = idx("codigo_uf");
  if ([iCodigo, iNome, iLat, iLng, iUf].some((i) => i < 0)) {
    throw new Error(`CSV sem colunas esperadas. Header: ${header.join(",")}`);
  }

  const municipios = linhas.slice(1).map((linha) => {
    const cols = parseCsvLine(linha);
    return {
      codigo_ibge: String(cols[iCodigo]).replace(/\D/g, ""),
      nome: cols[iNome]?.replace(/^"|"$/g, "").trim(),
      uf: UF_POR_CODIGO[Number(cols[iUf])] ?? null,
      lat: Number(cols[iLat]),
      lng: Number(cols[iLng]),
    };
  }).filter((m) => /^\d{7}$/.test(m.codigo_ibge) && m.uf && Number.isFinite(m.lat) && Number.isFinite(m.lng));

  console.log(`Municipios parseados: ${municipios.length} (esperado ~5570)`);
  if (dryRun) { console.log(municipios.slice(0, 3)); return; }

  const supabase = createAdmin();
  for (const chunk of chunks(municipios, 500)) {
    const { error } = await supabase
      .from("municipios")
      .upsert(chunk, { onConflict: "codigo_ibge" });
    if (error) throw error;
  }
  console.log(`Upsert concluido: ${municipios.length} municipios.`);
}

function parseCsvLine(linha) {
  // CSV simples do dataset (sem virgulas dentro de campos numericos);
  // nome pode ter acento mas nao virgula. Split direto é seguro aqui.
  return linha.split(",");
}

function createAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function* chunks(arr, n) { for (let i = 0; i < arr.length; i += n) yield arr.slice(i, i + n); }

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    if (k && process.env[k] == null) process.env[k] = v;
  }
}
```

Adicionar ao `package.json` scripts: `"seed:municipios": "node ./scripts/seed-municipios.mjs"`.

**Verification:**
```bash
cd conecta-sus-app
node ./scripts/seed-municipios.mjs --dry-run
# Esperado: "Municipios parseados: 5570" (ou ~5570) + amostra de 3 com lat/lng/uf

node ./scripts/seed-municipios.mjs
# Esperado: "Upsert concluido: 5570 municipios."
```
```sql
-- via MCP: resolução funciona pra coords reais
select * from municipio_mais_proximo(-23.5505, -46.6333);  -- centro de SP
-- Esperado: codigo_ibge 3550308, nome 'São Paulo', uf 'SP'
select * from municipio_mais_proximo(-27.1768, -51.5052);  -- Joaçaba
-- Esperado: codigo_ibge 4209003, nome 'Joaçaba', uf 'SC'
```

**Commit:** `feat(data): seed dos 5.570 municipios do Brasil com centroide`

---

## Task 3: Helpers CNES da Edge Function (lógica portada + testável)

**File:** `supabase/functions/importar-municipio/cnes.ts`

**Contexto:** porta as funções puras do `scripts/import-cnes.mjs` (normalize + inferência de serviço) para TS/Deno. Sem dependências de Node (`fetch` é global no Deno). Mantém EXATAMENTE as mesmas heurísticas do script atual.

**Implementation:**
```typescript
// Helpers puros de normalizacao/inferencia CNES (portados de scripts/import-cnes.mjs).
export const API_BASE = "https://apidadosabertos.saude.gov.br/cnes";
export const FONTE_DADOS = "CNES/DATASUS API Dados Abertos";
export const PAGE_LIMIT = 100; // maior que o script (20) p/ caber no tempo da Edge Function

const SERVICOS_POR_TIPO = new Map<number, string[]>([
  [43, ["farmacia"]],
  [70, ["saude_mental"]],
  [71, ["atencao_basica"]],
]);

export interface EstabNormalizado {
  cnes_id: string;
  nome: string;
  nome_fantasia: string | null;
  tipo: string | null;
  endereco: string | null;
  bairro: string | null;
  telefone: string | null;
  horario: string | null;
  lat: number | null;
  lng: number | null;
  ativo: boolean;
  fonte_dados: string;
  competencia_cnes: string | null;
  geocoding_status: string;
  _codigoTipoUnidade: number;
  _raw: Record<string, unknown>;
}

export async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.json();
}

export async function fetchTiposUnidade(): Promise<any[]> {
  const json = await fetchJson(`${API_BASE}/tipounidades`);
  return json.tipos_unidade ?? [];
}

export async function fetchEstabelecimentos(codigoMunicipioCnes: string): Promise<any[]> {
  const rows: any[] = [];
  let offset = 0;
  while (true) {
    const params = new URLSearchParams({
      codigo_municipio: codigoMunicipioCnes,
      limit: String(PAGE_LIMIT),
      offset: String(offset),
    });
    const json = await fetchJson(`${API_BASE}/estabelecimentos?${params}`);
    const batch = json.estabelecimentos ?? [];
    if (batch.length === 0) break;
    rows.push(...batch);
    offset += batch.length;
    if (batch.length < PAGE_LIMIT) break;
  }
  return rows;
}

export function normalizeEstabelecimento(
  row: any,
  tiposPorCodigo: Map<number, any>,
): EstabNormalizado {
  const codigoTipo = Number(row.codigo_tipo_unidade);
  const tipo = tiposPorCodigo.get(codigoTipo);
  const cnesId = String(row.codigo_cnes).padStart(7, "0");
  const lat = toNumber(row.latitude_estabelecimento_decimo_grau);
  const lng = toNumber(row.longitude_estabelecimento_decimo_grau);
  return {
    cnes_id: cnesId,
    nome: clean(row.nome_fantasia) || clean(row.nome_razao_social) || `CNES ${cnesId}`,
    nome_fantasia: clean(row.nome_fantasia),
    tipo: clean(tipo?.descricao_tipo_unidade) || String(row.codigo_tipo_unidade ?? ""),
    endereco: joinAddress(row.endereco_estabelecimento, row.numero_estabelecimento),
    bairro: clean(row.bairro_estabelecimento),
    telefone: formatPhone(row.numero_telefone_estabelecimento),
    horario: clean(row.descricao_turno_atendimento),
    lat,
    lng,
    ativo: row.codigo_motivo_desabilitacao_estabelecimento == null,
    fonte_dados: FONTE_DADOS,
    competencia_cnes: normalizeDate(row.data_atualizacao),
    geocoding_status: lat != null && lng != null ? "coordenada_cnes" : "sem_coordenada",
    _codigoTipoUnidade: codigoTipo,
    _raw: row,
  };
}

export function inferServicos(e: EstabNormalizado): string[] {
  const servicos = new Set<string>(SERVICOS_POR_TIPO.get(e._codigoTipoUnidade) ?? []);
  const textoNome = normalizeText([e.nome, e.nome_fantasia, (e._raw as any)?.nome_razao_social].join(" "));
  const texto = normalizeText([textoNome, e.tipo].join(" "));
  const atendeSus = normalizeText((e._raw as any)?.estabelecimento_faz_atendimento_ambulatorial_sus) === "SIM";
  const nomeSugerePublico =
    /\b(CAPS|CEO|CER|UBS|UNIDADE BASICA|POSTO DE SAUDE|MUNICIPAL|PREFEITURA|SECRETARIA)\b/.test(textoNome);
  const permite = atendeSus || nomeSugerePublico;

  if (/\bCAPS\b|PSICOSSOCIAL|SAUDE MENTAL/.test(texto)) servicos.add("saude_mental");
  if (/\bCAPS\b.*\b(AD|ALCOOL|DROG)|DEPENDENCIA QUIMICA/.test(texto)) servicos.add("dependencia");
  if (/\bFARMAC/.test(texto)) servicos.add("farmacia");
  if (/\b(UBS|UNIDADE BASICA|POSTO DE SAUDE|SAUDE DA FAMILIA|ESF)\b/.test(textoNome)) {
    servicos.add("atencao_basica"); servicos.add("vacina"); servicos.add("prenatal");
  }
  if (permite && /\b(CEO|ODONTO|SAUDE BUCAL)\b/.test(texto)) servicos.add("odonto_esp");
  if (permite && /\b(FONO|FONOAUDIO)\b/.test(texto)) servicos.add("fono");
  if (permite && /\b(CER|REABIL|FISIOTER)\b/.test(texto)) servicos.add("reabilitacao");
  return [...servicos];
}

export function uniqueByCnes(rows: EstabNormalizado[]): EstabNormalizado[] {
  const map = new Map<string, EstabNormalizado>();
  for (const r of rows) map.set(r.cnes_id, r);
  return [...map.values()];
}

function toNumber(v: unknown): number | null { const n = Number(v); return Number.isFinite(n) ? n : null; }
function clean(v: unknown): string | null { if (v == null) return null; const t = String(v).trim().replace(/\s+/g, " "); return t.length ? t : null; }
function joinAddress(l: unknown, n: unknown): string | null { const s = clean(l), num = clean(n); return s && num ? `${s}, ${num}` : (s ?? num); }
function normalizeDate(v: unknown): string | null { if (!v) return null; const t = String(v).slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null; }
function formatPhone(v: unknown): string | null {
  const d = String(v ?? "").replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  return clean(v);
}
function normalizeText(v: unknown): string {
  return String(v ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
}
```

**Verification:**
```bash
# Deno disponivel? (vem com supabase functions; senao instalar)
deno --version || echo "instalar Deno: https://deno.land"
# Checagem de sintaxe/typecheck do helper
cd conecta-sus-app && deno check supabase/functions/importar-municipio/cnes.ts
# Esperado: sem erros de tipo
```

**Commit:** `feat(edge): helpers CNES portados para Deno`

---

## Task 4: Edge Function `importar-municipio`

**File:** `supabase/functions/importar-municipio/index.ts`

**Contexto:** recebe `{ codigo_ibge }` (7 díg). Resolve `codigo_municipio` CNES = 6 primeiros díg. Se `municipios.importado_em` foi setado nas últimas 24h, retorna cache hit sem refazer. Senão baixa + upsert + seta `importado_em`. Usa `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` do ambiente da function (injetados pelo Supabase). Desativa SEED% só na primeira ingestão real global (mantém comportamento do script: ao entrar dado oficial, seeds saem).

**Implementation:**
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  FONTE_DADOS, fetchTiposUnidade, fetchEstabelecimentos,
  normalizeEstabelecimento, inferServicos, uniqueByCnes,
} from "./cnes.ts";

const CACHE_HORAS = 24;

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { codigo_ibge } = await req.json();
    const ibge = String(codigo_ibge ?? "").replace(/\D/g, "");
    if (!/^\d{7}$/.test(ibge)) {
      return json({ erro: "codigo_ibge invalido (7 digitos)" }, 400, cors);
    }
    const codigoMunicipioCnes = ibge.slice(0, 6);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Cache: ja importado nas ultimas CACHE_HORAS?
    const { data: muni } = await supabase
      .from("municipios").select("id, nome, uf, importado_em")
      .eq("codigo_ibge", ibge).maybeSingle();
    if (muni?.importado_em) {
      const horas = (Date.now() - new Date(muni.importado_em).getTime()) / 3.6e6;
      if (horas < CACHE_HORAS) {
        return json({ status: "cache", codigo_ibge: ibge, importados: 0 }, 200, cors);
      }
    }

    const [tipos, estabApi] = await Promise.all([
      fetchTiposUnidade(),
      fetchEstabelecimentos(codigoMunicipioCnes),
    ]);
    const tiposPorCodigo = new Map(tipos.map((t: any) => [Number(t.codigo_tipo_unidade), t]));
    const estabs = uniqueByCnes(
      estabApi
        .filter((r: any) => String(r.codigo_municipio) === codigoMunicipioCnes)
        .map((r: any) => normalizeEstabelecimento(r, tiposPorCodigo)),
    );

    // municipio_id (upsert garante existencia mesmo se centroide ainda nao semeado)
    const { data: muniUp, error: muniErr } = await supabase
      .from("municipios")
      .upsert({ codigo_ibge: ibge, nome: muni?.nome ?? `IBGE ${ibge}`, uf: muni?.uf ?? "BR" }, { onConflict: "codigo_ibge" })
      .select("id").single();
    if (muniErr) throw muniErr;
    const municipioId = muniUp.id;

    // upsert estabelecimentos
    const rows = estabs.map((e) => ({
      cnes_id: e.cnes_id, nome: e.nome, nome_fantasia: e.nome_fantasia, tipo: e.tipo,
      endereco: e.endereco, bairro: e.bairro, telefone: e.telefone, horario: e.horario,
      municipio_id: municipioId, lat: e.lat, lng: e.lng, ativo: e.ativo,
      atualizado_em: new Date().toISOString(), fonte_dados: e.fonte_dados,
      competencia_cnes: e.competencia_cnes, importado_em: new Date().toISOString(),
      geocoding_status: e.geocoding_status,
    }));
    for (const c of chunk(rows, 500)) {
      const { error } = await supabase.from("estabelecimentos").upsert(c, { onConflict: "cnes_id" });
      if (error) throw error;
    }

    // ids por cnes
    const idPorCnes = new Map<string, number>();
    for (const c of chunk(rows.map((r) => r.cnes_id), 200)) {
      const { data, error } = await supabase.from("estabelecimentos").select("id, cnes_id").in("cnes_id", c);
      if (error) throw error;
      for (const r of data ?? []) idPorCnes.set(r.cnes_id, r.id);
    }

    // substitui vinculos de servico desses estabelecimentos
    const ids = [...idPorCnes.values()];
    for (const c of chunk(ids, 200)) {
      const { error } = await supabase.from("estabelecimento_servicos").delete().in("estabelecimento_id", c);
      if (error) throw error;
    }
    const vinculos: { estabelecimento_id: number; servico_codigo: string }[] = [];
    for (const e of estabs) {
      const id = idPorCnes.get(e.cnes_id);
      if (!id) continue;
      for (const servico_codigo of inferServicos(e)) vinculos.push({ estabelecimento_id: id, servico_codigo });
    }
    for (const c of chunk(vinculos, 500)) {
      if (c.length === 0) continue;
      const { error } = await supabase.from("estabelecimento_servicos").upsert(c);
      if (error) throw error;
    }

    // primeira ingestao oficial global => desativa seeds de prototipo
    if (rows.length > 0) {
      await supabase.from("estabelecimentos").update({ ativo: false }).like("cnes_id", "SEED%");
    }

    // marca cache
    await supabase.from("municipios").update({ importado_em: new Date().toISOString() }).eq("codigo_ibge", ibge);

    return json({ status: "ok", codigo_ibge: ibge, importados: rows.length, vinculos: vinculos.length }, 200, cors);
  } catch (e) {
    return json({ erro: String(e?.message ?? e) }, 500, {
      "Access-Control-Allow-Origin": "*",
    });
  }
});

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
function* chunk<T>(arr: T[], n: number): Generator<T[]> { for (let i = 0; i < arr.length; i += n) yield arr.slice(i, i + n); }
```

**Verification:**
```bash
cd conecta-sus-app
# Confirmar projeto antes de deploy:
npx supabase projects list   # confirmar ref eydegpjzlxuxttzoinnh
npx supabase functions deploy importar-municipio --project-ref eydegpjzlxuxttzoinnh
# Esperado: "Deployed Function importar-municipio"

# Testar com um municipio pequeno (Joaçaba) — usar ANON key do .env:
curl -s -X POST \
  "https://eydegpjzlxuxttzoinnh.supabase.co/functions/v1/importar-municipio" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"codigo_ibge":"4209003"}'
# Esperado: {"status":"ok","codigo_ibge":"4209003","importados": >0, ...}

# Testar um municipio NOVO (ex.: Chapecó 4204202):
#   -d '{"codigo_ibge":"4204202"}'  => importados > 0
```
```sql
-- via MCP: municipio novo passou a ter estabelecimentos ativos
select count(*) from estabelecimentos e
join municipios m on m.id = e.municipio_id
where m.codigo_ibge = '4204202' and e.ativo;
-- Esperado: > 0
```

**Commit:** `feat(edge): Edge Function importar-municipio (ingestao CNES on-demand)`

---

## Task 5: Tipo + store guardam o município ativo

**File 1:** `src/types/models.ts` — adicionar:
```typescript
export interface MunicipioProximo {
  codigo_ibge: string;
  nome: string;
  uf: string;
  importado_em: string | null;
  distancia_km: number;
}
```

**File 2:** `src/stores/use-localizacao.tsx` — guardar codigoIbge ativo. Substituir o corpo do provider para incluir `codigoIbge`:
```tsx
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Coordenada } from "@/types/models";

export const JOACABA: Coordenada = { lat: -27.1771, lng: -51.5045 };

type LocalizacaoState = {
  coordenada: Coordenada | null;
  municipioNome: string;
  codigoIbge: string | null;
  permissaoNegada: boolean;
  setCoordenada: (c: Coordenada) => void;
  setMunicipio: (nome: string, codigoIbge?: string) => void;
  setPermissaoNegada: (v: boolean) => void;
};

const LocalizacaoContext = createContext<LocalizacaoState | undefined>(undefined);

export function LocalizacaoProvider({ children }: { children: ReactNode }) {
  const [coordenada, setCoordenada] = useState<Coordenada | null>(null);
  const [municipioNome, setMunicipioNome] = useState("Carregando…");
  const [codigoIbge, setCodigoIbge] = useState<string | null>(null);
  const [permissaoNegada, setPermissaoNegada] = useState(false);

  const setMunicipio = useCallback((nome: string, ibge?: string) => {
    setMunicipioNome(nome);
    if (ibge) setCodigoIbge(ibge);
  }, []);
  const setCoordenadaCb = useCallback((c: Coordenada) => setCoordenada(c), []);
  const setPermissaoNegadaCb = useCallback((v: boolean) => setPermissaoNegada(v), []);

  return (
    <LocalizacaoContext.Provider
      value={{
        coordenada, municipioNome, codigoIbge, permissaoNegada,
        setCoordenada: setCoordenadaCb, setMunicipio, setPermissaoNegada: setPermissaoNegadaCb,
      }}
    >
      {children}
    </LocalizacaoContext.Provider>
  );
}

export function useLocalizacao(): LocalizacaoState {
  const ctx = useContext(LocalizacaoContext);
  if (!ctx) throw new Error("useLocalizacao must be used inside LocalizacaoProvider");
  return ctx;
}
```
> Nota: `municipioNome` inicial vira "Carregando…" (antes era "Joaçaba · SC"). O hook da Task 6 seta o nome real assim que resolve; se GPS negado, o fallback Joaçaba é resolvido também (coords JOACABA).

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros (setMunicipio com 2º arg opcional não quebra chamadas existentes)
```

**Commit:** `feat(localizacao): store guarda codigo_ibge do municipio ativo`

---

## Task 6: Hook `use-municipio-ativo` (resolve + dispara ingest)

**File:** `src/lib/queries/use-municipio-ativo.ts`

**Contexto:** dada uma coordenada, (1) resolve município via RPC, (2) atualiza nome/ibge no store, (3) se `importado_em` nulo, invoca a Edge Function e espera concluir. Expõe `carregandoCidade` para a UI mostrar o banner. Reusa React Query.

**Implementation:**
```typescript
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocalizacao } from "@/stores/use-localizacao";
import type { Coordenada, MunicipioProximo } from "@/types/models";

type Estado = "ocioso" | "resolvendo" | "importando" | "pronto" | "erro";

export function useMunicipioAtivo(coordenada: Coordenada) {
  const { setMunicipio } = useLocalizacao();
  const [estado, setEstado] = useState<Estado>("ocioso");

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setEstado("resolvendo");
        const { data, error } = await supabase.rpc("municipio_mais_proximo", {
          lat: coordenada.lat,
          lng: coordenada.lng,
        });
        if (error) throw error;
        const muni = (data as MunicipioProximo[] | null)?.[0];
        if (!muni || !ativo) { setEstado("pronto"); return; }

        setMunicipio(`${muni.nome} · ${muni.uf}`, muni.codigo_ibge);

        if (!muni.importado_em) {
          setEstado("importando");
          const { error: fnErr } = await supabase.functions.invoke("importar-municipio", {
            body: { codigo_ibge: muni.codigo_ibge },
          });
          if (fnErr) throw fnErr;
        }
        if (ativo) setEstado("pronto");
      } catch {
        if (ativo) setEstado("erro");
      }
    })();
    return () => { ativo = false; };
    // re-resolve quando as coordenadas mudam de verdade
  }, [coordenada.lat, coordenada.lng, setMunicipio]);

  return {
    carregandoCidade: estado === "resolvendo" || estado === "importando",
    importando: estado === "importando",
    erro: estado === "erro",
  };
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
```

**Commit:** `feat(localizacao): hook use-municipio-ativo resolve e ingere sob demanda`

---

## Task 7: Wire na Home + banner de carregamento

**File:** `src/app/(tabs)/index.tsx`

**Mudança 7a — import do hook** (junto aos outros imports de queries):
```tsx
import { useMunicipioAtivo } from "@/lib/queries/use-municipio-ativo";
```

**Mudança 7b — chamar o hook** logo após `const coord = coordenada ?? JOACABA;`:
```tsx
  const coord = coordenada ?? JOACABA;
  const { carregandoCidade, importando } = useMunicipioAtivo(coord);
```

**Mudança 7c — banner de loading** dentro do hero, logo após o `<View style={styles.localRow}>…</View>` e antes do `{!buscando && (...)}`:
```tsx
        {carregandoCidade && (
          <View style={styles.cidadeBanner}>
            <ActivityIndicator size="small" color="#a8d5c4" />
            <Texto style={styles.cidadeBannerTexto}>
              {importando ? "Carregando serviços da sua cidade…" : "Localizando você…"}
            </Texto>
          </View>
        )}
```
(`ActivityIndicator` já está importado em index.tsx.)

**Mudança 7d — estilos** no `makeStyles`, junto de `localRow`:
```tsx
    cidadeBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(255,255,255,0.12)",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      marginBottom: 12,
    },
    cidadeBannerTexto: { fontSize: 13, color: "#a8d5c4", fontWeight: "600" },
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit && npx expo lint
# Esperado: 0 erros, 0 erros de lint
```

**Commit:** `feat(busca): resolve cidade do usuario e mostra carga sob demanda`

---

## Task 8: Verificação end-to-end + Playwright

**File:** `scripts/flow-e2e.mjs` — adicionar logo após o login/onboarding, antes da busca, uma verificação de que o nome de município resolveu (não fica "Carregando…").

**Implementation (trecho a inserir após chegar na home):**
```javascript
  // ── MUNICIPIO RESOLVIDO ──
  etapa = "municipio";
  // Geolocalizacao negada no contexto Playwright => fallback Joaçaba.
  // Espera o header sair de "Carregando…" para um nome de cidade real.
  await page.waitForFunctionUnsupported?.(() => true).catch(() => {});
  await page.waitForTimeout(4000); // resolucao RPC + possivel ingest
  const headerCidade = await page.getByText(/·\s*[A-Z]{2}\b/).first().count();
  console.log(`  header de cidade resolvido: ${headerCidade > 0 ? "OK ✓" : "AINDA CARREGANDO ✗"}`);
```
> Nota: no web export a geolocalização é negada → `coord = JOACABA` → RPC resolve Joaçaba/SC. O município de Joaçaba já estará `importado_em` (Task 4 testou), então não dispara nova ingestão e o header mostra "Joaçaba · SC".

**Verification (sequência completa):**
```bash
cd conecta-sus-app
npx tsc --noEmit && npx expo lint            # 0 erros
npx expo export -p web                        # compila
node ./scripts/flow-e2e.mjs                   # fluxo + "header de cidade resolvido: OK"
```
```sql
-- via MCP: prova de cobertura nacional — escolher 3 municipios de UFs diferentes
-- (rodar a Edge Function neles via curl antes, OU deixar o teste manual no device)
select m.uf, m.nome, count(e.id) filter (where e.ativo) as ativos
from municipios m
left join estabelecimentos e on e.municipio_id = m.id
where m.codigo_ibge in ('3550308','2304400','5300108')  -- SP, Fortaleza, Brasília
group by m.uf, m.nome;
-- Esperado (apos ingest de cada): ativos > 0 em cada um
```

Verificação manual no device (Expo Go), recomendada antes do pitch:
- Abrir o app com GPS real → header mostra a cidade correta.
- Buscar "UBS"/"dentista" → retorna serviços reais daquela cidade.
- 2ª abertura na mesma cidade → sem banner de carga (cache `importado_em`).

**Commit:** `test(e2e): valida resolucao de municipio no fluxo`

---

## Riscos & decisões registradas

- **Timeout da Edge Function (~150s):** capitais grandes (SP ~30k estab) podem demorar ou estourar. Mitigações já no plano: `PAGE_LIMIT=100`. Follow-up possível se estourar: filtrar `codigo_tipo_unidade` na query CNES (só 43/70/71 + tipos de CEO/CER) para reduzir volume, ou paginar em background. Documentar se ocorrer.
- **Município sem CNES mapeável:** `importados: 0` → busca cai no estado vazio honesto (já existe, com "ampliar raio" + sugestões). Sem crash.
- **Centroide vs polígono:** "mais próximo" pode pegar município vizinho perto de divisas. Aceitável — usuário quer serviço mais próximo de qualquer forma; o raio de busca cruza divisas.
- **Seeds:** a Edge Function desativa `SEED%` ao entrar dado oficial (mantém decisão de não exibir dados fictícios).
- **Abuso (juiz dispara muitos ingests):** aceitável para o pitch; cache de 24h em `importado_em` limita repetição.
- **Free tier storage:** on-demand só carrega municípios usados → cresce devagar. OK.

---

## Execution Options

1. **Subagent-Driven** (recomendado, pedido pelo usuário) — um subagente por task via `/subagent-driven-development`. Tasks 1→2→4 têm dependência de dados; 3 antes de 4; 5→6→7 são app; 8 fecha.
2. **Inline** — `/executing-plans` em lote.

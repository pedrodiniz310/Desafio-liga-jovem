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
  // deno-lint-ignore no-explicit-any
  _raw: Record<string, any>;
}

// deno-lint-ignore no-explicit-any
export async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.json();
}

// deno-lint-ignore no-explicit-any
export async function fetchTiposUnidade(): Promise<any[]> {
  const json = await fetchJson(`${API_BASE}/tipounidades`);
  return json.tipos_unidade ?? [];
}

// deno-lint-ignore no-explicit-any
export async function fetchEstabelecimentos(codigoMunicipioCnes: string): Promise<any[]> {
  // deno-lint-ignore no-explicit-any
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

// deno-lint-ignore no-explicit-any
export function normalizeEstabelecimento(row: any, tiposPorCodigo: Map<number, any>): EstabNormalizado {
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
  const textoNome = normalizeText([e.nome, e.nome_fantasia, e._raw?.nome_razao_social].join(" "));
  const texto = normalizeText([textoNome, e.tipo].join(" "));
  const atendeSus = normalizeText(e._raw?.estabelecimento_faz_atendimento_ambulatorial_sus) === "SIM";
  const nomeSugerePublico =
    /\b(CAPS|CEO|CER|UBS|UNIDADE BASICA|POSTO DE SAUDE|MUNICIPAL|PREFEITURA|SECRETARIA)\b/.test(textoNome);
  const permite = atendeSus || nomeSugerePublico;

  if (/\bCAPS\b|PSICOSSOCIAL|SAUDE MENTAL/.test(texto)) servicos.add("saude_mental");
  if (/\bCAPS\b.*\b(AD|ALCOOL|DROG)|DEPENDENCIA QUIMICA/.test(texto)) servicos.add("dependencia");
  if (/\bFARMAC/.test(texto)) servicos.add("farmacia");
  if (/\b(UBS|UNIDADE BASICA|POSTO DE SAUDE|SAUDE DA FAMILIA|ESF)\b/.test(textoNome)) {
    servicos.add("atencao_basica");
    servicos.add("vacina");
    servicos.add("prenatal");
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
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return clean(v);
}
function normalizeText(v: unknown): string {
  return String(v ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
}

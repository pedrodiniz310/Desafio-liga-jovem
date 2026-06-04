#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const API_BASE = "https://apidadosabertos.saude.gov.br/cnes";
const FONTE_DADOS = "CNES/DATASUS API Dados Abertos";
const BATCH_SIZE = 20;
const DEFAULTS = {
  codigoIbge: "4209003",
  municipio: "Joacaba",
  uf: "SC",
};

const SERVICOS_POR_TIPO = new Map([
  [43, ["farmacia"]],
  [70, ["saude_mental"]],
  [71, ["atencao_basica"]],
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Falha na importacao CNES: ${error.message}`);
    process.exit(1);
  });
}

async function main() {
  loadEnv(path.join(projectRoot, ".env"));
  const args = parseArgs(process.argv.slice(2));
  const escopo = normalizeScope(args);

  console.log(
    `Importacao CNES: ${escopo.municipio}/${escopo.uf} ` +
      `IBGE ${escopo.codigoIbge} (CNES ${escopo.codigoMunicipioCnes})`,
  );

  const [tiposUnidade, estabelecimentosApi] = await Promise.all([
    fetchTiposUnidade(),
    fetchEstabelecimentos(escopo.codigoMunicipioCnes),
  ]);

  const tiposPorCodigo = new Map(
    tiposUnidade.map((tipo) => [Number(tipo.codigo_tipo_unidade), tipo]),
  );

  const estabelecimentos = uniqueByCnes(
    estabelecimentosApi
      .filter((row) => String(row.codigo_municipio) === escopo.codigoMunicipioCnes)
      .map((row) => normalizeEstabelecimento(row, tiposPorCodigo)),
  );
  const vinculacoes = buildVinculacoes(estabelecimentos);
  const competencia = maxDate(estabelecimentos.map((e) => e.competencia_cnes));

  printSummary(estabelecimentos, vinculacoes, competencia, args.dryRun);

  if (args.dryRun) return;

  const supabase = createSupabaseAdminClient();
  let importacaoId = null;

  try {
    importacaoId = await criarImportacao(supabase, escopo, competencia);
    await inserirRaw(supabase, importacaoId, estabelecimentosApi, tiposUnidade);

    const municipioId = await upsertMunicipio(supabase, escopo);
    const importados = await upsertEstabelecimentos(
      supabase,
      estabelecimentos,
      municipioId,
    );
    await substituirVinculosServicos(supabase, importados, vinculacoes);

    if (!args.keepSeeds && importados.length > 0) {
      await desativarSeeds(supabase);
    }

    await finalizarImportacao(supabase, importacaoId, {
      status: "concluida",
      registros_lidos: estabelecimentosApi.length,
      registros_importados: importados.length,
      registros_com_erro: 0,
      observacoes: {
        seeds_desativados: !args.keepSeeds && importados.length > 0,
        vinculacoes_servicos: vinculacoes.length,
      },
    });

    console.log(`Importacao concluida: ${importados.length} estabelecimentos atualizados.`);
  } catch (error) {
    if (importacaoId) {
      await finalizarImportacao(supabase, importacaoId, {
        status: "falhou",
        registros_lidos: estabelecimentosApi.length,
        registros_importados: 0,
        registros_com_erro: estabelecimentos.length,
        observacoes: { erro: error.message },
      }).catch(() => {});
    }
    throw error;
  }
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    keepSeeds: false,
    codigoIbge: DEFAULTS.codigoIbge,
    municipio: DEFAULTS.municipio,
    uf: DEFAULTS.uf,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--keep-seeds") args.keepSeeds = true;
    else if (arg.startsWith("--codigo-ibge=")) args.codigoIbge = arg.split("=")[1];
    else if (arg.startsWith("--municipio=")) args.municipio = arg.split("=")[1];
    else if (arg.startsWith("--uf=")) args.uf = arg.split("=")[1].toUpperCase();
    else if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Uso:
  npm run import:cnes -- [opcoes]

Opcoes:
  --dry-run                 Baixa e normaliza dados sem escrever no Supabase
  --keep-seeds              Mantem estabelecimentos SEED% ativos apos importar
  --codigo-ibge=4209003    Codigo IBGE de 7 digitos do municipio
  --municipio=Joacaba      Nome do municipio para registrar no banco
  --uf=SC                  UF do municipio`);
}

function normalizeScope(args) {
  const codigoIbge = onlyDigits(args.codigoIbge);
  if (!/^\d{7}$/.test(codigoIbge)) {
    throw new Error("Use --codigo-ibge com 7 digitos, ex.: 4209003.");
  }
  if (!/^[A-Z]{2}$/.test(args.uf)) {
    throw new Error("Use --uf com duas letras, ex.: SC.");
  }

  return {
    codigoIbge,
    codigoMunicipioCnes: codigoIbge.slice(0, 6),
    municipio: args.municipio,
    uf: args.uf,
  };
}

async function fetchTiposUnidade() {
  const json = await fetchJson(`${API_BASE}/tipounidades`);
  return json.tipos_unidade ?? [];
}

async function fetchEstabelecimentos(codigoMunicipioCnes) {
  const rows = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      codigo_municipio: codigoMunicipioCnes,
      limit: String(BATCH_SIZE),
      offset: String(offset),
    });
    const json = await fetchJson(`${API_BASE}/estabelecimentos?${params}`);
    const batch = json.estabelecimentos ?? [];
    if (batch.length === 0) break;

    rows.push(...batch);
    offset += batch.length;

    if (batch.length < BATCH_SIZE) break;
  }

  return rows;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ao acessar ${url}`);
  }
  return response.json();
}

function normalizeEstabelecimento(row, tiposPorCodigo) {
  const codigoTipo = Number(row.codigo_tipo_unidade);
  const tipo = tiposPorCodigo.get(codigoTipo);
  const cnesId = String(row.codigo_cnes).padStart(7, "0");
  const lat = toNumber(row.latitude_estabelecimento_decimo_grau);
  const lng = toNumber(row.longitude_estabelecimento_decimo_grau);
  const endereco = joinAddress(
    row.endereco_estabelecimento,
    row.numero_estabelecimento,
  );
  const dataAtualizacao = normalizeDate(row.data_atualizacao);

  return {
    cnes_id: cnesId,
    nome: clean(row.nome_fantasia) || clean(row.nome_razao_social) || `CNES ${cnesId}`,
    nome_fantasia: clean(row.nome_fantasia),
    tipo: clean(tipo?.descricao_tipo_unidade) || String(row.codigo_tipo_unidade ?? ""),
    endereco,
    bairro: clean(row.bairro_estabelecimento),
    telefone: formatPhone(row.numero_telefone_estabelecimento),
    horario: clean(row.descricao_turno_atendimento),
    lat,
    lng,
    ativo: row.codigo_motivo_desabilitacao_estabelecimento == null,
    fonte_dados: FONTE_DADOS,
    competencia_cnes: dataAtualizacao,
    importado_em: new Date().toISOString(),
    geocoding_status: lat != null && lng != null ? "coordenada_cnes" : "sem_coordenada",
    _codigoTipoUnidade: codigoTipo,
    _raw: row,
  };
}

function buildVinculacoes(estabelecimentos) {
  const links = [];

  for (const estabelecimento of estabelecimentos) {
    const servicos = inferServicos(estabelecimento);
    for (const servico_codigo of servicos) {
      links.push({
        cnes_id: estabelecimento.cnes_id,
        servico_codigo,
      });
    }
  }

  return links;
}

export function inferServicos(estabelecimento) {
  const servicos = new Set(SERVICOS_POR_TIPO.get(estabelecimento._codigoTipoUnidade) ?? []);

  const tipoDesc = normalizeText(estabelecimento.tipo);
  const textoNome = normalizeText(
    [
      estabelecimento.nome,
      estabelecimento.nome_fantasia,
      estabelecimento._raw?.nome_razao_social,
    ].join(" "),
  );

  // 1) Estrutural por TIPO de unidade (unidades SUS por natureza)
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
  // Honestidade: SO natureza juridica 1xxx (Adm. Publica) prova SUS gratuito. O campo
  // "descricao_natureza_juridica_estabelecimento" guarda o CODIGO ("1244" publico vs
  // "2062"/"4000" privado, verificado na API CNES); ausente => privado (fail-closed).
  // O NOME nao prova SUS (privada pode ter "SUS"/"MUNICIPAL" no nome) -> fora do gate.
  const ehSus = /^1/.test(
    String(estabelecimento._raw?.descricao_natureza_juridica_estabelecimento ?? "").trim(),
  );

  // Farmacia: por TIPO oficial sempre; por NOME so se publica (evita drogaria privada).
  if (/\bFARMAC/.test(tipoDesc) || (ehSus && /\bFARMAC/.test(textoNome))) {
    servicos.add("farmacia");
  }

  // 2) Especialidade por NOME, SO com natureza publica (honestidade > recall)

  if (ehSus && /\b(ODONTO|SAUDE BUCAL|CEO)\b/.test(textoNome)) servicos.add("odonto_esp");
  if (ehSus && /\b(FONO|FONOAUDIO)\b/.test(textoNome)) servicos.add("fono");
  if (ehSus && /(FISIOTER|REABIL|\bCER\b)/.test(textoNome)) servicos.add("reabilitacao");

  if (/\bCAPS\b.*\b(AD|ALCOOL|DROG)\b|DEPENDENCIA QUIMICA/.test(textoNome)) {
    servicos.add("dependencia");
  }

  return [...servicos];
}

async function criarImportacao(supabase, escopo, competencia) {
  const { data, error } = await supabase
    .from("importacoes_dados")
    .insert({
      fonte: FONTE_DADOS,
      escopo_municipio_codigo_ibge: escopo.codigoIbge,
      escopo_municipio_nome: escopo.municipio,
      escopo_uf: escopo.uf,
      competencia,
      status: "em_andamento",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function inserirRaw(supabase, importacaoId, estabelecimentosApi, tiposUnidade) {
  const estabelecimentosRaw = estabelecimentosApi.map((row) => ({
    importacao_id: importacaoId,
    codigo_cnes: String(row.codigo_cnes).padStart(7, "0"),
    codigo_municipio: String(row.codigo_municipio ?? ""),
    payload: row,
  }));
  const tiposRaw = tiposUnidade.map((row) => ({
    importacao_id: importacaoId,
    codigo_tipo_unidade: Number(row.codigo_tipo_unidade),
    payload: row,
  }));

  await insertInChunks(supabase, "cnes_estabelecimentos_raw", estabelecimentosRaw);
  await insertInChunks(supabase, "cnes_tipos_unidade_raw", tiposRaw);
}

async function upsertMunicipio(supabase, escopo) {
  const { data, error } = await supabase
    .from("municipios")
    .upsert(
      {
        codigo_ibge: escopo.codigoIbge,
        nome: escopo.municipio,
        uf: escopo.uf,
      },
      { onConflict: "codigo_ibge" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertEstabelecimentos(supabase, estabelecimentos, municipioId) {
  const rows = estabelecimentos.map((e) => ({
    cnes_id: e.cnes_id,
    nome: e.nome,
    nome_fantasia: e.nome_fantasia,
    tipo: e.tipo,
    endereco: e.endereco,
    bairro: e.bairro,
    telefone: e.telefone,
    horario: e.horario,
    municipio_id: municipioId,
    lat: e.lat,
    lng: e.lng,
    ativo: e.ativo,
    atualizado_em: new Date().toISOString(),
    fonte_dados: e.fonte_dados,
    competencia_cnes: e.competencia_cnes,
    importado_em: e.importado_em,
    geocoding_status: e.geocoding_status,
  }));

  await upsertInChunks(supabase, "estabelecimentos", rows, "cnes_id");

  const byCnes = new Map();
  for (const chunkRows of chunks(rows, 100)) {
    const { data, error } = await supabase
      .from("estabelecimentos")
      .select("id, cnes_id")
      .in("cnes_id", chunkRows.map((row) => row.cnes_id));
    if (error) throw error;
    for (const row of data ?? []) byCnes.set(row.cnes_id, row.id);
  }

  return rows.map((row) => ({ ...row, id: byCnes.get(row.cnes_id) })).filter((row) => row.id);
}

async function substituirVinculosServicos(supabase, importados, vinculacoes) {
  const ids = importados.map((row) => row.id);
  if (ids.length > 0) {
    for (const idChunk of chunks(ids, 100)) {
      const { error } = await supabase
        .from("estabelecimento_servicos")
        .delete()
        .in("estabelecimento_id", idChunk);
      if (error) throw error;
    }
  }

  const idPorCnes = new Map(importados.map((row) => [row.cnes_id, row.id]));
  const rows = vinculacoes
    .map((link) => ({
      estabelecimento_id: idPorCnes.get(link.cnes_id),
      servico_codigo: link.servico_codigo,
    }))
    .filter((link) => link.estabelecimento_id);

  await upsertInChunks(supabase, "estabelecimento_servicos", rows);
}

async function desativarSeeds(supabase) {
  const { error } = await supabase
    .from("estabelecimentos")
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .like("cnes_id", "SEED%");
  if (error) throw error;
}

async function finalizarImportacao(supabase, importacaoId, patch) {
  const { error } = await supabase
    .from("importacoes_dados")
    .update({
      ...patch,
      finalizada_em: new Date().toISOString(),
    })
    .eq("id", importacaoId);
  if (error) throw error;
}

async function insertInChunks(supabase, table, rows) {
  for (const chunkRows of chunks(rows, 500)) {
    if (chunkRows.length === 0) continue;
    const { error } = await supabase.from(table).insert(chunkRows);
    if (error) throw error;
  }
}

async function upsertInChunks(supabase, table, rows, onConflict) {
  for (const chunkRows of chunks(rows, 500)) {
    if (chunkRows.length === 0) continue;
    const options = onConflict ? { onConflict } : undefined;
    const { error } = await supabase.from(table).upsert(chunkRows, options);
    if (error) throw error;
  }
}

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Configure SUPABASE_URL/EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function printSummary(estabelecimentos, vinculacoes, competencia, dryRun) {
  const comServico = new Set(vinculacoes.map((link) => link.cnes_id)).size;
  console.log(`Fonte: ${FONTE_DADOS}`);
  console.log(`Competencia detectada: ${competencia ?? "indefinida"}`);
  console.log(`Estabelecimentos oficiais: ${estabelecimentos.length}`);
  console.log(`Estabelecimentos com servico mapeado no app: ${comServico}`);
  console.log(`Vinculos estabelecimento_servicos: ${vinculacoes.length}`);

  if (dryRun) {
    console.log("\nDry-run: nada foi escrito no Supabase.");
    for (const e of estabelecimentos.slice(0, 10)) {
      const servicos = vinculacoes
        .filter((link) => link.cnes_id === e.cnes_id)
        .map((link) => link.servico_codigo)
        .join(", ");
      console.log(`- ${e.cnes_id} ${e.nome}${servicos ? ` -> ${servicos}` : ""}`);
    }
  }
}

function uniqueByCnes(rows) {
  const map = new Map();
  for (const row of rows) map.set(row.cnes_id, row);
  return [...map.values()];
}

function chunks(rows, size) {
  const result = [];
  for (let i = 0; i < rows.length; i += size) {
    result.push(rows.slice(i, i + size));
  }
  return result;
}

function maxDate(values) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

function normalizeDate(value) {
  if (!value) return null;
  const text = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function clean(value) {
  if (value == null) return null;
  const text = String(value).trim().replace(/\s+/g, " ");
  return text.length > 0 ? text : null;
}

function joinAddress(logradouro, numero) {
  const street = clean(logradouro);
  const number = clean(numero);
  if (street && number) return `${street}, ${number}`;
  return street ?? number;
}

function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatPhone(value) {
  const digits = onlyDigits(value);
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return clean(value);
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();
}

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

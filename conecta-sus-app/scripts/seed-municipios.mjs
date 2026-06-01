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
    const cols = linha.split(",");
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
  let total = 0;
  for (const chunk of chunks(municipios, 500)) {
    const { error } = await supabase
      .from("municipios")
      .upsert(chunk, { onConflict: "codigo_ibge" });
    if (error) throw error;
    total += chunk.length;
    process.stdout.write(`\r  upsert ${total}/${municipios.length}`);
  }
  console.log(`\nUpsert concluido: ${municipios.length} municipios.`);
}

function createAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.");
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

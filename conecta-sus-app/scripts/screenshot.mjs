// Verificação visual + de funcionalidade do app em modo web via Playwright.
// Sobe o app com `expo start --web` antes de rodar este script.
//
//   node scripts/screenshot.mjs [baseUrl]
//
// Captura screenshots das telas principais e registra erros de console
// (ex.: o "<button> cannot contain a nested <button>" do RN Web).

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const base = process.argv[2] ?? "http://localhost:8081";
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", ".playwright-screens");

const erros = [];

function liga(page, rotulo) {
  page.on("console", (msg) => {
    if (msg.type() === "error") erros.push(`[${rotulo}] console.error: ${msg.text()}`);
  });
  page.on("pageerror", (e) => erros.push(`[${rotulo}] pageerror: ${e.message}`));
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function tela(page, rota, arquivo, rotulo) {
  await page.goto(base + rota, { waitUntil: "networkidle" }).catch(() => {});
  await espera(2500);
  await page.screenshot({ path: join(outDir, arquivo), fullPage: false });
  console.log(`✓ ${rotulo} -> ${arquivo}`);
}

const main = async () => {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  liga(page, "app");

  // 1) Buscar (home)
  await tela(page, "/", "01-buscar.png", "Buscar");

  // 2) Detalhe + salvar (testa o botão de marcador)
  await page.goto(base + "/servico/1", { waitUntil: "networkidle" }).catch(() => {});
  await espera(2500);
  await page.screenshot({ path: join(outDir, "02-detalhe.png") });
  console.log("✓ Detalhe -> 02-detalhe.png");
  const salvar = page.getByLabel("Salvar serviço");
  if (await salvar.count()) {
    await salvar.first().click();
    await espera(1500); // deixa o persist (AsyncStorage/localStorage) gravar
    console.log("✓ clicou em Salvar serviço");
  } else {
    erros.push("[detalhe] botão 'Salvar serviço' não encontrado");
  }

  // 3) Salvos — AQUI renderiza o SavedCard (onde estava o <button> aninhado)
  await tela(page, "/salvos", "03-salvos.png", "Salvos");

  // 4) Perfil (acessibilidade)
  await tela(page, "/perfil", "04-perfil.png", "Perfil");

  // 5) Liga Fonte ampliada + Alto contraste e confirma que a UI muda
  const switches = page.getByRole("switch");
  const n = await switches.count();
  if (n >= 2) {
    await switches.nth(0).click().catch(() => {}); // fonte ampliada
    await switches.nth(1).click().catch(() => {}); // alto contraste
    await espera(1200);
    await page.screenshot({ path: join(outDir, "05-acessibilidade.png") });
    console.log(`✓ Acessibilidade (${n} switches) -> 05-acessibilidade.png`);
  } else {
    erros.push(`[perfil] esperava >=2 switches, achei ${n}`);
  }

  await browser.close();

  console.log("\n===== ERROS DE CONSOLE/PÁGINA =====");
  if (erros.length === 0) console.log("nenhum 🎉");
  else erros.forEach((e) => console.log(" - " + e));
  console.log("===================================");
};

main().catch((e) => {
  console.error("falha no script:", e);
  process.exit(1);
});

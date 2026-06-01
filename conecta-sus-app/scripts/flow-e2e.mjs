// Teste E2E do fluxo completo (web export) com Playwright.
// Serve ./dist, faz login, passa pelo onboarding e percorre as 3 features novas.
// Screenshots em ./.playwright-screens/
import { chromium } from "playwright";
import http from "http";
import fs from "fs";
import path from "path";

const PORT = 8092;
const DIST = path.resolve("./dist");
const OUT = path.resolve("./.playwright-screens");
fs.mkdirSync(OUT, { recursive: true });

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  let filePath = path.join(DIST, urlPath === "/" ? "index.html" : urlPath);
  // SPA fallback: rota sem extensão e inexistente → index.html
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    filePath = path.join(DIST, "index.html");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

const BASE = `http://localhost:${PORT}`;
const shots = [];
async function snap(page, nome) {
  const file = path.join(OUT, `flow-${nome}.png`);
  await page.screenshot({ path: file });
  shots.push(nome);
  console.log(`  ✓ ${nome}.png`);
}

await new Promise((r) => server.listen(PORT, r));
console.log(`servindo dist em ${BASE}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  // geolocalização negada de propósito → app cai no fallback Joaçaba
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));

let etapa = "inicio";
try {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  // aguarda o bundle hidratar e a tela de login aparecer
  await page.getByPlaceholder("seu@email.com").waitFor({ timeout: 45000 });
  etapa = "login";
  await snap(page, "01-login");

  // ── LOGIN ──
  await page.getByPlaceholder("seu@email.com").fill("teste@email.com");
  await page.getByPlaceholder("Sua senha").fill("Teste1234!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  // ── ONBOARDING passo 1: persona ──
  etapa = "onboarding";
  await page.getByText("Para quem você está").waitFor({ timeout: 30000 });
  await snap(page, "02-onboarding");

  // escolhe persona "Meu filho"
  await page.getByRole("button", { name: "Meu filho" }).click();

  // ── ONBOARDING passo 2: perfil de saúde (faixa etária + condições, opcional) ──
  etapa = "onboarding-perfil";
  try {
    await page.getByText("Mais um passo").waitFor({ timeout: 15000 });
    await page.getByText("Jovem", { exact: true }).first().click();
    await page.waitForTimeout(300);
    for (const nome of ["Continuar", "Concluir", "Avançar", "Pular", "Começar", "Finalizar"]) {
      const btn = page.getByRole("button", { name: new RegExp(nome, "i") });
      if ((await btn.count()) > 0) { await btn.first().click(); break; }
    }
  } catch { console.log("  (passo de perfil não apareceu — pulando)"); }

  // ── HOME (Buscar) com hero personalizado ──
  etapa = "home";
  await page.getByText("O que seu filho").waitFor({ timeout: 30000 });

  // ── MUNICIPIO RESOLVIDO (geo negada no web => fallback Joaçaba) ──
  // Espera o header sair de "Carregando…" para "<Cidade> · UF".
  etapa = "municipio";
  await page.getByText(/·\s*[A-Z]{2}\b/).first().waitFor({ timeout: 20000 });
  const cidadeOk = (await page.getByText(/·\s*[A-Z]{2}\b/).first().count()) > 0;
  console.log(`  municipio resolvido no header: ${cidadeOk ? "OK ✓" : "AINDA CARREGANDO ✗"}`);
  await snap(page, "03-home-persona");

  // rola até a seção de jornadas e confirma as jornadas novas
  await page.getByText("Está passando por isso?").scrollIntoViewIfNeeded();
  await snap(page, "04-jornadas-secao");
  for (const nome of ["Saúde do Homem", "Saúde da Mulher"]) {
    const ok = (await page.getByText(nome).count()) > 0;
    console.log(`  jornada "${nome}" no carrossel: ${ok ? "OK ✓" : "AUSENTE ✗"}`);
  }

  // ── TOGGLE MAPA ──
  etapa = "toggle-mapa";
  await page.getByText("Buscar", { exact: true }).first().click();
  await page.getByPlaceholder(/.*/).first().fill("psicólogo");
  await page.getByPlaceholder(/.*/).first().press("Enter");
  await page.waitForTimeout(2500); // aguarda resultados do Supabase
  const temToggle = (await page.getByRole("button", { name: "Mapa" }).count()) > 0;
  console.log(`  toggle "Mapa" aparece nos resultados: ${temToggle ? "OK ✓" : "AUSENTE ✗"}`);
  if (temToggle) {
    await page.getByRole("button", { name: "Mapa" }).click();
    await page.waitForTimeout(1200); // WebView precisa de tempo para carregar
    await snap(page, "04b-mapa-resultados");
  }
  // limpa a busca via o botão X (chama pesquisar("") e reseta o termo)
  const clearBtn = page.getByRole("button", { name: "Limpar busca" });
  if ((await clearBtn.count()) > 0) await clearBtn.click();
  await page.waitForTimeout(400);

  // ── DESCOBRIR ──
  etapa = "descobrir";
  await page.getByText("Descobrir", { exact: true }).first().click();
  await page.getByText("Você sabia?").first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  await snap(page, "05-descobrir");

  // desliza o feed até achar uma descoberta universal (selo "Vale em qualquer cidade")
  const selo = page.getByText("Vale em qualquer cidade do Brasil").first();
  let achouUniversal = false;
  for (let i = 0; i < 8; i++) {
    if ((await selo.count()) > 0) { achouUniversal = true; break; }
    await page.mouse.wheel(0, 844);
    await page.waitForTimeout(700);
  }
  if (achouUniversal) {
    await selo.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await snap(page, "05b-descobrir-universal");
  }
  console.log(`  descoberta universal no feed: ${achouUniversal ? "OK ✓" : "AUSENTE ✗"}`);

  // volta para Buscar — limpa busca ativa antes de esperar seção de jornadas
  await page.getByText("Buscar", { exact: true }).first().click();
  const inp = page.getByPlaceholder(/.*/).first();
  const inpVal = await inp.inputValue().catch(() => "");
  if (inpVal.trim().length > 1) {
    await inp.fill("");
    await inp.press("Enter"); // dispara onSubmitEditing("") → setTermo("")
    await page.waitForTimeout(400);
  }
  await page.getByText("Está passando por isso?").waitFor({ timeout: 20000 });

  // ── JORNADA ──
  etapa = "jornada";
  await page.getByRole("button", { name: "Estou grávida" }).click();
  await page.getByText("Cadastre no pré-natal").waitFor({ timeout: 20000 });
  await snap(page, "06-jornada");

  // marca o primeiro passo como concluído
  await page.getByRole("checkbox", { name: "Marcar como feito" }).first().click();
  await page.waitForTimeout(500);
  await snap(page, "07-jornada-passo-feito");

  // ── BUSCA INTEGRADA ──
  etapa = "busca-integrada";
  await page.getByRole("button", { name: "Buscar este serviço" }).first().click();
  await page.waitForTimeout(2500); // navega p/ tabs + aplica busca pendente + resultado
  await snap(page, "08-busca-integrada");

  console.log(`\nOK — ${shots.length} screenshots: ${shots.join(", ")}`);
} catch (e) {
  console.error(`\nFALHOU na etapa "${etapa}": ${e.message}`);
  await snap(page, `ERRO-${etapa}`);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}

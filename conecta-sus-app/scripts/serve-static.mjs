// Servidor estático mínimo com fallback de SPA (para a build web do Expo,
// que usa `output: "single"`). Sem dependências externas.
//
//   node scripts/serve-static.mjs <dir> [porta]

import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const dir = process.argv[2] ?? "dist-web";
const port = Number(process.argv[3] ?? 8081);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(dir, normalize(pathname));

  // arquivo inexistente ou diretório -> fallback de SPA
  if (!existsSync(file) || statSync(file).isDirectory()) {
    file = join(dir, "index.html");
  }

  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

server.listen(port, () => console.log(`servindo ${dir} em http://localhost:${port}`));

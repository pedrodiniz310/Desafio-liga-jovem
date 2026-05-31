import puppeteer from "puppeteer";
import http from "http";
import fs from "fs";
import path from "path";

const PORT = 8090;
const DIST = "./dist";

const server = http.createServer((req, res) => {
  const filePath = path.join(DIST, req.url === "/" ? "index.html" : req.url);
  const ext = path.extname(filePath);
  const contentType = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
  }[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

server.listen(PORT, async () => {
  console.log(`servindo ${DIST} em http://localhost:${PORT}`);
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle0" });
    await page.screenshot({ path: ".playwright-screens/login-auth.png" });
    console.log("✓ login-auth.png");
    await browser.close();
  } catch (e) {
    console.error("Screenshot error:", e.message);
  } finally {
    server.close();
    process.exit(0);
  }
});

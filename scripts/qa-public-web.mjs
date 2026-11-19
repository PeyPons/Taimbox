/**
 * QA de la web pública.
 * Uso: node scripts/qa-public-web.mjs [--base http://127.0.0.1:8080] [--shots dir]
 * Requiere Chrome y puppeteer-core. No toca el Dashboard ni las páginas legales.
 */
import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const base = argValue("--base") ?? "http://127.0.0.1:8080";
const shotsDir = argValue("--shots");
const chrome = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";

const WIDTHS = [360, 390, 430, 768, 1440];
const ES = [
  "/",
  "/precios",
  "/planificador-recursos",
  "/gestion-equipos",
  "/reportes-rentabilidad",
  "/control-proyectos",
  "/integraciones",
  "/monitor-ppc",
  "/seguridad",
  "/dashboard-empleado",
  "/para-quien",
  "/agencias-performance",
  "/estudios-creativos",
  "/agencias-integrales",
  "/guia",
  "/guia/planificador",
  "/contacto",
  "/blog",
  "/por-que-timeboxing",
  "/api-docs",
  "/pitch",
];

const EN = {
  "/": "/en",
  "/precios": "/en/pricing",
  "/planificador-recursos": "/en/resource-planner",
  "/gestion-equipos": "/en/team-management",
  "/reportes-rentabilidad": "/en/reports-profitability",
  "/control-proyectos": "/en/project-control",
  "/integraciones": "/en/integrations",
  "/monitor-ppc": "/en/ppc-monitor",
  "/seguridad": "/en/security",
  "/dashboard-empleado": "/en/employee-dashboard",
  "/para-quien": "/en/who-its-for",
  "/agencias-performance": "/en/performance-agencies",
  "/estudios-creativos": "/en/creative-studios",
  "/agencias-integrales": "/en/full-service-agencies",
  "/guia": "/en/guide",
  "/guia/planificador": "/en/guide/planificador",
  "/contacto": "/en/contact",
  "/blog": "/en/blog",
  "/por-que-timeboxing": "/en/why-taimbox",
  "/api-docs": "/en/api-docs",
  "/pitch": "/en/pitch",
};

function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

function slug(urlPath) {
  if (urlPath === "/") return "home";
  return urlPath.replace(/^\//, "").replaceAll("/", "-");
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  protocolTimeout: 180000,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const findings = [];

if (shotsDir) await mkdir(shotsDir, { recursive: true });

const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  localStorage.setItem(
    "timeboxing_cookie_consent",
    JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    }),
  );
});

for (const lang of ["es", "en"]) {
  for (const esPath of ES) {
    const urlPath = lang === "es" ? esPath : EN[esPath];
    for (const width of WIDTHS) {
      try {
      const consoleErrors = [];
      const onConsole = (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      };
      const onPageError = (err) => consoleErrors.push(String(err));
      page.on("console", onConsole);
      page.on("pageerror", onPageError);
      await page.setViewport({ width, height: width < 700 ? 844 : 900, deviceScaleFactor: 1 });
      let response = null;
      try {
        response = await page.goto(base + urlPath, { waitUntil: "domcontentloaded", timeout: 25000 });
      } catch (error) {
        findings.push({ lang, path: urlPath, width, status: "timeout", error: String(error).slice(0, 180) });
        page.off("console", onConsole);
        page.off("pageerror", onPageError);
        process.stdout.write("T");
        continue;
      }
      await new Promise((r) => setTimeout(r, 200));
      const status = response?.status() ?? 0;
      let metrics;
      try {
        metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const text = document.body?.innerText ?? "";
        const bad = /\[FALTA\]|lorem ipsum|\[TODO\]|TODO:/i.test(text);
        const early = /early adopter/i.test(text);
        return {
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          bad,
          early,
          has99: text.includes("99"),
          has249: text.includes("249"),
        };
      });
      } catch (error) {
        findings.push({ lang, path: urlPath, width, status, error: String(error).slice(0, 180) });
        page.off("console", onConsole);
        page.off("pageerror", onPageError);
        process.stdout.write("E");
        continue;
      }
      const overflow = metrics.scrollWidth > metrics.clientWidth + 1;
      const row = {
        lang,
        path: urlPath,
        width,
        status,
        overflow,
        scrollWidth: metrics.scrollWidth,
        clientWidth: metrics.clientWidth,
        badCopy: metrics.bad,
        early: metrics.early,
        consoleErrors: consoleErrors.filter(
          (line) => !/favicon|Download the React DevTools|supabaseUrl is required|Failed to load resource/i.test(line),
        ),
      };
      if (urlPath.endsWith("precios") || urlPath.endsWith("pricing") || urlPath === "/" || urlPath === "/en") {
        row.prices = { has99: metrics.has99, has249: metrics.has249 };
      }
      const failed =
        status >= 400 ||
        overflow ||
        row.badCopy ||
        row.early ||
        row.consoleErrors.length > 0;
      if (failed) findings.push(row);
      const wantShot =
        shotsDir &&
        (width === 390 || width === 1440) &&
        (lang === "es" || esPath === "/" || esPath === "/precios" || esPath === "/planificador-recursos");
      if (wantShot) {
        const file = path.join(shotsDir, `${lang}-${slug(urlPath)}-${width}.png`);
        await page.screenshot({ path: file });
      }
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      process.stdout.write(failed ? "x" : ".");
      } catch (error) {
        findings.push({ lang, path: urlPath, width, error: String(error).slice(0, 180) });
        process.stdout.write("!");
      }
    }
  }
}

process.stdout.write("\n");

if (shotsDir) {
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.click('button[aria-controls="pub-menu"]');
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: path.join(shotsDir, "es-menu-390.png") });
}

const broken = [];
if (!process.env.SKIP_LINKS) {
await page.setViewport({ width: 1440, height: 900 });
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
const hrefs = await page.evaluate(() =>
  [...document.querySelectorAll("a[href]")]
    .map((a) => a.getAttribute("href") || "")
    .filter((href) => href.startsWith("/") && !href.startsWith("//")),
);
const unique = [...new Set(hrefs)];
for (const href of unique) {
  const target = href.split("#")[0] || "/";
  if (target.startsWith("/login") || target.startsWith("/soporte")) continue;
  try {
    const res = await page.goto(base + target, { waitUntil: "domcontentloaded", timeout: 30000 });
    const status = res?.status() ?? 0;
    if (status >= 400) broken.push({ href: target, status });
  } catch (error) {
    broken.push({ href: target, status: String(error).slice(0, 160) });
  }
}
}

const report = {
  base,
  checked: ES.length * 2 * WIDTHS.length,
  findings,
  brokenLinks: broken,
};
const reportPath = shotsDir ? path.join(shotsDir, "qa-report.json") : "/tmp/qa-public-web.json";
await writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ checked: report.checked, findings: findings.length, broken: broken.length, reportPath }, null, 2));
await browser.close();
process.exit(findings.length || broken.length ? 1 : 0);

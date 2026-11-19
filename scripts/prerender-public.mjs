/**
 * HTML inicial de la web pública (Pepe, opción A reducida a lo que el build
 * puede hacer sin Chrome): title, description, canonical, hreflang, OG y un
 * H1 visible dentro de #root. React lo sustituye al arrancar.
 * No prerenderiza login, reset ni el panel.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distIndex = resolve(root, "dist/index.html");
const site = "https://taimbox.com";

const es = JSON.parse(readFileSync(resolve(root, "src/locales/es/landing.json"), "utf8"));
const en = JSON.parse(readFileSync(resolve(root, "src/locales/en/landing.json"), "utf8"));
const blogEs = JSON.parse(readFileSync(resolve(root, "src/locales/es/blog.json"), "utf8"));
const blogEn = JSON.parse(readFileSync(resolve(root, "src/locales/en/blog.json"), "utf8"));
const apiEs = JSON.parse(readFileSync(resolve(root, "src/locales/es/apiDocs.json"), "utf8"));
const apiEn = JSON.parse(readFileSync(resolve(root, "src/locales/en/apiDocs.json"), "utf8"));

const guideSlugs = [
  "planificador",
  "mi-espacio",
  "deadlines",
  "informes",
  "weekly-forecast",
  "equipo",
  "tiempos",
  "clientes-proyectos",
  "configuracion",
];

function pair(pathEs, pathEn, titleEs, descEs, h1Es, titleEn, descEn, h1En) {
  return [
    { path: pathEs, lang: "es", alt: pathEn, title: titleEs, description: descEs, h1: h1Es },
    { path: pathEn, lang: "en", alt: pathEs, title: titleEn, description: descEn, h1: h1En },
  ];
}

const pages = [
  ...pair("/", "/en", es.home.seoTitle, es.home.seoDescription, es.homeShell.h1, en.home.seoTitle, en.home.seoDescription, en.homeShell.h1),
  ...pair("/por-que-timeboxing", "/en/why-taimbox", es.articleWhy.seoTitle, es.articleWhy.seoDescription, es.articleWhy.heroTitle, en.articleWhy.seoTitle, en.articleWhy.seoDescription, en.articleWhy.heroTitle),
  ...pair("/dashboard-empleado", "/en/employee-dashboard", es.commercial.employeeDashboard.seoTitle, es.commercial.employeeDashboard.seoDescription, es.commercial.employeeDashboard.page.hero.title1, en.commercial.employeeDashboard.seoTitle, en.commercial.employeeDashboard.seoDescription, en.commercial.employeeDashboard.page.hero.title1),
  ...pair("/planificador-recursos", "/en/resource-planner", es.commercial.planner.seoTitle, es.commercial.planner.seoDescription, es.commercial.planner.page.hero.title1, en.commercial.planner.seoTitle, en.commercial.planner.seoDescription, en.commercial.planner.page.hero.title1),
  ...pair("/gestion-equipos", "/en/team-management", es.commercial.team.seoTitle, es.commercial.team.seoDescription, es.commercial.team.page.hero.title1, en.commercial.team.seoTitle, en.commercial.team.seoDescription, en.commercial.team.page.hero.title1),
  ...pair("/reportes-rentabilidad", "/en/reports-profitability", es.commercial.reports.seoTitle, es.commercial.reports.seoDescription, es.commercial.reports.page.hero.title1, en.commercial.reports.seoTitle, en.commercial.reports.seoDescription, en.commercial.reports.page.hero.title1),
  ...pair("/control-proyectos", "/en/project-control", es.commercial.projects.seoTitle, es.commercial.projects.seoDescription, es.commercial.projects.page.hero.title1, en.commercial.projects.seoTitle, en.commercial.projects.seoDescription, en.commercial.projects.page.hero.title1),
  ...pair("/integraciones", "/en/integrations", es.commercial.integrations.seoTitle, es.commercial.integrations.seoDescription, es.commercial.integrations.page.hero.titleBefore, en.commercial.integrations.seoTitle, en.commercial.integrations.seoDescription, en.commercial.integrations.page.hero.titleBefore),
  ...pair("/monitor-ppc", "/en/ppc-monitor", es.commercial.ppc.seoTitle, es.commercial.ppc.seoDescription, es.commercial.ppc.page.hero.titleBefore, en.commercial.ppc.seoTitle, en.commercial.ppc.seoDescription, en.commercial.ppc.page.hero.titleBefore),
  ...pair("/seguridad", "/en/security", es.commercial.security.seoTitle, es.commercial.security.seoDescription, es.commercial.security.page.heroTitle1, en.commercial.security.seoTitle, en.commercial.security.seoDescription, en.commercial.security.page.heroTitle1),
  ...pair("/precios", "/en/pricing", es.pricing.seoTitle, es.pricing.seoDescription, es.pricing.heroLine1, en.pricing.seoTitle, en.pricing.seoDescription, en.pricing.heroLine1),
  ...pair("/guia", "/en/guide", es.guide.seoTitleIndex, es.guide.seoDescriptionIndex, es.guide.layoutTitleIndex, en.guide.seoTitleIndex, en.guide.seoDescriptionIndex, en.guide.layoutTitleIndex),
  ...pair("/blog", "/en/blog", blogEs.index.title, blogEs.index.metaDescription, blogEs.index.h1, blogEn.index.title, blogEn.index.metaDescription, blogEn.index.h1),
  ...pair("/contacto", "/en/contact", es.static.contact.seoTitle, es.static.contact.seoDescription, es.static.contact.heroBefore, en.static.contact.seoTitle, en.static.contact.seoDescription, en.static.contact.heroBefore),
  ...pair("/api-docs", "/en/api-docs", apiEs.seo.title, apiEs.seo.description, apiEs.seo.title, apiEn.seo.title, apiEn.seo.description, apiEn.seo.title),
  ...pair("/para-quien", "/en/who-its-for", es.audiences.hub.seoTitle, es.audiences.hub.seoDescription, es.audiences.hub.title, en.audiences.hub.seoTitle, en.audiences.hub.seoDescription, en.audiences.hub.title),
  ...pair("/agencias-performance", "/en/performance-agencies", es.audiences.performance.seoTitle, es.audiences.performance.seoDescription, es.audiences.performance.title, en.audiences.performance.seoTitle, en.audiences.performance.seoDescription, en.audiences.performance.title),
  ...pair("/estudios-creativos", "/en/creative-studios", es.audiences.creative.seoTitle, es.audiences.creative.seoDescription, es.audiences.creative.title, en.audiences.creative.seoTitle, en.audiences.creative.seoDescription, en.audiences.creative.title),
  ...pair("/agencias-integrales", "/en/full-service-agencies", es.audiences.fullService.seoTitle, es.audiences.fullService.seoDescription, es.audiences.fullService.title, en.audiences.fullService.seoTitle, en.audiences.fullService.seoDescription, en.audiences.fullService.title),
  ...pair("/privacidad", "/en/privacy", es.static.privacy.seoTitle, es.static.privacy.seoDescription, es.static.privacy.seoTitle, en.static.privacy.seoTitle, en.static.privacy.seoDescription, en.static.privacy.seoTitle),
  ...pair("/condiciones", "/en/terms", es.static.terms.seoTitle, es.static.terms.seoDescription, es.static.terms.seoTitle, en.static.terms.seoTitle, en.static.terms.seoDescription, en.static.terms.seoTitle),
];

for (const slug of guideSlugs) {
  const esSec = es.guide.sections[slug];
  const enSec = en.guide.sections[slug];
  pages.push(
    ...pair(
      `/guia/${slug}`,
      `/en/guide/${slug}`,
      esSec.seoTitle,
      esSec.seoDescription,
      esSec.title,
      enSec.seoTitle,
      enSec.seoDescription,
      enSec.title,
    ),
  );
}

const blogSrc = readFileSync(resolve(root, "src/data/blogPosts.ts"), "utf8");
const blocks = blogSrc.split("slug:").slice(1);
for (const block of blocks) {
  const href = /href:\s*"([^"]+)"/.exec(block)?.[1];
  const hrefEn = /hrefEn:\s*"([^"]+)"/.exec(block)?.[1];
  const title = /title:\s*"([^"]+)"/.exec(block)?.[1];
  const titleEn = /titleEn:\s*"([^"]+)"/.exec(block)?.[1];
  const seoTitle = /seoTitle:\s*"([^"]+)"/.exec(block)?.[1] ?? title;
  const seoTitleEn = /seoTitleEn:\s*"([^"]+)"/.exec(block)?.[1] ?? titleEn;
  const description = /description:\s*"([^"]+)"/.exec(block)?.[1] ?? "";
  const descriptionEn = /descriptionEn:\s*"([^"]+)"/.exec(block)?.[1] ?? "";
  if (!href || !hrefEn) continue;
  pages.push(...pair(href, hrefEn, seoTitle, description, title, seoTitleEn, descriptionEn, titleEn));
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const shell = readFileSync(distIndex, "utf8");
if (!shell.includes('<div id="root"></div>')) {
  console.error("dist/index.html no tiene #root vacío");
  process.exit(1);
}

for (const page of pages) {
  const canonical = `${site}${page.path === "/" ? "/" : page.path}`;
  const alt = `${site}${page.alt === "/" ? "/" : page.alt}`;
  const esUrl = page.lang === "es" ? canonical : alt;
  const enUrl = page.lang === "en" ? canonical : alt;
  const head = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<link rel="alternate" hreflang="es" href="${esUrl}" />`,
    `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esUrl}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${site}/brand/logo-C.svg" />`,
  ].join("\n    ");
  let html = shell.replace("<title>Taimbox</title>", head);
  html = html.replace("<html lang=\"es\">", `<html lang="${page.lang}">`);
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><main><h1>${esc(page.h1)}</h1><p>${esc(page.description)}</p></main></div>`,
  );
  const file = page.path === "/" ? distIndex : resolve(root, "dist", page.path.slice(1), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

console.log(`prerender-public: ${pages.length} HTML`);

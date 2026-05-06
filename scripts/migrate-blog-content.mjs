#!/usr/bin/env node
// Decompone los 8 posts seedeados (que hoy son un unico bloque visualRef -> *Article.tsx)
// en bloques granulares editables desde /admin/blog. Lee blog.json es/en, aplica un
// mapper especifico por slug y emite un archivo SQL con UPDATEs idempotentes.
//
// Uso:
//   node scripts/migrate-blog-content.mjs
//     -> escribe supabase/migrations/20260507120000_blog_posts_decompose.sql
//
// El SQL solo hace UPDATE sobre blog_posts (no INSERT), asi que es seguro re-correrlo
// y se aplica con `supabase db push` igual que el resto.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const ES = JSON.parse(readFileSync(resolve(ROOT, "src/locales/es/blog.json"), "utf8"));
const EN = JSON.parse(readFileSync(resolve(ROOT, "src/locales/en/blog.json"), "utf8"));

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function bid() {
  return randomUUID();
}

function block(type, props = {}) {
  return { id: bid(), type, ...props };
}

/** Concatena un objeto { part1, strong, part2, em, ... } en HTML inline. */
function joinParts(input) {
  if (input == null) return "";
  if (typeof input === "string") return input;
  if (typeof input !== "object") return String(input);
  let html = "";
  for (const [k, v] of Object.entries(input)) {
    if (typeof v !== "string") continue;
    if (
      k.startsWith("part")
      || k === "prefix"
      || k === "suffix"
      || k === "mid"
      || k.startsWith("middle")
      || k === "text"
      || k === "body"
    ) {
      html += v;
    } else if (k.startsWith("strong") || k.startsWith("highlight")) {
      html += `<strong>${v}</strong>`;
    } else if (k === "em") {
      html += `<em>${v}</em>`;
    } else if (k === "quote") {
      html += `<em>${v}</em>`;
    } else if (k.startsWith("link")) {
      html += v;
    } else {
      html += v;
    }
  }
  return html;
}

/** Acepta string o objeto (con joinParts). */
function asHtml(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return joinParts(v);
}

/** Detecta tabla en distintos formatos y devuelve { headers: string[], rows: string[][] } o null. */
function parseTable(t) {
  if (!t || typeof t !== "object") return null;
  let headers = null;
  if (Array.isArray(t.headers)) headers = t.headers.map(asHtml);
  else if (t.headers && typeof t.headers === "object") {
    headers = Object.values(t.headers).map(asHtml);
  }
  if (!headers || headers.length === 0) return null;

  let rows = [];
  if (t.rows && typeof t.rows === "object" && !Array.isArray(t.rows)) {
    for (const v of Object.values(t.rows)) {
      if (Array.isArray(v)) rows.push(v.map(asHtml));
      else if (v && typeof v === "object") {
        rows.push(Object.values(v).map(asHtml));
      }
    }
  } else if (Array.isArray(t.rows)) {
    rows = t.rows.map((r) => (Array.isArray(r) ? r.map(asHtml) : []));
  } else {
    // row0..rowN
    for (let i = 0; i < 100; i++) {
      const r = t["row" + i];
      if (!r) break;
      if (Array.isArray(r)) rows.push(r.map(asHtml));
      else if (typeof r === "object") rows.push(Object.values(r).map(asHtml));
    }
  }
  if (rows.length === 0) return null;
  return { headers, rows };
}

/** Extrae items FAQ de los distintos formatos (faqItems, faq.items, faq.q1..qN). */
function parseFaqItems(post) {
  if (Array.isArray(post.faqItems) && post.faqItems.length > 0) {
    return post.faqItems
      .map((x) => ({ q: asHtml(x.q || x.question), a: asHtml(x.a || x.answer) }))
      .filter((x) => x.q && x.a);
  }
  if (post.faq && post.faq.items && typeof post.faq.items === "object") {
    return Object.values(post.faq.items)
      .map((x) => ({
        q: asHtml(x.question || x.q || x.title),
        a: asHtml(x.answer || x.a || x.p1),
      }))
      .filter((x) => x.q && x.a);
  }
  if (post.faq) {
    const items = [];
    for (let i = 1; i <= 20; i++) {
      const q = post.faq["q" + i];
      if (!q) break;
      items.push({
        q: asHtml(q.q || q.question || q.title),
        a: asHtml(q.a || q.answer || q.p1),
      });
    }
    if (items.length > 0) return items.filter((x) => x.q && x.a);
  }
  return null;
}

/** Bloque heading + opcional paragraph descriptivo. */
function headingPara(level, text, anchorId, paragraph) {
  const blocks = [block("heading", { level, text: asHtml(text), ...(anchorId ? { anchorId } : {}) })];
  if (paragraph) {
    if (Array.isArray(paragraph)) {
      for (const p of paragraph) {
        const html = asHtml(p);
        if (html) blocks.push(block("paragraph", { html }));
      }
    } else {
      const html = asHtml(paragraph);
      if (html) blocks.push(block("paragraph", { html }));
    }
  }
  return blocks;
}

/** Construye un bloque tabla si el objeto t parsea bien; si no devuelve null. */
function tableBlock(t) {
  const parsed = parseTable(t);
  if (!parsed) return null;
  return block("table", parsed);
}

/** Construye un bloque list ordered/unordered. */
function listBlock(items, ordered = false) {
  const cleaned = (items || []).map(asHtml).filter((s) => s && s.trim().length > 0);
  if (cleaned.length === 0) return null;
  return block("list", { ordered, items: cleaned });
}

/** FAQ block desde post. */
function faqBlock(post) {
  const items = parseFaqItems(post);
  if (!items || items.length === 0) return null;
  return block("faq", { items });
}

/** Genera JSON-LD @graph con Article + FAQPage opcional + SoftwareApplication opcional. */
function buildJsonLd(post, lang, slug, paths, dateIso, faqItems) {
  const meta = post.meta || {};
  const article = {
    "@type": "Article",
    headline: asHtml(meta.headline || post.title),
    description: asHtml(meta.description),
    author: { "@type": "Organization", name: "Taimbox" },
    publisher: { "@type": "Organization", name: "Taimbox" },
    datePublished: dateIso,
    inLanguage: lang === "en" ? "en" : "es",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://taimbox.com" + (lang === "en" ? paths.en : paths.es),
    },
  };
  const graph = [article];
  if (faqItems && faqItems.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqItems.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  if (post.software && post.software.name) {
    graph.push({
      "@type": "SoftwareApplication",
      name: post.software.name,
      applicationCategory: "BusinessApplication",
      description: asHtml(post.software.desc),
    });
  } else if (meta.softwareDescription) {
    graph.push({
      "@type": "SoftwareApplication",
      name: "Taimbox",
      applicationCategory: "BusinessApplication",
      description: asHtml(meta.softwareDescription),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

// ---------------------------------------------------------------------------
// Mappers por slug. Cada mapper recibe el postKey i18n y devuelve Block[].
// ---------------------------------------------------------------------------

function mapCapacidadCalendario(p) {
  const blocks = [];
  blocks.push(block("paragraph", { html: asHtml(p.intro?.p1) }));
  blocks.push(block("paragraph", { html: asHtml(p.intro?.p2) }));
  if (p.intro?.callout) {
    const c = p.intro.callout;
    blocks.push(block("callout", {
      tone: "info",
      html: `${asHtml(c.prefix)} ${asHtml(c.linkPlan)} ${asHtml(c.mid)} ${asHtml(c.linkCarga)} ${asHtml(c.suffix)}`,
    }));
  }

  const s = p.sections || {};
  if (s.map) {
    blocks.push(...headingPara(2, s.map.title, "mapa-capacidad-calendario-productiva", s.map.p1));
    const t = tableBlock(s.map.table);
    if (t) blocks.push(t);
  }
  blocks.push(block("toc", {}));
  if (s.calendarLie) {
    blocks.push(...headingPara(2, s.calendarLie.title, "calendario-verde-engana", [s.calendarLie.p1, s.calendarLie.p2]));
  }
  if (s.deliverables) {
    blocks.push(...headingPara(2, s.deliverables.title, "entregables-contra-calendario", [s.deliverables.p1, s.deliverables.p2]));
    const t = tableBlock(s.deliverables.table);
    if (t) blocks.push(t);
  }
  if (s.monday) {
    blocks.push(...headingPara(2, s.monday.title, "lunes-capacidad-neta", s.monday.p1));
    const li = listBlock([s.monday.li1, s.monday.li2, s.monday.li3, s.monday.li4]);
    if (li) blocks.push(li);
    if (s.monday.p2) blocks.push(block("paragraph", { html: asHtml(s.monday.p2) }));
  }
  if (s.checklist) {
    blocks.push(...headingPara(2, s.checklist.title, "checklist-capacidad-productiva", [s.checklist.p1, s.checklist.p2]));
    const ol = listBlock([s.checklist.step1, s.checklist.step2, s.checklist.step3, s.checklist.step4, s.checklist.step5], true);
    if (ol) blocks.push(ol);
    const t = tableBlock(s.checklist.antiTable);
    if (t) blocks.push(t);
  }
  if (s.readMore) {
    blocks.push(...headingPara(2, s.readMore.title, "leer-siguiente-capacidad", s.readMore.p1));
    const items = [];
    if (s.readMore.linkTimeboxing) items.push(`<strong>${asHtml(s.readMore.linkTimeboxing)}</strong> — ${asHtml(s.readMore.descTimeboxing)}`);
    if (s.readMore.linkParkinson) items.push(`<strong>${asHtml(s.readMore.linkParkinson)}</strong> — ${asHtml(s.readMore.descParkinson)}`);
    if (s.readMore.linkKpis) items.push(`<strong>${asHtml(s.readMore.linkKpis)}</strong> — ${asHtml(s.readMore.descKpis)}`);
    const li = listBlock(items);
    if (li) blocks.push(li);
  }
  if (p.faq) {
    blocks.push(block("heading", { level: 2, text: asHtml(p.faq.title), anchorId: "faq-capacidad-calendario" }));
    const f = faqBlock(p);
    if (f) blocks.push(f);
  }
  if (p.cta) {
    if (p.cta.p1) blocks.push(block("paragraph", { html: asHtml(p.cta.p1) }));
    if (p.cta.button) blocks.push(block("cta", { text: asHtml(p.cta.button), href: "/planificador-recursos", variant: "primary" }));
  }
  blocks.push(block("relatedPost", { slug: "planificacion-proyectos-cronograma-recursos" }));
  return blocks;
}

function mapWhatIsTimeboxing(p) {
  const blocks = [];
  if (p.intro?.p1) blocks.push(block("paragraph", { html: asHtml(p.intro.p1) }));
  if (p.intro?.callout) blocks.push(block("callout", { tone: "info", html: asHtml(p.intro.callout) }));
  if (p.intro?.p2) blocks.push(block("paragraph", { html: asHtml(p.intro.p2) }));
  blocks.push(block("toc", {}));

  const sec = (key, anchor, title, content) => {
    const s = p[key];
    if (!s) return [];
    return [
      block("heading", { level: 2, text: asHtml(title || s.title), anchorId: anchor }),
      ...content,
    ];
  };

  const s1 = p.section1;
  if (s1) {
    blocks.push(block("heading", { level: 2, text: asHtml(s1.title), anchorId: "que-es-timeboxing-diferencia" }));
    if (s1.p1) blocks.push(block("paragraph", { html: asHtml(s1.p1) }));
    if (s1.p2) blocks.push(block("paragraph", { html: asHtml(s1.p2) }));
    if (s1.list) {
      const li = listBlock([s1.list.traditional, s1.list.timeboxing]);
      if (li) blocks.push(li);
    }
    if (s1.comparison) {
      const c = s1.comparison;
      if (c.title) blocks.push(block("heading", { level: 3, text: asHtml(c.title) }));
      if (c.p1) blocks.push(block("paragraph", { html: asHtml(c.p1) }));
      if (c.timeBlocking) {
        blocks.push(block("heading", { level: 4, text: asHtml(c.timeBlocking.title) }));
        blocks.push(block("paragraph", { html: asHtml(c.timeBlocking.p1) }));
      }
      if (c.timeboxing) {
        blocks.push(block("heading", { level: 4, text: asHtml(c.timeboxing.title) }));
        blocks.push(block("paragraph", { html: asHtml(c.timeboxing.p1) }));
      }
    }
  }

  const s2 = p.section2;
  if (s2) {
    blocks.push(block("heading", { level: 2, text: asHtml(s2.title), anchorId: "bloques-rigidos-flexibles" }));
    if (s2.p1) blocks.push(block("paragraph", { html: asHtml(s2.p1) }));
    if (s2.hard) {
      blocks.push(block("heading", { level: 3, text: asHtml(s2.hard.title) }));
      blocks.push(block("paragraph", { html: asHtml(s2.hard.p1) }));
      if (s2.hard.when) blocks.push(block("paragraph", { html: `<strong>${asHtml(s2.hard.when)}</strong>` }));
      if (s2.hard.benefit) blocks.push(block("paragraph", { html: asHtml(s2.hard.benefit) }));
    }
    if (s2.soft) {
      blocks.push(block("heading", { level: 3, text: asHtml(s2.soft.title) }));
      blocks.push(block("paragraph", { html: asHtml(s2.soft.p1) }));
      if (s2.soft.when) blocks.push(block("paragraph", { html: `<strong>${asHtml(s2.soft.when)}</strong>` }));
    }
    if (s2.capsule) {
      blocks.push(block("callout", {
        tone: "highlight",
        html: `<strong>${asHtml(s2.capsule.title)}</strong> ${asHtml(s2.capsule.p1)}`,
      }));
      if (s2.capsule.cta) blocks.push(block("cta", { text: asHtml(s2.capsule.cta), href: "/planificador-recursos", variant: "primary" }));
    }
  }

  const s3 = p.section3;
  if (s3) {
    blocks.push(block("heading", { level: 2, text: asHtml(s3.title), anchorId: "neurociencia" }));
    if (s3.p1) blocks.push(block("paragraph", { html: asHtml(s3.p1) }));
    if (s3.cards) {
      for (const card of Object.values(s3.cards)) {
        blocks.push(block("heading", { level: 3, text: asHtml(card.title) }));
        blocks.push(block("paragraph", { html: asHtml(card.p1) }));
      }
    }
  }

  const s4 = p.section4;
  if (s4) {
    blocks.push(block("heading", { level: 2, text: asHtml(s4.title), anchorId: "implementacion-paso-a-paso" }));
    if (s4.steps) {
      const stepKeys = Object.keys(s4.steps).sort();
      for (const k of stepKeys) {
        const st = s4.steps[k];
        blocks.push(block("heading", { level: 3, text: `${k}. ${asHtml(st.title)}` }));
        if (st.p1) blocks.push(block("paragraph", { html: asHtml(st.p1) }));
        if (st.example) blocks.push(block("callout", { tone: "info", html: asHtml(st.example) }));
      }
    }
    if (s4.capsule) {
      blocks.push(block("callout", { tone: "highlight", html: `<strong>${asHtml(s4.capsule.title)}</strong> ${asHtml(s4.capsule.p1)}` }));
      if (s4.capsule.cta) blocks.push(block("cta", { text: asHtml(s4.capsule.cta), href: "/dashboard-empleado", variant: "primary" }));
    }
  }

  const s5 = p.section5;
  if (s5) {
    blocks.push(block("heading", { level: 2, text: asHtml(s5.title), anchorId: "equipos-rentabilidad" }));
    if (s5.p1) blocks.push(block("paragraph", { html: asHtml(s5.p1) }));
    if (s5.cards) {
      for (const card of Object.values(s5.cards)) {
        blocks.push(block("heading", { level: 3, text: asHtml(card.title) }));
        blocks.push(block("paragraph", { html: asHtml(card.p1) }));
      }
    }
    if (s5.p2) blocks.push(block("paragraph", { html: asHtml(s5.p2) }));
    if (s5.capsule) {
      blocks.push(block("callout", { tone: "highlight", html: `<strong>${asHtml(s5.capsule.title)}</strong> ${asHtml(s5.capsule.p1)}` }));
      if (s5.capsule.cta) blocks.push(block("cta", { text: asHtml(s5.capsule.cta), href: "/integraciones", variant: "primary" }));
    }
  }

  const s6 = p.section6;
  if (s6) {
    blocks.push(block("heading", { level: 2, text: asHtml(s6.title), anchorId: "timeboxing-reuniones" }));
    if (s6.p1) blocks.push(block("paragraph", { html: asHtml(s6.p1) }));
    if (s6.list) {
      const li = listBlock([s6.list.item1, s6.list.item2, s6.list.item3]);
      if (li) blocks.push(li);
    }
  }

  if (p.faq) {
    blocks.push(block("heading", { level: 2, text: asHtml(p.faq.title), anchorId: "preguntas-frecuentes" }));
    const f = faqBlock(p);
    if (f) blocks.push(f);
  }

  if (p.cta) {
    blocks.push(block("heading", { level: 2, text: asHtml(p.cta.title), anchorId: "cta-rentabilidad" }));
    if (p.cta.p1) blocks.push(block("paragraph", { html: asHtml(p.cta.p1) }));
    if (p.cta.button) blocks.push(block("cta", { text: asHtml(p.cta.button), href: "/", variant: "primary" }));
    if (p.cta.note) blocks.push(block("paragraph", { html: `<em>${asHtml(p.cta.note)}</em>` }));
  }
  blocks.push(block("relatedPost", { slug: "planificacion-proyectos-cronograma-recursos" }));
  return blocks;
}

function mapLeyParkinson(p) {
  const blocks = [];
  if (p.intro?.paragraph1) blocks.push(block("paragraph", { html: joinParts(p.intro.paragraph1) }));
  if (p.intro?.highlightBox) blocks.push(block("callout", { tone: "info", html: joinParts(p.intro.highlightBox) }));
  blocks.push(block("toc", {}));

  const s = p.sections || {};
  const sec = (key, anchor, opts = {}) => {
    const sk = s[key];
    if (!sk) return;
    blocks.push(block("heading", { level: 2, text: asHtml(sk.title), anchorId: anchor }));
    if (sk.paragraph1) blocks.push(block("paragraph", { html: joinParts(sk.paragraph1) }));
    if (sk.paragraph2) blocks.push(block("paragraph", { html: joinParts(sk.paragraph2) }));
    if (sk.paragraph3) blocks.push(block("paragraph", { html: joinParts(sk.paragraph3) }));
    if (sk.paragraph) blocks.push(block("paragraph", { html: joinParts(sk.paragraph) }));
    if (sk.highlightBox) blocks.push(block("callout", { tone: "highlight", html: joinParts(sk.highlightBox) }));
    if (sk.warningBox) {
      blocks.push(block("callout", {
        tone: "warning",
        html: `<strong>${asHtml(sk.warningBox.title)}</strong> ${asHtml(sk.warningBox.body)}`,
      }));
    }
    if (sk.howTo) {
      blocks.push(block("callout", {
        tone: "info",
        html: `<strong>${asHtml(sk.howTo.title)}</strong> ${asHtml(sk.howTo.body)}`,
      }));
    }
    if (sk.quoteBox) {
      blocks.push(block("callout", {
        tone: "highlight",
        html: `<em>${asHtml(sk.quoteBox.text)}</em><br/><small>— ${asHtml(sk.quoteBox.attribution)}</small>`,
      }));
    }
    if (sk.caption) blocks.push(block("paragraph", { html: `<em>${asHtml(sk.caption)}</em>` }));
    if (sk.cards) {
      for (const card of Object.values(sk.cards)) {
        blocks.push(block("heading", { level: 3, text: asHtml(card.title) }));
        blocks.push(block("paragraph", { html: asHtml(card.description) }));
      }
    }
    if (sk.bullets) {
      for (const b of Object.values(sk.bullets)) {
        blocks.push(block("heading", { level: 3, text: asHtml(b.title) }));
        blocks.push(block("paragraph", { html: asHtml(b.body) }));
      }
    }
    if (sk.risksTitle) blocks.push(block("heading", { level: 3, text: asHtml(sk.risksTitle) }));
    if (sk.risks) {
      const li = listBlock(Object.values(sk.risks).map(asHtml));
      if (li) blocks.push(li);
    }
    if (sk.capsule) {
      blocks.push(block("callout", {
        tone: "highlight",
        html: `<strong>${asHtml(sk.capsule.title)}</strong> ${asHtml(sk.capsule.body)}`,
      }));
      if (sk.capsule.button) blocks.push(block("cta", { text: asHtml(sk.capsule.button), href: "/planificador-recursos", variant: "primary" }));
    }
  };

  // Visual ParkinsonLawVisual antes de la primera seccion conceptual
  sec("whatIs", "que-es-ley-parkinson");
  blocks.push(block("visualRef", { visualId: "ParkinsonLawVisual" }));
  sec("formulation", "formulacion-origen");
  sec("origin", "origen-burocracia");
  sec("secondLaw", "segunda-ley");
  sec("examples", "ejemplos-reales");
  sec("triviality", "ley-trivialidad");
  sec("evidence", "evidencia-empirica");
  sec("consequences", "consecuencias");
  sec("antidotes", "antidotos");
  sec("application", "aplicacion-practica");

  if (s.summary) {
    if (s.summary.paragraph1) blocks.push(block("paragraph", { html: joinParts(s.summary.paragraph1) }));
    if (s.summary.paragraph2) blocks.push(block("paragraph", { html: joinParts(s.summary.paragraph2) }));
  }

  if (s.faq) {
    blocks.push(block("heading", { level: 2, text: asHtml(s.faq.title), anchorId: "preguntas-frecuentes" }));
    const items = parseFaqItems({ faq: s.faq });
    if (items) blocks.push(block("faq", { items }));
  }

  if (s.cta) {
    if (s.cta.title) blocks.push(block("heading", { level: 2, text: asHtml(s.cta.title), anchorId: "cta-final" }));
    if (s.cta.description) blocks.push(block("paragraph", { html: asHtml(s.cta.description) }));
    if (s.cta.button) blocks.push(block("cta", { text: asHtml(s.cta.button), href: "/planificador-recursos", variant: "primary" }));
    if (s.cta.signature) blocks.push(block("paragraph", { html: `<em>${asHtml(s.cta.signature)}</em>` }));
  }

  blocks.push(block("relatedPost", { slug: "que-es-timeboxing" }));
  return blocks;
}

function mapPlanificacionProyectos(p) {
  const blocks = [];
  if (p.intro?.p1) blocks.push(block("paragraph", { html: asHtml(p.intro.p1) }));
  if (p.intro?.callout) blocks.push(block("callout", { tone: "info", html: asHtml(p.intro.callout) }));
  blocks.push(block("toc", {}));

  const ph = (sectionKey, anchor) => {
    const sx = p[sectionKey];
    if (!sx) return;
    blocks.push(block("heading", { level: 2, text: asHtml(sx.title), anchorId: anchor }));
    for (const k of ["p1", "p2", "p3"]) {
      if (sx[k]) blocks.push(block("paragraph", { html: asHtml(sx[k]) }));
    }
    // Patron section1: fases (phaseStartTitle, phaseStartText, etc)
    if (sx.phasesTitle) {
      blocks.push(block("heading", { level: 3, text: asHtml(sx.phasesTitle) }));
      for (const stub of ["Start", "Planning", "Execution", "Close"]) {
        const t = sx[`phase${stub}Title`];
        const tx = sx[`phase${stub}Text`];
        if (t) {
          blocks.push(block("heading", { level: 4, text: asHtml(t) }));
          if (tx) blocks.push(block("paragraph", { html: asHtml(tx) }));
        }
      }
    }
    // section2: comparison
    if (sx.compareTitle) {
      blocks.push(block("heading", { level: 3, text: asHtml(sx.compareTitle) }));
      if (sx.compareIntro) blocks.push(block("paragraph", { html: asHtml(sx.compareIntro) }));
      if (sx.onlyTasksTitle) {
        blocks.push(block("heading", { level: 4, text: asHtml(sx.onlyTasksTitle) }));
        blocks.push(block("paragraph", { html: asHtml(sx.onlyTasksText) }));
      }
      if (sx.tasksResourcesTitle) {
        blocks.push(block("heading", { level: 4, text: asHtml(sx.tasksResourcesTitle) }));
        blocks.push(block("paragraph", { html: asHtml(sx.tasksResourcesText) }));
      }
      if (sx.limitationTitle) {
        blocks.push(block("callout", {
          tone: "warning",
          html: `<strong>${asHtml(sx.limitationTitle)}</strong> ${asHtml(sx.limitationText)}`,
        }));
      }
    }
    // section3: triangulo (scope, time, cost)
    if (sx.triangleTitle) {
      blocks.push(block("heading", { level: 3, text: asHtml(sx.triangleTitle) }));
      for (const stub of ["Scope", "Time", "Cost"]) {
        const t = sx[`triangle${stub}Title`];
        const tx = sx[`triangle${stub}Text`];
        if (t) {
          blocks.push(block("heading", { level: 4, text: asHtml(t) }));
          if (tx) blocks.push(block("paragraph", { html: asHtml(tx) }));
        }
      }
      if (sx.triangleNote) blocks.push(block("paragraph", { html: `<em>${asHtml(sx.triangleNote)}</em>` }));
    }
    // section4
    if (sx.noVisibilityTitle) {
      blocks.push(block("heading", { level: 3, text: asHtml(sx.noVisibilityTitle) }));
      blocks.push(block("paragraph", { html: asHtml(sx.noVisibilityText) }));
    }
    if (sx.capacityPlanningTitle) {
      blocks.push(block("heading", { level: 3, text: asHtml(sx.capacityPlanningTitle) }));
      blocks.push(block("paragraph", { html: asHtml(sx.capacityPlanningText) }));
    }
    if (sx.timeboxingLink) blocks.push(block("paragraph", { html: asHtml(sx.timeboxingLink) }));
    if (sx.summaryText) blocks.push(block("paragraph", { html: `<strong>${asHtml(sx.summaryText)}</strong>` }));
    // section5: KPIs
    for (const stub of ["Progress", "Hours", "Margin"]) {
      const t = sx[`kpi${stub}Title`];
      const tx = sx[`kpi${stub}Text`];
      if (t) {
        blocks.push(block("heading", { level: 3, text: asHtml(t) }));
        if (tx) blocks.push(block("paragraph", { html: asHtml(tx) }));
      }
    }
    // section6: tools
    if (sx.toolsTitle) blocks.push(block("heading", { level: 3, text: asHtml(sx.toolsTitle) }));
    if (sx.toolsBoardsTitle) {
      blocks.push(block("heading", { level: 4, text: asHtml(sx.toolsBoardsTitle) }));
      blocks.push(block("paragraph", { html: asHtml(sx.toolsBoardsText) }));
    }
    if (sx.toolsPlanningTitle) {
      blocks.push(block("heading", { level: 4, text: asHtml(sx.toolsPlanningTitle) }));
      blocks.push(block("paragraph", { html: asHtml(sx.toolsPlanningText) }));
    }
    if (sx.capsuleTitle) {
      blocks.push(block("callout", {
        tone: "highlight",
        html: `<strong>${asHtml(sx.capsuleTitle)}</strong> ${asHtml(sx.capsuleText)}`,
      }));
      if (sx.capsuleCta) blocks.push(block("cta", { text: asHtml(sx.capsuleCta), href: "/planificador-recursos", variant: "primary" }));
      if (sx.capsulePlannerCta) blocks.push(block("cta", { text: asHtml(sx.capsulePlannerCta), href: "/planificador-recursos", variant: "primary" }));
      if (sx.capsuleReportsCta) blocks.push(block("cta", { text: asHtml(sx.capsuleReportsCta), href: "/reportes-rentabilidad", variant: "secondary" }));
    }
    if (sx.pricesIntro || sx.pricesLink) {
      blocks.push(block("paragraph", { html: `${asHtml(sx.pricesIntro)} ${asHtml(sx.pricesLink)}` }));
    }
  };

  ph("section1", "que-es-planificacion");
  ph("section2", "cronograma-gantt");
  ph("section3", "presupuesto-triangulo");
  ph("section4", "recursos-capacidad");
  ph("section5", "seguimiento-kpis");
  ph("section6", "herramientas");

  const s7 = p.section7;
  if (s7) {
    if (s7.summary) {
      if (s7.summary.p1) blocks.push(block("paragraph", { html: asHtml(s7.summary.p1) }));
      if (s7.summary.p2) blocks.push(block("paragraph", { html: asHtml(s7.summary.p2) }));
    }
    if (s7.faqTitle) blocks.push(block("heading", { level: 2, text: asHtml(s7.faqTitle), anchorId: "preguntas-frecuentes" }));
    const items = [];
    for (let i = 1; i <= 10; i++) {
      const q = s7[`faq${i}Question`];
      const a = s7[`faq${i}Answer`];
      if (q && a) items.push({ q: asHtml(q), a: asHtml(a) });
    }
    if (items.length > 0) blocks.push(block("faq", { items }));
    if (s7.ctaTitle) blocks.push(block("heading", { level: 2, text: asHtml(s7.ctaTitle), anchorId: "cta-final" }));
    if (s7.ctaText) blocks.push(block("paragraph", { html: asHtml(s7.ctaText) }));
    if (s7.ctaButton) blocks.push(block("cta", { text: asHtml(s7.ctaButton), href: "/planificador-recursos", variant: "primary" }));
    if (s7.authorNote) blocks.push(block("paragraph", { html: `<em>${asHtml(s7.authorNote)}</em>` }));
  }

  blocks.push(block("relatedPost", { slug: "que-es-timeboxing" }));
  return blocks;
}

function mapKpisAgenciasMarketing(p) {
  const blocks = [];
  if (p.intro?.p1) blocks.push(block("paragraph", { html: asHtml(p.intro.p1) }));
  if (p.intro?.p2) blocks.push(block("paragraph", { html: asHtml(p.intro.p2) }));
  if (p.intro?.callout) blocks.push(block("callout", { tone: "info", html: joinParts(p.intro.callout) }));
  blocks.push(block("toc", {}));

  if (p.table) {
    blocks.push(block("heading", { level: 2, text: asHtml(p.table.title), anchorId: "tabla-kpis" }));
    if (p.table.descriptionPrefix) blocks.push(block("paragraph", { html: joinParts(p.table) }));
    const t = tableBlock(p.table);
    if (t) blocks.push(t);
  }

  const s = p.sections || {};
  const renderKpi = (key, anchor) => {
    const sk = s[key];
    if (!sk) return;
    blocks.push(block("heading", { level: 2, text: asHtml(sk.title), anchorId: anchor }));
    for (const pk of ["p1", "p2", "p3", "p4"]) {
      if (sk[pk]) blocks.push(block("paragraph", { html: typeof sk[pk] === "string" ? sk[pk] : joinParts(sk[pk]) }));
    }
    if (sk.example) {
      blocks.push(block("callout", {
        tone: "info",
        html: `<strong>${asHtml(sk.example.title)}</strong> ${typeof sk.example.text === "string" ? sk.example.text : joinParts(sk.example.text)}`,
      }));
    }
    if (sk.warning) {
      const w = sk.warning;
      const parts = [`<strong>${asHtml(w.title)}</strong>`];
      if (w.high) parts.push(`<strong>${asHtml(w.high.strong)}</strong> ${asHtml(w.high.text)}`);
      if (w.low) parts.push(`<strong>${asHtml(w.low.strong)}</strong> ${asHtml(w.low.text)}`);
      if (w.strong1) parts.push(`<strong>${asHtml(w.strong1)}</strong> ${asHtml(w.text1)}`);
      if (w.strong2) parts.push(`<strong>${asHtml(w.strong2)}</strong> ${asHtml(w.text2)}`);
      blocks.push(block("callout", { tone: "warning", html: parts.join("<br/><br/>") }));
    }
  };
  renderKpi("utilizacion", "kpi-utilizacion");
  renderKpi("rentabilidad", "kpi-rentabilidad");
  renderKpi("estimacion", "kpi-estimacion");
  renderKpi("departamento", "kpi-departamento");
  renderKpi("okrs", "kpi-okrs");

  if (s.excelVsTaimbox) {
    const e = s.excelVsTaimbox;
    blocks.push(block("heading", { level: 2, text: asHtml(e.title), anchorId: "excel-vs-taimbox" }));
    for (const k of ["p1", "p2", "p3", "p4"]) {
      if (e[k]) blocks.push(block("paragraph", { html: typeof e[k] === "string" ? e[k] : joinParts(e[k]) }));
    }
    if (e.callout) blocks.push(block("callout", { tone: "highlight", html: joinParts(e.callout) }));
  }

  if (s.links) {
    blocks.push(block("heading", { level: 2, text: asHtml(s.links.title), anchorId: "links" }));
    if (s.links.p1) blocks.push(block("paragraph", { html: joinParts(s.links.p1) }));
    if (s.links.buttons) {
      const btns = s.links.buttons;
      if (btns.planner) blocks.push(block("cta", { text: asHtml(btns.planner), href: "/planificador-recursos", variant: "primary" }));
      if (btns.reports) blocks.push(block("cta", { text: asHtml(btns.reports), href: "/reportes-rentabilidad", variant: "secondary" }));
      if (btns.integrations) blocks.push(block("cta", { text: asHtml(btns.integrations), href: "/integraciones", variant: "secondary" }));
    }
  }

  if (s.closing) {
    if (s.closing.p1) blocks.push(block("paragraph", { html: joinParts(s.closing.p1) }));
    if (s.closing.cta) {
      const c = s.closing.cta;
      blocks.push(block("heading", { level: 2, text: asHtml(c.title), anchorId: "cta-final" }));
      if (c.text) blocks.push(block("paragraph", { html: typeof c.text === "string" ? c.text : joinParts(c.text) }));
      if (c.caption) blocks.push(block("paragraph", { html: `<em>${asHtml(c.caption)}</em>` }));
      if (c.buttons?.reports) blocks.push(block("cta", { text: asHtml(c.buttons.reports), href: "/reportes-rentabilidad", variant: "primary" }));
      if (c.buttons?.planner) blocks.push(block("cta", { text: asHtml(c.buttons.planner), href: "/planificador-recursos", variant: "secondary" }));
    }
    if (s.closing.signature) blocks.push(block("paragraph", { html: `<em>${asHtml(s.closing.signature)}</em>` }));
  }

  blocks.push(block("relatedPost", { slug: "planificacion-proyectos-cronograma-recursos" }));
  return blocks;
}

function mapPlantillaPlanificacionRecursos(p) {
  const blocks = [];
  if (p.hero) {
    if (p.hero.p1) blocks.push(block("paragraph", { html: asHtml(p.hero.p1) }));
    if (p.hero.p2) blocks.push(block("paragraph", { html: asHtml(p.hero.p2) }));
    if (p.hero.p3) blocks.push(block("paragraph", { html: asHtml(p.hero.p3) }));
    if (p.hero.metricsPrefix || p.hero.metricsLink) {
      blocks.push(block("paragraph", {
        html: `${asHtml(p.hero.metricsPrefix)} <strong>${asHtml(p.hero.metricsLink)}</strong>${asHtml(p.hero.metricsSuffix)}`,
      }));
    }
    if (p.hero.downloadCta) blocks.push(block("cta", { text: asHtml(p.hero.downloadCta), href: "/planificador-recursos", variant: "primary" }));
    if (p.hero.downloadHint) blocks.push(block("paragraph", { html: `<em>${asHtml(p.hero.downloadHint)}</em>` }));
  }
  blocks.push(block("toc", {}));

  const s = p.sections || {};
  const sec = (key, anchor) => {
    const sk = s[key];
    if (!sk) return;
    blocks.push(block("heading", { level: 2, text: asHtml(sk.title), anchorId: anchor }));
    for (const k of ["intro", "p1", "p2", "p3"]) {
      if (sk[k]) blocks.push(block("paragraph", { html: asHtml(sk[k]) }));
    }
    if (sk.callout) blocks.push(block("callout", { tone: "info", html: asHtml(sk.callout) }));
    if (sk.exampleTitle) blocks.push(block("heading", { level: 3, text: asHtml(sk.exampleTitle) }));
    const t = tableBlock(sk.table);
    if (t) blocks.push(t);
    if (sk.exampleNote) blocks.push(block("paragraph", { html: `<em>${asHtml(sk.exampleNote)}</em>` }));
    if (sk.formulaTitle) blocks.push(block("heading", { level: 3, text: asHtml(sk.formulaTitle) }));
    if (sk.formula) blocks.push(block("callout", { tone: "info", html: `<strong>${asHtml(sk.formula)}</strong>` }));
    if (sk.formulaNote) blocks.push(block("paragraph", { html: `<em>${asHtml(sk.formulaNote)}</em>` }));
    // anatomy
    for (const sheetKey of ["sheetTeam", "sheetProjects", "sheetAssignment", "sheetInsights"]) {
      const sh = sk[sheetKey];
      if (!sh) continue;
      blocks.push(block("heading", { level: 3, text: asHtml(sh.title) }));
      if (sh.body) blocks.push(block("paragraph", { html: asHtml(sh.body) }));
      if (sh.body1) blocks.push(block("paragraph", { html: asHtml(sh.body1) }));
      if (sh.body2) blocks.push(block("paragraph", { html: asHtml(sh.body2) }));
      if (sh.points) {
        const items = Object.values(sh.points).map(asHtml);
        const li = listBlock(items);
        if (li) blocks.push(li);
      }
      if (sh.note) blocks.push(block("paragraph", { html: `<em>${asHtml(sh.note)}</em>` }));
    }
    if (sk.mockup) {
      const m = sk.mockup;
      if (m.caption) blocks.push(block("paragraph", { html: `<em>${asHtml(m.caption)}</em>` }));
      const tm = tableBlock(m);
      if (tm) blocks.push(tm);
    }
    if (sk.downloadCta) blocks.push(block("cta", { text: asHtml(sk.downloadCta), href: "/planificador-recursos", variant: "primary" }));
    // utilization
    if (sk.masterFormulaTitle) {
      blocks.push(block("heading", { level: 3, text: asHtml(sk.masterFormulaTitle) }));
      if (sk.masterFormulaNote) blocks.push(block("paragraph", { html: asHtml(sk.masterFormulaNote) }));
    }
    if (sk.conditionalTitle) {
      blocks.push(block("heading", { level: 3, text: asHtml(sk.conditionalTitle) }));
      if (sk.conditionalIntro) blocks.push(block("paragraph", { html: asHtml(sk.conditionalIntro) }));
      if (sk.conditionalPoints) {
        const li = listBlock(Object.values(sk.conditionalPoints).map(asHtml));
        if (li) blocks.push(li);
      }
    }
    if (sk.statusTitle) {
      blocks.push(block("heading", { level: 3, text: asHtml(sk.statusTitle) }));
      if (sk.statusNote) blocks.push(block("paragraph", { html: asHtml(sk.statusNote) }));
    }
    if (sk.exampleBody) blocks.push(block("paragraph", { html: asHtml(sk.exampleBody) }));
    if (sk.note) blocks.push(block("paragraph", { html: `<em>${asHtml(sk.note)}</em>` }));
    // ceiling.blocks
    if (sk.blocks) {
      for (const b of Object.values(sk.blocks)) {
        blocks.push(block("heading", { level: 3, text: asHtml(b.title) }));
        blocks.push(block("paragraph", { html: asHtml(b.body) }));
      }
    }
    if (sk.conclusion) blocks.push(block("paragraph", { html: `<strong>${asHtml(sk.conclusion)}</strong>` }));
    // validation
    if (sk.dropdowns) {
      blocks.push(block("heading", { level: 3, text: asHtml(sk.dropdowns.title) }));
      blocks.push(block("paragraph", { html: asHtml(sk.dropdowns.body) }));
      if (sk.dropdowns.note) blocks.push(block("paragraph", { html: `<em>${asHtml(sk.dropdowns.note)}</em>` }));
    }
    if (sk.protection) {
      blocks.push(block("heading", { level: 3, text: asHtml(sk.protection.title) }));
      blocks.push(block("paragraph", { html: asHtml(sk.protection.body) }));
      if (sk.protection.note) blocks.push(block("paragraph", { html: `<em>${asHtml(sk.protection.note)}</em>` }));
    }
    // scale.steps
    if (sk.steps && typeof sk.steps === "object") {
      const li = listBlock(Object.values(sk.steps).map(asHtml), true);
      if (li) blocks.push(li);
    }
    if (sk.trickTitle) {
      blocks.push(block("heading", { level: 3, text: asHtml(sk.trickTitle) }));
      blocks.push(block("paragraph", { html: asHtml(sk.trickBody) }));
    }
    if (sk.limitation) blocks.push(block("paragraph", { html: `<em>${asHtml(sk.limitation)}</em>` }));
    // sheetsVsExcel.points
    if (sk.points && typeof sk.points === "object" && !Array.isArray(sk.points)) {
      const li = listBlock(Object.values(sk.points).map(asHtml));
      if (li) blocks.push(li);
    }
    if (sk.calloutBody) {
      blocks.push(block("callout", {
        tone: "highlight",
        html: `${asHtml(sk.calloutBody)}${sk.calloutNote ? `<br/><em>${asHtml(sk.calloutNote)}</em>` : ""}`,
      }));
    }
  };

  for (const k of ["intro", "capacity", "anatomy", "utilization", "pacing", "excelTax", "ceiling", "validation", "scale", "sheetsVsExcel", "evolution"]) {
    sec(k, k);
  }

  if (p.faq) {
    blocks.push(block("heading", { level: 2, text: asHtml(p.faq.title), anchorId: "preguntas-frecuentes" }));
    const items = parseFaqItems(p);
    if (items) blocks.push(block("faq", { items }));
  }

  if (p.summary) {
    blocks.push(block("heading", { level: 2, text: asHtml(p.summary.title), anchorId: "resumen" }));
    if (p.summary.p1) blocks.push(block("paragraph", { html: asHtml(p.summary.p1) }));
    if (p.summary.p2) blocks.push(block("paragraph", { html: asHtml(p.summary.p2) }));
    if (p.summary.links) blocks.push(block("paragraph", { html: joinParts(p.summary.links) }));
  }

  if (p.cta) {
    if (p.cta.mainTitle) blocks.push(block("heading", { level: 2, text: asHtml(p.cta.mainTitle), anchorId: "cta-final" }));
    if (p.cta.mainSubtitle) blocks.push(block("paragraph", { html: asHtml(p.cta.mainSubtitle) }));
    if (p.cta.primaryCta) blocks.push(block("cta", { text: asHtml(p.cta.primaryCta), href: "/planificador-recursos", variant: "primary" }));
    if (p.cta.secondaryCta) blocks.push(block("cta", { text: asHtml(p.cta.secondaryCta), href: "/reportes-rentabilidad", variant: "secondary" }));
    if (p.cta.footerNote) blocks.push(block("paragraph", { html: `<em>${asHtml(p.cta.footerNote)}</em>` }));
  }

  blocks.push(block("relatedPost", { slug: "planificacion-proyectos-cronograma-recursos" }));
  return blocks;
}

function mapGestionCargaTrabajo(p) {
  const blocks = [];
  if (p.intro?.p1) blocks.push(block("paragraph", { html: asHtml(p.intro.p1) }));
  if (p.intro?.p2) blocks.push(block("paragraph", { html: asHtml(p.intro.p2) }));
  if (p.intro?.capsule) blocks.push(block("callout", { tone: "info", html: asHtml(p.intro.capsule) }));
  blocks.push(block("toc", {}));

  const s = p.sections || {};
  if (s.map) {
    blocks.push(block("heading", { level: 2, text: asHtml(s.map.title), anchorId: "mapa-carga" }));
    if (s.map.p1) blocks.push(block("paragraph", { html: asHtml(s.map.p1) }));
    const t = tableBlock(s.map.table);
    if (t) blocks.push(t);
  }
  const sec = (key, anchor) => {
    const sk = s[key];
    if (!sk) return;
    blocks.push(block("heading", { level: 2, text: asHtml(sk.title), anchorId: anchor }));
    if (sk.p1) blocks.push(block("paragraph", { html: asHtml(sk.p1) }));
  };
  sec("whatIs", "que-es-carga");
  sec("causes", "causas-burnout");
  sec("signals", "senales-riesgo");
  blocks.push(block("visualRef", { visualId: "SenalesCargaAlertaVisual" }));
  sec("framework", "framework-6-pasos");
  blocks.push(block("visualRef", { visualId: "CargaTrabajoFrameworkVisual" }));
  sec("manager", "rol-manager");
  sec("installed", "burnout-instalado");
  sec("metrics", "metricas-carga");
  sec("tools", "herramientas-workload");
  sec("conclusion", "conclusion");

  if (p.faq) {
    blocks.push(block("heading", { level: 2, text: asHtml(p.faq.title), anchorId: "preguntas-frecuentes" }));
    const f = faqBlock(p);
    if (f) blocks.push(f);
  }

  if (p.cta?.p1) {
    blocks.push(block("paragraph", { html: asHtml(p.cta.p1) }));
    blocks.push(block("cta", { text: "Probar Taimbox", href: "/planificador-recursos", variant: "primary" }));
  }

  blocks.push(block("relatedPost", { slug: "kpis-agencias-marketing-2026" }));
  return blocks;
}

function mapComoMedirRentabilidad(p) {
  const blocks = [];
  if (p.tldr) {
    blocks.push(block("callout", {
      tone: "highlight",
      html: `<strong>${asHtml(p.tldr.title)}</strong><br/>${asHtml(p.tldr.item1)}<br/>${asHtml(p.tldr.item2)}<br/>${asHtml(p.tldr.item3)}`,
    }));
  }
  if (p.intro?.p1) blocks.push(block("paragraph", { html: asHtml(p.intro.p1) }));
  if (p.intro?.p2) blocks.push(block("paragraph", { html: asHtml(p.intro.p2) }));
  blocks.push(block("toc", {}));

  const s1 = p.section1;
  if (s1) {
    blocks.push(block("heading", { level: 2, text: asHtml(s1.title), anchorId: "techo-horas" }));
    for (const k of ["p1", "p2", "p3"]) {
      if (s1[k]) blocks.push(block("paragraph", { html: asHtml(s1[k]) }));
    }
    if (s1.sub) {
      blocks.push(block("heading", { level: 3, text: asHtml(s1.sub.title) }));
      blocks.push(block("paragraph", { html: asHtml(s1.sub.p1) }));
    }
  }

  const s2 = p.section2;
  if (s2) {
    blocks.push(block("heading", { level: 2, text: asHtml(s2.title), anchorId: "modelos-pricing" }));
    if (s2.p1) blocks.push(block("paragraph", { html: asHtml(s2.p1) }));
    for (const m of ["hourly", "fixed", "retainer", "hybrid"]) {
      const mm = s2[m];
      if (!mm) continue;
      blocks.push(block("heading", { level: 3, text: asHtml(mm.title) }));
      if (mm.pros) blocks.push(block("paragraph", { html: `<strong>Pros:</strong> ${asHtml(mm.pros)}` }));
      if (mm.cons) blocks.push(block("paragraph", { html: `<strong>Contras:</strong> ${asHtml(mm.cons)}` }));
      if (mm.p1) blocks.push(block("paragraph", { html: asHtml(mm.p1) }));
    }
    blocks.push(block("visualRef", { visualId: "OcupacionVsRentabilidadChart" }));
  }

  const s3 = p.section3;
  if (s3) {
    blocks.push(block("heading", { level: 2, text: asHtml(s3.title), anchorId: "calcular-rentabilidad" }));
    if (s3.p1) blocks.push(block("paragraph", { html: asHtml(s3.p1) }));
    if (s3.formula) {
      blocks.push(block("callout", {
        tone: "info",
        html: `<strong>${asHtml(s3.formula.title)}</strong><br/>${asHtml(s3.formula.text)}<br/>${asHtml(s3.formula.p1)}`,
      }));
    }
    if (s3.benchmark) {
      blocks.push(block("callout", {
        tone: "highlight",
        html: `<strong>${asHtml(s3.benchmark.title)}</strong><br/>${asHtml(s3.benchmark.healthy)}<br/>${asHtml(s3.benchmark.danger)}`,
      }));
    }
  }

  const s4 = p.section4;
  if (s4) {
    blocks.push(block("heading", { level: 2, text: asHtml(s4.title), anchorId: "scope-protocolo" }));
    if (s4.p1) blocks.push(block("paragraph", { html: asHtml(s4.p1) }));
    if (s4.steps) {
      const li = listBlock(Object.values(s4.steps).map(asHtml), true);
      if (li) blocks.push(li);
    }
    blocks.push(block("visualRef", { visualId: "ScopeProtocoloInfographic" }));
  }

  const s5 = p.section5;
  if (s5) {
    blocks.push(block("heading", { level: 2, text: asHtml(s5.title), anchorId: "modelo-sprint" }));
    if (s5.p1) blocks.push(block("paragraph", { html: asHtml(s5.p1) }));
    if (s5.p2) blocks.push(block("paragraph", { html: asHtml(s5.p2) }));
  }

  if (p.faq) {
    blocks.push(block("heading", { level: 2, text: asHtml(p.faq.title), anchorId: "preguntas-frecuentes" }));
    const f = faqBlock(p);
    if (f) blocks.push(f);
  }

  if (p.cta) {
    if (p.cta.title) blocks.push(block("heading", { level: 2, text: asHtml(p.cta.title), anchorId: "cta-final" }));
    if (p.cta.p1) blocks.push(block("paragraph", { html: asHtml(p.cta.p1) }));
    if (p.cta.button) blocks.push(block("cta", { text: asHtml(p.cta.button), href: "/planificador-recursos", variant: "primary" }));
  }

  blocks.push(block("relatedPost", { slug: "planificacion-proyectos-cronograma-recursos" }));
  return blocks;
}

function mapPorQueAgenciaPierde(p) {
  const blocks = [];
  if (p.tldr) {
    blocks.push(block("callout", {
      tone: "highlight",
      html: `<strong>${asHtml(p.tldr.title)}</strong><br/>${asHtml(p.tldr.item1)}<br/>${asHtml(p.tldr.item2)}<br/>${asHtml(p.tldr.item3)}`,
    }));
  }
  if (p.intro?.p1) blocks.push(block("paragraph", { html: asHtml(p.intro.p1) }));
  if (p.intro?.p2) blocks.push(block("paragraph", { html: joinParts(p.intro.p2) }));
  blocks.push(block("toc", {}));

  const renderSec = (key, anchor) => {
    const sx = p[key];
    if (!sx) return;
    blocks.push(block("heading", { level: 2, text: asHtml(sx.title), anchorId: anchor }));
    for (const k of ["p1", "p2", "p3", "p4"]) {
      if (sx[k]) blocks.push(block("paragraph", { html: typeof sx[k] === "string" ? sx[k] : joinParts(sx[k]) }));
    }
    for (const subKey of ["sub1", "sub2", "sub3", "sub4"]) {
      const sub = sx[subKey];
      if (!sub) continue;
      if (sub.title) blocks.push(block("heading", { level: 3, text: asHtml(sub.title) }));
      // p1, p2 subnivel
      if (sub.p1) blocks.push(block("paragraph", { html: typeof sub.p1 === "string" ? sub.p1 : joinParts(sub.p1) }));
      if (sub.p2) blocks.push(block("paragraph", { html: typeof sub.p2 === "string" ? sub.p2 : joinParts(sub.p2) }));
      // li1..li5 -> list
      const items = [];
      for (let i = 1; i <= 10; i++) {
        const li = sub["li" + i];
        if (!li) break;
        items.push(typeof li === "string" ? li : joinParts(li));
      }
      if (items.length > 0) {
        const lb = listBlock(items);
        if (lb) blocks.push(lb);
      }
    }
    // tabla
    const t = tableBlock(sx.table);
    if (t) blocks.push(t);
  };

  renderSec("section1", "trampa-ocupacion");
  renderSec("section2", "context-switching");
  renderSec("section3", "presencialismo-digital");
  renderSec("section4", "horas-no-facturables");
  renderSec("section5", "scope-creep");
  renderSec("section6", "metricas-prediccion");
  renderSec("section7", "que-cambiar-esta-semana");

  if (p.faq) {
    blocks.push(block("heading", { level: 2, text: asHtml(p.faq.title), anchorId: "preguntas-frecuentes" }));
    const f = faqBlock(p);
    if (f) blocks.push(f);
  }

  blocks.push(block("relatedPost", { slug: "kpis-agencias-marketing-2026" }));
  return blocks;
}

// ---------------------------------------------------------------------------
// Registry slug -> mapper + metadatos para JSON-LD
// ---------------------------------------------------------------------------

const POSTS = [
  {
    slug: "que-es-timeboxing",
    postKey: "whatIsTimeboxing",
    paths: { es: "/blog/que-es-timeboxing", en: "/en/blog/what-is-timeboxing" },
    date: "2026-03-10",
    mapper: mapWhatIsTimeboxing,
  },
  {
    slug: "ley-parkinson",
    postKey: "leyParkinson",
    paths: { es: "/blog/ley-parkinson", en: "/en/blog/parkinsons-law" },
    date: "2026-03-14",
    mapper: mapLeyParkinson,
  },
  {
    slug: "planificacion-proyectos-cronograma-recursos",
    postKey: "planificacionProyectos",
    paths: { es: "/blog/planificacion-proyectos-cronograma-recursos", en: "/en/blog/project-planning-schedule-resources" },
    date: "2026-03-18",
    mapper: mapPlanificacionProyectos,
  },
  {
    slug: "kpis-agencias-marketing-2026",
    postKey: "kpisAgenciasMarketing",
    paths: { es: "/blog/kpis-agencias-marketing-2026", en: "/en/blog/marketing-agency-kpis-2026" },
    date: "2026-03-23",
    mapper: mapKpisAgenciasMarketing,
  },
  {
    slug: "plantilla-planificacion-recursos-agencia",
    postKey: "plantillaPlanificacionRecursos",
    paths: { es: "/blog/plantilla-planificacion-recursos-agencia", en: "/en/blog/agency-resource-planning-template" },
    date: "2026-03-24",
    mapper: mapPlantillaPlanificacionRecursos,
  },
  {
    slug: "gestion-carga-trabajo-equipo-sin-burnout",
    postKey: "gestionCargaTrabajoEquipo",
    paths: { es: "/blog/gestion-carga-trabajo-equipo-sin-burnout", en: "/en/blog/workload-management-without-burnout" },
    date: "2026-03-26",
    mapper: mapGestionCargaTrabajo,
  },
  {
    slug: "como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas",
    postKey: "comoMedirRentabilidadProyecto",
    paths: { es: "/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas", en: "/en/blog/measure-project-profitability-stop-selling-hours" },
    date: "2026-03-26",
    mapper: mapComoMedirRentabilidad,
  },
  {
    slug: "por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado",
    postKey: "porQueAgenciaPierdeRentabilidad",
    paths: { es: "/blog/por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado", en: "/en/blog/why-agency-loses-profitability-busy-team" },
    date: "2026-03-26",
    mapper: mapPorQueAgenciaPierde,
  },
  {
    slug: "capacidad-calendario-vs-capacidad-productiva-equipo",
    postKey: "capacidadCalendarioVsProductiva",
    paths: { es: "/blog/capacidad-calendario-vs-capacidad-productiva-equipo", en: "/en/blog/calendar-capacity-vs-shippable-team-capacity" },
    date: "2026-05-06",
    mapper: mapCapacidadCalendario,
  },
];

// ---------------------------------------------------------------------------
// Main: genera SQL UPDATE
// ---------------------------------------------------------------------------

function escapeSql(value) {
  // Escapa ' duplicandolas (escape SQL estandar para literales).
  return String(value).replace(/'/g, "''");
}

function jsonbLiteral(obj) {
  if (obj == null) return "NULL";
  return `'${escapeSql(JSON.stringify(obj))}'::jsonb`;
}

function generateSql() {
  const lines = [];
  lines.push("-- Decompone los 8 posts seedeados desde un unico bloque visualRef a bloques granulares editables.");
  lines.push("-- Generado por scripts/migrate-blog-content.mjs leyendo src/locales/{es,en}/blog.json.");
  lines.push("-- Idempotente: solo UPDATE; re-correr regenera con la version actual de blog.json.");
  lines.push("");
  for (const post of POSTS) {
    const pEs = ES.posts[post.postKey];
    const pEn = EN.posts[post.postKey];
    if (!pEs || !pEn) {
      console.warn(`[skip] ${post.slug}: postKey ${post.postKey} no encontrado`);
      continue;
    }
    const blocksEs = post.mapper(pEs);
    const blocksEn = post.mapper(pEn);
    const faqEs = parseFaqItems(pEs);
    const faqEn = parseFaqItems(pEn);
    const jsonLdEs = buildJsonLd(pEs, "es", post.slug, post.paths, post.date, faqEs);
    const jsonLdEn = buildJsonLd(pEn, "en", post.slug, post.paths, post.date, faqEn);

    console.log(`[ok] ${post.slug}: ${blocksEs.length} blocks ES, ${blocksEn.length} blocks EN`);

    lines.push(`-- ${post.slug}`);
    lines.push("UPDATE public.blog_posts SET");
    lines.push(`  blocks_es = ${jsonbLiteral(blocksEs)},`);
    lines.push(`  blocks_en = ${jsonbLiteral(blocksEn)},`);
    lines.push(`  json_ld_es = ${jsonbLiteral(jsonLdEs)},`);
    lines.push(`  json_ld_en = ${jsonbLiteral(jsonLdEn)}`);
    lines.push(`WHERE slug = '${post.slug}';`);
    lines.push("");
  }
  return lines.join("\n");
}

const sql = generateSql();
const outDir = resolve(ROOT, "supabase/migrations");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "20260507120000_blog_posts_decompose.sql");
writeFileSync(outPath, sql, "utf8");
console.log(`\nSQL escrito en: ${outPath}`);
console.log("Aplicar con:  supabase db push");

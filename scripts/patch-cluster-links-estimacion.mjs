#!/usr/bin/env node
import { config } from "dotenv";

config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

const patches = [
  {
    slug: "planificacion-proyectos-cronograma-recursos",
    es: {
      id: "link-estimacion-es",
      html: 'La estimación de horas y fechas antes de fijar el cronograma tiene su propia guía en <a href="/blog/estimacion-proyectos-agencia-como-acertar">estimación de proyectos en agencias</a>: esfuerzo vs duración, buffers y ritual en cinco pasos.',
    },
    en: {
      id: "link-estimacion-en",
      html: 'Hour and date estimation before locking the schedule has its own guide in <a href="/en/blog/agency-project-estimation-how-to-get-it-right">agency project estimation</a>: effort vs duration, buffers, and a five-step ritual.',
    },
  },
  {
    slug: "como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas",
    es: {
      id: "link-estimacion-es",
      html: 'Si la desviación entre estimado y real es sistemática, el origen suele estar en la venta — lo desglosamos en <a href="/blog/estimacion-proyectos-agencia-como-acertar">por qué fallan las estimaciones de proyecto</a>.',
    },
    en: {
      id: "link-estimacion-en",
      html: 'If estimate vs actual variance is systematic, the root cause is often in sales — see <a href="/en/blog/agency-project-estimation-how-to-get-it-right">why project estimates fail</a>.',
    },
  },
  {
    slug: "plantilla-planificacion-recursos-agencia",
    es: {
      id: "link-estimacion-es",
      html: 'Para rellenar la columna de horas presupuestadas con criterio, usa la guía de <a href="/blog/estimacion-proyectos-agencia-como-acertar">estimación de proyectos en agencias</a> (analogía, bottom-up y buffers por rol).',
    },
    en: {
      id: "link-estimacion-en",
      html: 'To fill the budgeted hours column with method, see <a href="/en/blog/agency-project-estimation-how-to-get-it-right">agency project estimation</a> (analogy, bottom-up, role buffers).',
    },
  },
];

function inject(blocks, link) {
  if (!Array.isArray(blocks)) return blocks;
  if (blocks.some((b) => b.id === link.id)) return blocks;
  const idx = blocks.findIndex((b) => b.type === "relatedPost" || b.type === "faq");
  const block = { id: link.id, type: "paragraph", html: link.html };
  if (idx === -1) return [...blocks, block];
  return [...blocks.slice(0, idx), block, ...blocks.slice(idx)];
}

for (const p of patches) {
  const res = await fetch(
    `${url}/rest/v1/blog_posts?slug=eq.${p.slug}&select=blocks_es,blocks_en`,
    { headers },
  );
  const [post] = await res.json();
  if (!post) {
    console.log("[skip]", p.slug, "not found");
    continue;
  }
  const blocks_es = inject(post.blocks_es, p.es);
  const blocks_en = inject(post.blocks_en, p.en);
  const pr = await fetch(`${url}/rest/v1/blog_posts?slug=eq.${p.slug}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ blocks_es, blocks_en }),
  });
  console.log("[patch]", p.slug, pr.status, pr.ok ? "ok" : await pr.text());
}

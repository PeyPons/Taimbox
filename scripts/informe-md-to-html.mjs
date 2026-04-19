/**
 * Genera HTML imprimible desde el informe Markdown (TOC enlazable, tablas, estilos).
 * Uso: node scripts/informe-md-to-html.mjs
 *       node scripts/informe-md-to-html.mjs --input informes/otro.md --output informes/dist/otro.html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = {
    input: path.join(root, "informes", "informe-equipo-ene-mar-2026.md"),
    output: path.join(root, "informes", "dist", "informe-equipo-ene-mar-2026.html"),
    mermaid: true,
  };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--input" && argv[i + 1]) {
      out.input = path.resolve(root, argv[++i]);
    } else if (argv[i] === "--output" && argv[i + 1]) {
      out.output = path.resolve(root, argv[++i]);
    } else if (argv[i] === "--no-mermaid") {
      out.mermaid = false;
    }
  }
  return out;
}

function stripManualToc(md) {
  const normalized = md.replace(/\r\n/g, "\n");
  return normalized.replace(/\n## Índice\n+[\s\S]*?\n---\n+/m, "\n");
}

function splitDenseParagraphs(md) {
  const blocks = md.split(/\n\s*\n/);
  const out = [];
  const sentenceBoundary = /(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ0-9("“¿¡])/g;
  const splitBySentences = (text, maxChars = 340, maxSentences = 2) => {
    const sentences = text.split(sentenceBoundary).map((s) => s.trim()).filter(Boolean);
    if (sentences.length <= 3) return [text.trim()];
    const chunks = [];
    let acc = "";
    let accSentences = 0;
    for (const sentence of sentences) {
      const next = acc ? `${acc} ${sentence}` : sentence;
      const exceedsChars = next.length > maxChars;
      const exceedsSentencesNow = accSentences >= maxSentences;
      if (acc && (exceedsChars || exceedsSentencesNow)) {
        chunks.push(acc.trim());
        acc = sentence;
        accSentences = 1;
      } else {
        acc = next;
        accSentences += 1;
      }
    }
    if (acc) chunks.push(acc.trim());
    return chunks;
  };

  const isParagraphCandidate = (block) => {
    const raw = block.trim();
    const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean);
    const t = lines.join(" ");
    if (!t) return false;
    for (const line of lines) {
      if (/^#{1,6}\s/.test(line)) return false;
      if (/^[-*+]\s/.test(line)) return false;
      if (/^\d+\.\s/.test(line)) return false;
      if (/^>\s/.test(line)) return false;
      if (/^\|/.test(line)) return false;
      if (/^```/.test(line)) return false;
      if (/^---+$/.test(line)) return false;
    }
    return true;
  };

  for (const block of blocks) {
    const trimmed = block.trim();
    const normalized = trimmed.replace(/\s*\n\s*/g, " ");
    if (!isParagraphCandidate(trimmed) || normalized.length < 460) {
      out.push(block);
      continue;
    }

    const chunks = splitBySentences(normalized);
    if (chunks.length <= 1) {
      out.push(block);
      continue;
    }

    out.push(chunks.join("\n\n"));
  }

  return out.join("\n\n");
}

function slugBase(text) {
  const s = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return s || "seccion";
}

function createSlugger() {
  const counts = new Map();
  return (plain) => {
    const base = slugBase(plain);
    const n = (counts.get(base) ?? 0) + 1;
    counts.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}

function extractPlain(tokens) {
  if (!tokens?.length) return "";
  return tokens
    .map((t) => {
      if (t.type === "text") return t.text ?? "";
      if (t.tokens) return extractPlain(t.tokens);
      return "";
    })
    .join("");
}

function buildTocHtml(entries, extraClasses = "") {
  if (!entries.length) return "";
  const items = entries
    .map(
      (e) =>
        `<li class="${e.depth === 3 ? "toc-h3" : "toc-h2"}"><a href="#${e.id}">${escapeHtml(e.label)}</a></li>`,
    )
    .join("\n");
  const cls = `toc-box ${extraClasses}`.trim();
  return `<nav class="${cls}" aria-label="Índice">
<h2>Índice</h2>
<ol class="toc-list">
${items}
</ol>
</nav>`;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractTitleAndMeta(md) {
  const lines = md.split("\n");
  let i = 0;
  const titleLine = lines[i]?.startsWith("# ") ? lines[i].slice(2).trim() : "Informe";
  if (lines[i]?.startsWith("# ")) i++;

  const metaLines = [];
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ") || (line.startsWith("# ") && i > 0)) break;
    if (line.trim() === "---" && metaLines.length > 0) {
      i++;
      break;
    }
    if (line.trim() !== "" && line.trim() !== "---") {
      metaLines.push(line);
    }
    i++;
  }
  while (i < lines.length && lines[i].trim() === "---") i++;

  const metaHtml =
    metaLines.length > 0
      ? `<div class="doc-meta">${metaLines.map((l) => `<p>${inlineMdToSafeHtml(l)}</p>`).join("")}</div>`
      : "";

  return { title: titleLine, metaHtml, restStart: i };
}

/** Solo **bold** y backticks en líneas meta; evita HTML crudo */
function inlineMdToSafeHtml(line) {
  let s = escapeHtml(line);
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  return s;
}

function mermaidPostProcess(html) {
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_, code) => {
      const decoded = code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"');
      return `<div class="mermaid">${decoded}</div>`;
    },
  );
}

function readabilityPostProcess(html) {
  let out = html;
  const sentenceBoundary = /(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ0-9("“¿¡])/g;
  const signalLabels = [
    "Lectura",
    "Lecturas clave",
    "Lecturas",
    "Riesgos",
    "Recomendaciones",
    "Concentración",
    "Competencia crítica",
    "Riesgo",
  ];
  const splitNearMiddle = (text) => {
    const mid = Math.floor(text.length / 2);
    const delimiters = ["; ", ". ", ": "];
    let best = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const delimiter of delimiters) {
      const idx = text.indexOf(delimiter, mid);
      if (idx > 80) {
        const distance = Math.abs(idx - mid);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = idx + delimiter.length;
        }
      }
    }
    if (best === -1) return [text];
    return [text.slice(0, best).trim(), text.slice(best).trim()].filter(Boolean);
  };

  const splitLongHtmlText = (text) => {
    const plain = text.replace(/\s+/g, " ").trim();
    if (plain.length < 420) return [text];
    const sentences = text.split(sentenceBoundary).map((s) => s.trim()).filter(Boolean);
    const chunks = [];
    if (sentences.length > 3) {
      let acc = "";
      let accSentences = 0;
      for (const sentence of sentences) {
        const next = acc ? `${acc} ${sentence}` : sentence;
        if (acc && (next.length > 360 || accSentences >= 2)) {
          chunks.push(acc.trim());
          acc = sentence;
          accSentences = 1;
        } else {
          acc = next;
          accSentences += 1;
        }
      }
      if (acc) chunks.push(acc.trim());
    } else {
      chunks.push(...splitNearMiddle(text));
    }
    const finalChunks = [];
    for (const chunk of chunks.length ? chunks : [text]) {
      if (chunk.length > 420) {
        finalChunks.push(...splitNearMiddle(chunk));
      } else {
        finalChunks.push(chunk);
      }
    }
    return finalChunks.length ? finalChunks : [text];
  };

  const toSignalClass = (label) => {
    const plain = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    return plain || "nota";
  };

  const bulletize = (text) => {
    const clean = text.replace(/\s+/g, " ").trim();
    const safe = clean.replace(/&[a-zA-Z0-9#]+;/g, (m) => m.replace(/;/g, "__SEMICOLON__"));
    let chunks = safe
      .split(/;\s+(?=[A-ZÁÉÍÓÚÜÑ0-9<])/g)
      .map((x) => x.trim())
      .filter(Boolean);
    chunks = chunks.map((x) => x.replace(/__SEMICOLON__/g, ";"));
    if (chunks.length < 2 && clean.length > 180) {
      chunks = clean
        .split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÜÑ0-9("“¿¡])/g)
        .map((x) => x.trim())
        .filter(Boolean);
    }
    return chunks;
  };

  out = out.replace(
    /<p><strong>(Frente\s+\d+\s+—[^<]+)<\/strong>\s*([\s\S]*?)<\/p>/g,
    (_, title, text) => {
      const paragraphs = splitLongHtmlText(text).map((p) => `<p>${p}</p>`).join("");
      return `<section class="focus-block"><h4>${title}</h4>${paragraphs}</section>`;
    },
  );
  out = out.replace(
    /(<h2 id="1-resumen-ejecutivo">[\s\S]*?<\/h2>\s*)(<p>)/,
    "$1<p class=\"lead\">",
  );

  const signalPattern = new RegExp(
    `<p><strong>(${signalLabels.join("|")}):<\\/strong>\\s*([\\s\\S]*?)<\\/p>`,
    "g",
  );
  out = out.replace(signalPattern, (_, label, content) => {
    const bullets = bulletize(content);
    if (bullets.length < 2) return `<p><strong>${label}:</strong> ${content}</p>`;
    const cls = toSignalClass(label);
    const items = bullets.map((item) => `<li>${item}</li>`).join("");
    return `<section class="signal-box signal-${cls}"><p class="signal-title">${label}</p><ul>${items}</ul></section>`;
  });

  return out;
}

function wrapDocument(title, metaHtml, tocHtml, bodyHtml, { mermaid }) {
  const cssPath = path.join(root, "informes", "print", "informe-print.css");
  const css = fs.readFileSync(cssPath, "utf8");
  const tocScreen = tocHtml
    ? tocHtml.replace('class="toc-box', 'class="toc-box toc-screen no-print')
    : "";
  const tocPrint = tocHtml ? tocHtml.replace('class="toc-box', 'class="toc-box toc-print') : "";
  const mermaidScripts = mermaid
    ? `
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
${css}
  </style>
</head>
<body>
  <div class="doc-wrap">
    <p class="print-hint no-print"><strong>PDF:</strong> Ctrl+P → Destino “Guardar como PDF”. Activa <strong>Más ajustes → Gráficos de fondo</strong> para conservar colores de tablas y cabeceras.</p>
    <header>
      <h1 class="doc-body-h1-title">${escapeHtml(title)}</h1>
      ${metaHtml}
    </header>
    <div class="doc-layout">
      <aside class="doc-sidebar">${tocScreen}</aside>
      <article class="doc-body">
        ${tocPrint}
        ${bodyHtml}
      </article>
    </div>
  </div>
  ${mermaidScripts}
</body>
</html>`;
}

async function main() {
  const opts = parseArgs(process.argv);
  const raw = fs.readFileSync(opts.input, "utf8");
  const mdBody = stripManualToc(raw);

  const { title, metaHtml, restStart } = extractTitleAndMeta(mdBody);
  const lines = mdBody.split("\n");
  const md = splitDenseParagraphs(lines.slice(restStart).join("\n"));

  const tocEntries = [];
  const nextSlug = createSlugger();

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const plain = extractPlain(tokens).trim() || "";
        const id = nextSlug(plain);
        if (depth >= 2 && depth <= 3) {
          const label = plain || inner.replace(/<[^>]+>/g, "").trim();
          tocEntries.push({ depth, id, label });
        }
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
    },
  });

  let html = await marked.parse(md, { gfm: true, breaks: false });
  html = mermaidPostProcess(html);
  html = readabilityPostProcess(html);

  const tocHtml = buildTocHtml(tocEntries);
  const full = wrapDocument(title, metaHtml, tocHtml, html, { mermaid: opts.mermaid });

  fs.mkdirSync(path.dirname(opts.output), { recursive: true });
  fs.writeFileSync(opts.output, full, "utf8");
  console.log(`Escrito: ${path.relative(root, opts.output)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Aplica archivos .sql en orden vía fetch al proxy MCP local (execute_sql).
 * Uso: node scripts/apply-sql-parts.mjs .tmp-blog-migrate/part-0.sql ...
 */
import { readFileSync } from "node:fs";

const MCP_URL = process.env.TAIMBOX_MCP_URL ?? "http://localhost:8080/api/mcp";

async function applySql(query) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "execute_sql",
        arguments: { query },
      },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text.slice(0, 300)}`);
  }
  if (data.error) {
    throw new Error(data.error.message ?? JSON.stringify(data.error));
  }
  const content = data.result?.content;
  if (Array.isArray(content)) {
    const errText = content.find((c) => c.type === "text" && /error/i.test(c.text ?? ""));
    if (errText) throw new Error(errText.text);
  }
  console.log("[ok]", query.slice(0, 80).replace(/\s+/g, " "));
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/apply-sql-parts.mjs <file.sql> ...");
  process.exit(1);
}

for (const file of files) {
  const sql = readFileSync(file, "utf8");
  console.log(`Applying ${file} (${sql.length} bytes)...`);
  await applySql(sql);
}

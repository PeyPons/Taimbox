/**
 * Aplica 20260526120000_review_agents.sql vía proxy MCP local (localhost:8080).
 * Requiere: proxy MCP activo con DATABASE_URL configurado.
 *
 * Uso: node scripts/apply-review-migration-mcp.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const MCP_URL = process.env.MCP_URL ?? 'http://localhost:8080/api/mcp';
const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(__dirname, '../supabase/migrations/20260526120000_review_agents.sql'),
  'utf8',
);

async function mcpCall(method, params, id) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id }),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`MCP ${method}: ${res.status} ${text.slice(0, 500)}`);
  }
}

const init = await mcpCall(
  'initialize',
  {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'apply-review-migration', version: '1' },
  },
  1,
);
console.log('initialize:', JSON.stringify(init, null, 2));

const result = await mcpCall(
  'tools/call',
  {
    name: 'apply_migration',
    arguments: {
      name: 'review_agents',
      query: sql,
    },
  },
  2,
);
console.log('apply_migration:', JSON.stringify(result, null, 2));

if (result.result?.isError) {
  console.log('apply_migration failed, trying execute_sql...');
  const sqlResult = await mcpCall(
    'tools/call',
    { name: 'execute_sql', arguments: { query: sql } },
    3,
  );
  console.log('execute_sql:', JSON.stringify(sqlResult, null, 2));
  if (sqlResult.result?.isError) process.exit(1);
} else if (result.error) {
  process.exit(1);
}

if (result.error) process.exit(1);
if (result.result?.isError) process.exit(1);

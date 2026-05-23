const MCP_URL = 'http://localhost:8080/api/mcp';

async function mcpCall(method, params, id) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id }),
  });
  return res.json();
}

await mcpCall(
  'initialize',
  {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'check', version: '1' },
  },
  1,
);

const r = await mcpCall(
  'tools/call',
  {
    name: 'execute_sql',
    arguments: {
      query: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'review_%' ORDER BY 1`,
    },
  },
  2,
);
console.log(JSON.stringify(r, null, 2));

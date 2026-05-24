/**
 * Genera public/openapi/taimbox-integration-api.json desde tables.ts
 * Ejecutar: node scripts/generate-openapi.mjs
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadIntegrationTables } from './lib/parse-api-docs-tables.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'openapi');
const OUT_FILE = join(OUT_DIR, 'taimbox-integration-api.json');

const API_BASE = 'https://api.taimbox.com';

/** Alineado con overview.rls y referencia de la doc API. */
const ACCESS = {
  agencies: { read: true, write: false, note: 'GET devuelve [] por RLS; no usar para obtener agency_id.' },
  employees: { read: true, write: true },
  clients: { read: true, write: true },
  projects: { read: true, write: true },
  allocations: { read: true, write: false, note: 'Solo lectura con token API.' },
  allocation_notes: { read: true, write: true },
  deadlines: { read: true, write: true },
  time_entries: { read: false, write: false, appOnly: true },
  active_timers: { read: false, write: false, appOnly: true },
  timer_sessions: { read: false, write: false, appOnly: true },
  task_transfers: { read: true, write: 'create', note: 'POST para crear solicitud; aceptación solo en app.' },
  absences: { read: true, write: true },
  team_events: { read: true, write: true },
  global_assignments: { read: true, write: true },
  department_config: { read: true, write: true },
  client_settings: { read: true, write: true },
  weekly_feedback: { read: true, write: true },
  professional_goals: { read: true, write: true },
  user_routines: { read: true, write: true },
  project_editing_locks: { read: true, write: true },
};

const RPC_INTEGRATION = [
  {
    name: 'list_my_agencies_directory',
    summary: 'List agency directory (optional)',
    description:
      'Returns id and name for agencies the caller can access. Optional with API token; mainly useful with multi-agency app sessions.',
  },
];

const RPC_APP_ONLY = [
  {
    name: 'log_timer_hours',
    summary: 'Log timer hours (app only)',
    description: 'Registers hours when stopping the timer. Requires app user session, not integration Bearer token.',
  },
  {
    name: 'get_team_active_timers',
    summary: 'List team active timers (app only)',
    description: 'Lists active timers for the team. Requires app user session.',
  },
  {
    name: 'accept_task_transfer',
    summary: 'Accept task transfer (app only)',
    description: 'Atomic transfer acceptance. Callable only by the authenticated receiver in the app.',
  },
];

function mapColumnType(pgType) {
  switch (pgType) {
    case 'uuid':
      return { type: 'string', format: 'uuid' };
    case 'text':
    case 'varchar':
      return { type: 'string' };
    case 'numeric':
      return { type: 'number' };
    case 'integer':
      return { type: 'integer' };
    case 'boolean':
      return { type: 'boolean' };
    case 'jsonb':
      return { type: 'object' };
    case 'timestamptz':
      return { type: 'string', format: 'date-time' };
    case 'date':
      return { type: 'string', format: 'date' };
    default:
      return { type: 'string' };
  }
}

function buildSchema(columns) {
  const properties = {};
  const required = [];
  for (const col of columns) {
    properties[col.name] = {
      ...mapColumnType(col.type),
      description: col.description,
    };
    if (col.required && !col.pk) {
      required.push(col.name);
    }
  }
  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

function buildTablePaths(table, access) {
  const path = `/rest/v1/${table.name}`;
  const schemaRef = `#/components/schemas/${table.name}`;
  const tag = access.appOnly ? 'App only (not integration token)' : 'Integration resources';
  const commonParams = [
    { $ref: '#/components/parameters/preferReturn' },
  ];
  const getParams = [
    { $ref: '#/components/parameters/select' },
    { $ref: '#/components/parameters/order' },
    { $ref: '#/components/parameters/limit' },
    { $ref: '#/components/parameters/offset' },
  ];

  const ops = {};

  if (access.read) {
    ops.get = {
      tags: [tag],
      summary: `List ${table.name}`,
      description: [table.description, table.authNote, access.note].filter(Boolean).join(' '),
      operationId: `list_${table.name}`,
      parameters: getParams,
      responses: {
        '200': {
          description: 'Array of rows (may be empty when RLS filters all results).',
          content: {
            'application/json': {
              schema: { type: 'array', items: { $ref: schemaRef } },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
      security: [{ ApiKeyAuth: [], BearerAuth: [] }],
      'x-taimbox-read': true,
    };
  } else if (access.appOnly) {
    ops.get = {
      tags: [tag],
      summary: `List ${table.name} (not available via integration token)`,
      description: `${table.description} ${table.authNote}`,
      operationId: `list_${table.name}_app_only`,
      deprecated: true,
      responses: {
        '403': { $ref: '#/components/responses/Forbidden' },
      },
      'x-taimbox-app-only': true,
    };
  }

  if (access.write === true) {
    ops.post = {
      tags: [tag],
      summary: `Create ${table.name}`,
      description: `${table.description} Requires readwrite token where RLS allows INSERT.`,
      operationId: `create_${table.name}`,
      parameters: commonParams,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: schemaRef },
          },
        },
      },
      responses: {
        '201': {
          description: 'Created row (with Prefer: return=representation).',
          content: { 'application/json': { schema: { $ref: schemaRef } } },
        },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
      security: [{ ApiKeyAuth: [], BearerAuth: [] }],
      'x-taimbox-write': 'readwrite',
    };
    ops.patch = {
      tags: [tag],
      summary: `Update ${table.name}`,
      operationId: `update_${table.name}`,
      parameters: [
        { name: 'id', in: 'query', required: true, schema: { type: 'string' }, description: 'Filter: id=eq.{uuid}' },
        ...commonParams,
      ],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: schemaRef } } },
      },
      responses: {
        '200': { description: 'Updated row.', content: { 'application/json': { schema: { $ref: schemaRef } } } },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
      security: [{ ApiKeyAuth: [], BearerAuth: [] }],
      'x-taimbox-write': 'readwrite',
    };
    ops.delete = {
      tags: [tag],
      summary: `Delete ${table.name}`,
      operationId: `delete_${table.name}`,
      parameters: [
        { name: 'id', in: 'query', required: true, schema: { type: 'string' }, description: 'Filter: id=eq.{uuid}' },
      ],
      responses: {
        '204': { description: 'Deleted.' },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
      security: [{ ApiKeyAuth: [], BearerAuth: [] }],
      'x-taimbox-write': 'readwrite',
    };
  } else if (access.write === 'create') {
    ops.post = {
      tags: [tag],
      summary: `Create ${table.name} request`,
      description: access.note ?? table.description,
      operationId: `create_${table.name}`,
      parameters: commonParams,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: schemaRef } } },
      },
      responses: {
        '201': { description: 'Created.', content: { 'application/json': { schema: { $ref: schemaRef } } } },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
      security: [{ ApiKeyAuth: [], BearerAuth: [] }],
      'x-taimbox-write': 'create-only',
    };
  }

  return { [path]: ops };
}

function buildRpcPath(rpc, integration) {
  const path = `/rest/v1/rpc/${rpc.name}`;
  return {
    [path]: {
      post: {
        tags: [integration ? 'RPC (integration)' : 'App only (not integration token)'],
        summary: rpc.summary,
        description: rpc.description,
        operationId: `rpc_${rpc.name}`,
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: {
          '200': { description: 'RPC result (JSON).' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
        ...(integration
          ? { security: [{ ApiKeyAuth: [], BearerAuth: [] }], 'x-taimbox-integration': true }
          : { deprecated: true, 'x-taimbox-app-only': true }),
      },
    },
  };
}

function buildSpec(tables) {
  const paths = {};
  const schemas = {};

  for (const table of tables) {
    const access = ACCESS[table.name] ?? { read: true, write: false };
    schemas[table.name] = buildSchema(table.columns);
    Object.assign(paths, buildTablePaths(table, access));
  }

  for (const rpc of RPC_INTEGRATION) {
    Object.assign(paths, buildRpcPath(rpc, true));
  }
  for (const rpc of RPC_APP_ONLY) {
    Object.assign(paths, buildRpcPath(rpc, false));
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'Taimbox Integration API',
      version: '1.0.0',
      description:
        'OpenAPI spec for Taimbox agency integration (PostgREST). Curated from the public API docs; RLS and token scopes may restrict operations not listed as available. Human-readable docs: https://taimbox.com/api-docs',
      contact: {
        name: 'Taimbox',
        url: 'https://taimbox.com/contacto',
      },
    },
    servers: [{ url: API_BASE, description: 'Taimbox API (PostgREST)' }],
    tags: [
      { name: 'Integration resources', description: 'Tables available for agency integrations (subject to RLS).' },
      { name: 'RPC (integration)', description: 'RPC callable with integration token when documented.' },
      { name: 'App only (not integration token)', description: 'Documented for reference; not available with API Bearer token.' },
    ],
    paths,
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'apikey',
          description: 'Supabase ANON_KEY for your instance.',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'API token from Taimbox → API e integraciones.',
        },
      },
      parameters: {
        select: {
          name: 'select',
          in: 'query',
          schema: { type: 'string' },
          description: 'PostgREST column selection (e.g. id,name).',
        },
        order: {
          name: 'order',
          in: 'query',
          schema: { type: 'string' },
          description: 'PostgREST order (e.g. name.asc).',
        },
        limit: {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Max rows (PostgREST).',
        },
        offset: {
          name: 'offset',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Skip rows (PostgREST).',
        },
        preferReturn: {
          name: 'Prefer',
          in: 'header',
          schema: { type: 'string', enum: ['return=representation'] },
          description: 'Return created/updated row in response body.',
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid apikey / token.',
        },
        Forbidden: {
          description: 'RLS or readonly token denies the operation.',
        },
      },
      schemas,
    },
    security: [{ ApiKeyAuth: [], BearerAuth: [] }],
  };
}

mkdirSync(OUT_DIR, { recursive: true });
const tables = loadIntegrationTables();
const spec = buildSpec(tables);
writeFileSync(OUT_FILE, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(`OpenAPI written: ${OUT_FILE} (${tables.length} tables, ${Object.keys(spec.paths).length} paths)`);

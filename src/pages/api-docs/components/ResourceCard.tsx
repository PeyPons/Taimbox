import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AuthBadge } from './AuthBadge';
import { ParamTable } from './ParamTable';
import { MethodBadge } from './MethodBadge';
import { CodeBlock } from './CodeBlock';
import { ResponseExample } from './ResponseExample';
import type { TableDef } from '../data/types';

const API_BASE_URL = 'http://supabase.peypons.duckdns.org/rest/v1';

function buildDefaultCurlSelect(tableName: string): string {
  return `curl -X GET \\
  '${API_BASE_URL}/${tableName}?select=*' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>'`;
}

function buildDefaultCurlInsert(tableName: string): string {
  return `curl -X POST \\
  '${API_BASE_URL}/${tableName}' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -H 'Prefer: return=representation' \\
  -d '{}'`;
}

interface ResourceCardProps {
  table: TableDef;
  defaultExpanded?: boolean;
}

export function ResourceCard({ table, defaultExpanded = false }: ResourceCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [exampleLang, setExampleLang] = useState<'typescript' | 'curl'>('typescript');

  const curlSelect = (table.examples.curlSelect ?? buildDefaultCurlSelect(table.name)).replace(
    '<BASE_URL>',
    API_BASE_URL
  );
  const curlInsert = (table.examples.curlInsert ?? buildDefaultCurlInsert(table.name)).replace(
    '<BASE_URL>',
    API_BASE_URL
  );

  return (
    <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 border-b border-white/10 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-indigo-400 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-indigo-400 shrink-0" />
            )}
            <h4 className="text-white font-bold font-mono text-lg">{table.name}</h4>
          </div>
          <AuthBadge note={table.authNote} />
        </div>
        <p className="text-sm text-indigo-200/80 pl-6">{table.description}</p>
      </button>

      {expanded && (
        <CardContent className="p-5 space-y-6">
          <div>
            <h5 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-indigo-400" /> Columnas
            </h5>
            <ParamTable columns={table.columns} />
          </div>

          <div>
            <h5 className="text-white font-semibold text-sm mb-3">Ejemplos de respuesta</h5>
            <ResponseExample
              getList={table.responses.getList}
              getOne={table.responses.getOne}
              post={table.responses.post}
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h5 className="text-white font-semibold text-sm">Ejemplos de uso</h5>
              <div className="flex rounded-lg border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExampleLang('typescript')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${exampleLang === 'typescript'
                      ? 'bg-indigo-500/30 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  TypeScript
                </button>
                <button
                  type="button"
                  onClick={() => setExampleLang('curl')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${exampleLang === 'curl'
                      ? 'bg-indigo-500/30 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  cURL
                </button>
              </div>
            </div>
            <div
              className={
                exampleLang === 'curl'
                  ? 'flex flex-col gap-4'
                  : 'grid lg:grid-cols-2 gap-4'
              }
            >
              <div className={exampleLang === 'curl' ? 'min-w-0' : ''}>
                <div className="text-white/70 text-xs font-medium mb-1.5 flex items-center gap-2">
                  <MethodBadge method="GET" /> <span>Consultar</span>
                </div>
                {exampleLang === 'typescript' ? (
                  <CodeBlock lang="typescript">{table.examples.select}</CodeBlock>
                ) : (
                  <CodeBlock lang="bash">{curlSelect}</CodeBlock>
                )}
              </div>
              <div className={exampleLang === 'curl' ? 'min-w-0' : ''}>
                <div className="text-white/70 text-xs font-medium mb-1.5 flex items-center gap-2">
                  <MethodBadge method="POST" /> <span>Crear</span>
                </div>
                {exampleLang === 'typescript' ? (
                  <CodeBlock lang="typescript">{table.examples.insert}</CodeBlock>
                ) : (
                  <CodeBlock lang="bash">{curlInsert}</CodeBlock>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

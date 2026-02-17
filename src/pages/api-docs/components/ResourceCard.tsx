import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { AuthBadge } from './AuthBadge';
import { ParamTable } from './ParamTable';
import { MethodBadge } from './MethodBadge';
import { CodeBlock } from './CodeBlock';
import { ResponseExample } from './ResponseExample';
import type { TableDef } from '../data/types';

interface ResourceCardProps {
  table: TableDef;
  defaultExpanded?: boolean;
}

export function ResourceCard({ table, defaultExpanded = false }: ResourceCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

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

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <MethodBadge method="GET" /> <span>Consultar</span>
              </h5>
              <CodeBlock lang="typescript">{table.examples.select}</CodeBlock>
            </div>
            <div>
              <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <MethodBadge method="POST" /> <span>Crear</span>
              </h5>
              <CodeBlock lang="typescript">{table.examples.insert}</CodeBlock>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

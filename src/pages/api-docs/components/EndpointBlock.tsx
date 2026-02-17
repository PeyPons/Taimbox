import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MethodBadge } from './MethodBadge';
import { CodeBlock } from './CodeBlock';

interface EndpointBlockProps {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  curlExample: string;
  sdkExample: string;
}

export function EndpointBlock({ method, path, description, curlExample, sdkExample }: EndpointBlockProps) {
  const [tab, setTab] = useState<'curl' | 'sdk'>('sdk');
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <MethodBadge method={method} />
          <code className="text-sm font-mono text-slate-200">{path}</code>
        </div>
        <p className="text-sm text-indigo-200/80">{description}</p>
      </div>
      <div className="border-b border-white/10 flex">
        <button
          onClick={() => setTab('sdk')}
          className={cn('px-4 py-2 text-xs font-medium transition-colors', tab === 'sdk' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white')}
        >
          JavaScript SDK
        </button>
        <button
          onClick={() => setTab('curl')}
          className={cn('px-4 py-2 text-xs font-medium transition-colors', tab === 'curl' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white')}
        >
          cURL
        </button>
      </div>
      <div className="p-3">
        {tab === 'sdk' ? <CodeBlock lang="typescript">{sdkExample}</CodeBlock> : <CodeBlock lang="bash">{curlExample}</CodeBlock>}
      </div>
    </div>
  );
}

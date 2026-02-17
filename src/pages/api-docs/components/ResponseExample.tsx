import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CodeBlock } from './CodeBlock';

interface ResponseExampleProps {
  getList: string;
  getOne: string;
  post: string;
}

const TABS = [
  { key: 'getList' as const, label: 'GET (lista)', status: 200 },
  { key: 'getOne' as const, label: 'GET (uno)', status: 200 },
  { key: 'post' as const, label: 'POST', status: 201 },
];

export function ResponseExample({ getList, getOne, post }: ResponseExampleProps) {
  const [active, setActive] = useState<'getList' | 'getOne' | 'post'>('getList');
  const responses = { getList, getOne, post };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex items-center border-b border-white/10">
        <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400/60">Response</span>
        <div className="flex ml-auto">
          {TABS.map(({ key, label, status }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={cn(
                'px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5',
                active === key ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white',
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  status < 300 ? 'bg-emerald-400' : 'bg-blue-400',
                )}
              />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3">
        <CodeBlock lang="json">{responses[active]}</CodeBlock>
      </div>
    </div>
  );
}

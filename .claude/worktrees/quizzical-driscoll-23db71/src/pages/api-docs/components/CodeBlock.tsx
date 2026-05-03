import { CopyButton } from './CopyButton';

export function CodeBlock({ children, lang = 'typescript' }: { children: string; lang?: string }) {
  return (
    <div className="relative group">
      <div className="absolute top-0 left-0 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-slate-800/50 rounded-br-lg">
        {lang}
      </div>
      <CopyButton text={children} />
      <pre className="p-4 pt-8 rounded-lg bg-slate-950 border border-white/10 text-sm text-slate-200 overflow-x-auto font-mono leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

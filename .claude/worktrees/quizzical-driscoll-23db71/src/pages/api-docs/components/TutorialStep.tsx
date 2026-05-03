import { CodeBlock } from './CodeBlock';

interface TutorialStepProps {
  step: number;
  title: string;
  description: string;
  code?: string;
  lang?: string;
  note?: string;
}

export function TutorialStep({ step, title, description, code, lang = 'typescript', note }: TutorialStepProps) {
  return (
    <div className="relative pl-10 pb-8 border-l-2 border-indigo-500/20 last:border-l-0 last:pb-0">
      <div className="absolute -left-[17px] top-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-bold border-2 border-indigo-500/30">
        {step}
      </div>
      <h4 className="text-white font-semibold mb-2">{title}</h4>
      <p className="text-sm text-indigo-200/80 mb-3 leading-relaxed">{description}</p>
      {code && <CodeBlock lang={lang}>{code}</CodeBlock>}
      {note && (
        <div className="mt-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-xs text-indigo-100/90 leading-relaxed">{note}</p>
        </div>
      )}
    </div>
  );
}

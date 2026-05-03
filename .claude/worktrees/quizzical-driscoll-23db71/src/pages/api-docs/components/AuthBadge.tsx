import { Lock } from 'lucide-react';

export function AuthBadge({ note }: { note: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
      <Lock className="h-3 w-3" />
      {note}
    </div>
  );
}

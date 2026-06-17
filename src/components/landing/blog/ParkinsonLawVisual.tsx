import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function ParkinsonLawVisual() {
  const [start, setStart] = useState(false);
  const { t } = useTranslation('blog');
  const compKey = 'components.parkinsonLawVisual';

  useEffect(() => {
    const t = setTimeout(() => setStart(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-5 sm:p-8 overflow-hidden">
      <p className="text-center text-indigo-200/90 text-sm font-medium mb-6">
        {t(`${compKey}.p1`)}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        <div>
          <div className="flex justify-between text-xs text-indigo-300/90 mb-2">
            <span>{t(`${compKey}.week`)}</span>
            <span className="text-amber-300/90">{t(`${compKey}.weekUsed`)}</span>
          </div>
          <div className="h-10 rounded-lg bg-white/10 border border-white/10 overflow-hidden">
            <div
              className="h-full rounded-lg bg-gradient-to-r from-amber-500/90 to-orange-500/90 origin-left transition-all duration-\[2.5s\] ease-out"
              style={{ width: start ? '100%' : '0%' }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-indigo-300/90 mb-2">
            <span>{t(`${compKey}.day`)}</span>
            <span className="text-emerald-300/90">{t(`${compKey}.dayUsed`)}</span>
          </div>
          <div className="h-10 rounded-lg bg-white/10 border border-white/10 overflow-hidden">
            <div
              className="h-full rounded-lg bg-gradient-to-r from-emerald-500/90 to-teal-500/90 origin-left transition-all duration-\[2s\] ease-out"
              style={{ width: start ? '100%' : '0%' }}
            />
          </div>
        </div>
      </div>
      <p className="text-center text-indigo-300/80 text-xs mt-4 italic">
        {t(`${compKey}.footer`)}
      </p>
    </div>
  );
}

import { Users, UserPlus, UserMinus, LayoutGrid, Shield, Gauge, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SuggestionsFlowMode, SuggestionsFlowPreset } from '@/utils/deadlinesSuggestionsPrefs';

export function SuggestionIntentPicker({
  onSelect,
  lastMode,
}: {
  onSelect: (mode: SuggestionsFlowMode, preset?: SuggestionsFlowPreset) => void;
  lastMode?: SuggestionsFlowMode;
}) {
  const { t } = useTranslation('app');

  const options: {
    mode: SuggestionsFlowMode;
    preset?: SuggestionsFlowPreset;
    title: string;
    description: string;
    icon: typeof Users;
  }[] = [
    {
      mode: 'give',
      preset: 'prudent',
      title: t('deadlines.suggestions.giveHours', 'Dar horas a alguien'),
      description: t('deadlines.suggestions.giveHoursDesc', 'Elige quién necesita carga. Por defecto: solo proyectos en común y quienes comparten proyecto.'),
      icon: UserPlus,
    },
    {
      mode: 'take',
      preset: 'prudent',
      title: t('deadlines.suggestions.takeLoad', 'Quitar carga a alguien'),
      description: t('deadlines.suggestions.takeLoadDesc', 'Elige quién va sobrecargado y a quién puede pasarle horas en proyectos compartidos.'),
      icon: UserMinus,
    },
    {
      mode: 'team',
      preset: 'explore',
      title: t('deadlines.suggestions.balanceTeam', 'Equilibrar todo el equipo'),
      description: t('deadlines.suggestions.balanceTeamDesc', 'Vista global: varias personas, límites de carga y mínimo por movimiento.'),
      icon: LayoutGrid,
    },
  ];

  const quickPresets: {
    preset: SuggestionsFlowPreset;
    mode: SuggestionsFlowMode;
    title: string;
    icon: typeof Shield;
  }[] = [
    { preset: 'prudent', mode: 'give', title: t('deadlines.suggestions.presetPrudentGive', 'Reparto prudente (dar)'), icon: Shield },
    { preset: 'heavy', mode: 'take', title: t('deadlines.suggestions.presetHeavyTake', 'Solo muy cargados ceden'), icon: Gauge },
  ];

  return (
    <div className="space-y-4 py-1">
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-slate-800">{t('deadlines.suggestions.intentTitle', '¿Qué quieres hacer?')}</p>
          <p className="text-xs text-slate-600 mt-0.5">
            {t('deadlines.suggestions.intentDescription', 'Te guiamos paso a paso: persona → reglas (quién cede / proyectos) → detalle. Los cambios los aplicas en cada proyecto.')}
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const highlighted = lastMode === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => onSelect(opt.mode, opt.preset)}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary/40 hover:bg-slate-50 ${
                highlighted ? 'border-primary/50 bg-primary/5' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{opt.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.description}</p>
                {highlighted && (
                  <p className="text-[10px] text-primary font-medium mt-1">{t('deadlines.suggestions.lastUsed', 'Usado la última vez')}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Compass className="h-3 w-3" />
          {t('deadlines.suggestions.shortcuts', 'Atajos')}
        </p>
        <div className="flex flex-wrap gap-2">
          {quickPresets.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={`${q.preset}-${q.mode}`}
                type="button"
                onClick={() => onSelect(q.mode, q.preset)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <Icon className="h-3 w-3 text-primary" />
                {q.title}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

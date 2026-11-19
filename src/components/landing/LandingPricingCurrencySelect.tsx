import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Coins, Loader2 } from 'lucide-react';

import type { AgencyCurrencyCode } from '@/constants/currencies';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Variant = 'light' | 'dark';

interface LandingPricingCurrencySelectProps {
  currency: AgencyCurrencyCode;
  onCurrencyChange: (code: AgencyCurrencyCode) => void;
  options: { value: AgencyCurrencyCode; label: string }[];
  loading?: boolean;
  variant?: Variant;
  compact?: boolean;
}

export const LandingPricingCurrencySelect: FC<LandingPricingCurrencySelectProps> = ({
  currency,
  onCurrencyChange,
  options,
  loading = false,
  variant = 'light',
  compact = false,
}) => {
  const { t } = useTranslation('landing');
  const isDark = variant === 'dark';

  return (
    <div
      className={`flex flex-row items-center justify-center ${
        compact ? 'mb-4 gap-2 sm:mb-8 sm:gap-4' : 'mb-8 gap-3 sm:mb-10 sm:gap-4'
      } ${isDark ? 'text-indigo-100/90' : 'text-slate-600'}`}
    >
      <span
        className={`inline-flex items-center gap-2 font-medium ${
          compact ? 'text-[11px] sm:text-xs' : 'text-xs'
        } ${isDark ? 'text-indigo-200/80' : ''}`}
      >
        <Coins
          className={`h-3.5 w-3.5 shrink-0 ${compact ? 'hidden sm:block' : ''} ${
            isDark ? 'text-amber-400' : 'text-amber-700'
          }`}
          aria-hidden
        />
        {t('pricing.currencyLabel')}
      </span>
      <Select value={currency} onValueChange={(v) => onCurrencyChange(v as AgencyCurrencyCode)}>
        <SelectTrigger
          className={`h-9 min-w-0 max-w-[17rem] flex-1 text-sm font-medium sm:w-[17rem] sm:flex-none ${
            isDark
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
              : 'bg-white border-slate-200/80 text-slate-900 shadow-sm'
          }`}
          aria-label={t('pricing.currencyLabel')}
        >
          <SelectValue />
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin opacity-60 ml-1" aria-hidden /> : null}
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

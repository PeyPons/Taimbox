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
}

export const LandingPricingCurrencySelect: FC<LandingPricingCurrencySelectProps> = ({
  currency,
  onCurrencyChange,
  options,
  loading = false,
  variant = 'light',
}) => {
  const { t } = useTranslation('landing');
  const isDark = variant === 'dark';

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10 ${
        isDark ? 'text-indigo-100/90' : 'text-slate-600'
      }`}
    >
      <span className={`inline-flex items-center gap-2 text-xs font-medium ${isDark ? 'text-indigo-200/80' : ''}`}>
        <Coins className={`h-3.5 w-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} aria-hidden />
        {t('pricing.currencyLabel')}
      </span>
      <Select value={currency} onValueChange={(v) => onCurrencyChange(v as AgencyCurrencyCode)}>
        <SelectTrigger
          className={`w-[min(100%,14rem)] h-9 text-sm font-medium ${
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

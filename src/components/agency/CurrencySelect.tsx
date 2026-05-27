import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AGENCY_CURRENCY_OPTIONS, type AgencyCurrencyCode } from '@/constants/currencies';

type CurrencySelectProps = {
  value: AgencyCurrencyCode;
  onValueChange: (value: AgencyCurrencyCode) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function CurrencySelect({
  value,
  onValueChange,
  disabled,
  id,
  className,
}: CurrencySelectProps) {
  const { i18n } = useTranslation('app');
  const isEn = i18n.language?.startsWith('en');

  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as AgencyCurrencyCode)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {AGENCY_CURRENCY_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {isEn ? opt.labelEn : opt.labelEs}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

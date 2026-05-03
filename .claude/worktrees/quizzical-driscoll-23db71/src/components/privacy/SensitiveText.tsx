import { AnonymizedContent } from '@/components/ads/AnonymizedContent';
import { usePrivacyDemo } from '@/contexts/PrivacyDemoContext';
import type { PrivacyAnonymizer } from '@/lib/privacyDemoAnonymizer';

export type SensitiveKind = 'account' | 'campaign' | 'employee' | 'project' | 'task' | 'department';

interface SensitiveTextProps {
  kind: SensitiveKind;
  id: string;
  children: React.ReactNode;
  className?: string;
  asBlock?: boolean;
}

function placeholderFor(kind: SensitiveKind, id: string, anonymizer: PrivacyAnonymizer): string {
  switch (kind) {
    case 'account':
      return anonymizer.account(id);
    case 'campaign':
      return anonymizer.campaign(id);
    case 'employee':
      return anonymizer.employee(id);
    case 'project':
      return anonymizer.project(id);
    case 'task':
      return anonymizer.task(id);
    case 'department':
      return anonymizer.department(id);
    default:
      return anonymizer.project(id);
  }
}

/**
 * Oculta visualmente el contenido sensible cuando el modo demostración está activo (misma integración que Ads).
 */
export function SensitiveText({ kind, id, children, className, asBlock }: SensitiveTextProps) {
  const { isActive, anonymizer } = usePrivacyDemo();
  const placeholder = placeholderFor(kind, id, anonymizer);

  return (
    <AnonymizedContent isActive={isActive} className={className} asBlock={asBlock} placeholder={placeholder}>
      {children}
    </AnonymizedContent>
  );
}

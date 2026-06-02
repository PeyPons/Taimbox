import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OpenProjectButton({
  projectId,
  onOpenProject,
  className,
  size = 'sm',
}: {
  projectId: string;
  onOpenProject?: (projectId: string) => void;
  className?: string;
  size?: 'sm' | 'default';
}) {
  const { t } = useTranslation('app');

  if (!onOpenProject) return null;
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={className}
      onClick={() => onOpenProject(projectId)}
    >
      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
      {t('deadlines.suggestions.openProject', 'Ir al proyecto')}
    </Button>
  );
}

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DEFAULT_PORTAL_URL = import.meta.env.VITE_REVIEW_PORTAL_URL ?? 'http://localhost:5174';

/**
 * Enlace al portal standalone de Review Agents (ia-srv / subdominio review.*).
 * Misma sesión Supabase si el portal comparte VITE_SUPABASE_*.
 */
export default function ReviewAgentsPage() {
  const { t } = useTranslation('app');
  const portalUrl = useMemo(() => DEFAULT_PORTAL_URL.replace(/\/$/, ''), []);

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('reviewAgents.title', 'Agentes de revisión')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t(
            'reviewAgents.description',
            'Sube documentos o URLs, elige una skill de revisión y obtén un informe con Ollama.',
          )}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('reviewAgents.portalCardTitle', 'Portal de revisión')}</CardTitle>
          <CardDescription>
            {t(
              'reviewAgents.portalCardDesc',
              'El procesamiento corre en el servidor de IA (jobs largos, varios documentos). Abre el portal con tu misma cuenta.',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href={portalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t('reviewAgents.openPortal', 'Abrir portal')}
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

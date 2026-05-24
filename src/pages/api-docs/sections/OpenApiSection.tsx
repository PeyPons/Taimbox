import { Link } from 'react-router-dom';
import { FileCode, Download, ExternalLink, BookOpenCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { localizedPathFromEs } from '@/i18n/publicPaths';
import { SectionHeading } from '../components/SectionHeading';

const OPENAPI_URL = '/openapi/taimbox-integration-api.json';

export function OpenApiSection() {
  const { t, i18n } = useTranslation('apiDocs');
  const viewerPath = localizedPathFromEs('/api-docs/openapi', i18n.language);

  return (
    <section>
      <SectionHeading id="openapi" icon={FileCode} className="mb-6">
        {t('openapi.title')}
      </SectionHeading>
      <p className="text-indigo-100/85 mb-4">{t('openapi.intro')}</p>
      <p className="text-indigo-100/70 text-sm mb-6">{t('openapi.note')}</p>

      <Card className="border border-indigo-400/30 bg-indigo-500/[0.08] backdrop-blur-xl mb-6">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/25 flex items-center justify-center shrink-0">
              <BookOpenCheck className="h-4 w-4 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{t('openapi.viewerCardTitle')}</h3>
              <p className="text-xs text-indigo-100/75 mt-1 leading-relaxed">{t('openapi.viewerCardBody')}</p>
            </div>
          </div>
          <Link to={viewerPath}>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-500 hover:to-purple-500 gap-2">
              <BookOpenCheck className="h-4 w-4" />
              {t('openapi.openViewer')}
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <a href={OPENAPI_URL} download="taimbox-integration-api.json">
          <Button
            type="button"
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white gap-2"
          >
            <Download className="h-4 w-4" />
            {t('openapi.download')}
          </Button>
        </a>
        <a href={OPENAPI_URL} target="_blank" rel="noopener noreferrer">
          <Button
            type="button"
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {t('openapi.openRaw')}
          </Button>
        </a>
      </div>
    </section>
  );
}

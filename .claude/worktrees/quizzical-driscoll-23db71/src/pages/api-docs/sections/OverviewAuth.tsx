import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Key, Shield, AlertTriangle, Clock, RefreshCw, Eye } from 'lucide-react';
import { localizedPathFromEs } from '@/i18n/publicPaths';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { SectionHeading } from '../components/SectionHeading';
import { CodeBlock } from '../components/CodeBlock';

const SECURITY_ICONS = [Eye, RefreshCw, Shield, Clock] as const;

type SecurityItem = { title: string; text: string };

export function OverviewAuth() {
  const { t, i18n } = useTranslation('apiDocs');
  const steps = i18nAsArray<string>(t('overview.auth.steps', { returnObjects: true }));
  const security = i18nAsArray<SecurityItem>(t('overview.auth.security', { returnObjects: true }));
  const apiKeysPath = localizedPathFromEs('/api-keys', i18n.language);

  return (
    <section>
      <SectionHeading id="auth" icon={Key} className="mb-6">
        {t('overview.auth.title')}
      </SectionHeading>
      <p className="text-indigo-100/85 mb-6">
        {t('overview.auth.intro')}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {t('headerBadge')}
              </span>
              <code className="text-white font-medium text-sm font-mono">apikey</code>
            </div>
            <p className="text-xs text-indigo-200/70 leading-relaxed">
              <Trans
                i18nKey="overview.auth.apikeyBody"
                ns="apiDocs"
                components={{
                  code: <code className="text-indigo-200 bg-white/10 px-1 rounded font-mono" />,
                }}
              />
            </p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {t('headerBadge')}
              </span>
              <code className="text-white font-medium text-sm font-mono">Authorization</code>
            </div>
            <p className="text-xs text-indigo-200/70 leading-relaxed">
              <Trans
                i18nKey="overview.auth.authBody"
                ns="apiDocs"
                components={{
                  0: <Link to={apiKeysPath} className="text-indigo-300 underline hover:text-white" />,
                  code: <code className="text-indigo-200 bg-white/10 px-1 rounded font-mono text-xs" />,
                }}
              />
            </p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-white font-semibold mb-3">{t('overview.auth.howToTitle')}</h3>
      <div className="mb-6 space-y-3">
        {steps.map((text, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold shrink-0">
              {i + 1}
            </span>
            <span className="text-sm text-indigo-100/85">{text}</span>
          </div>
        ))}
      </div>

      <h3 className="text-white font-semibold mb-3">{t('overview.auth.exampleTitle')}</h3>
      <CodeBlock lang="bash">{t('overview.auth.curlExample')}</CodeBlock>

      <h3 className="text-white font-semibold mt-8 mb-4">{t('overview.auth.securityTitle')}</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {security.map((item, idx) => {
          const Icon = SECURITY_ICONS[idx] ?? Shield;
          return (
            <div
              key={item.title}
              className="p-4 rounded-lg bg-white/[0.03] border border-white/5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">{item.title}</span>
              </div>
              <p className="text-xs text-indigo-200/70 leading-relaxed">{item.text}</p>
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div className="text-sm text-indigo-100/90">
              <strong className="text-indigo-300">{t('overview.auth.rlsTitle')}</strong>{' '}
              <Trans
                i18nKey="overview.auth.rlsBody"
                ns="apiDocs"
                components={{
                  code: <code className="px-1 rounded bg-white/10 font-mono text-xs" />,
                }}
              />
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-100/90">
              <strong className="text-amber-300">{t('overview.auth.rateTitle')}</strong>{' '}
              {t('overview.auth.rateBody')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

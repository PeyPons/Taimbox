import { useTranslation } from 'react-i18next';
import { LandingArticle } from '@/components/landing/LandingArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { SeoTags } from '@/seo/SeoTags';

export default function ArticlePage() {
  const { t, i18n } = useTranslation('landing');
  const lang = i18n.language.startsWith('en') ? 'en' : 'es';

  return (
    <>
      <SeoTags
        pathEs="/por-que-timeboxing"
        pathEn="/en/why-taimbox"
        title={t('articleWhy.seoTitle')}
        description={t('articleWhy.seoDescription')}
        lang={lang}
        jsonLd={[
          {
            '@type': 'Article',
            headline: t('articleWhy.jsonHeadline'),
            description: t('articleWhy.jsonArticleDesc'),
            author: { '@type': 'Organization', name: 'Taimbox' },
            publisher: { '@type': 'Organization', name: 'Taimbox' },
          },
          {
            '@type': 'SoftwareApplication',
            name: 'Taimbox',
            applicationCategory: 'BusinessApplication',
            description: t('articleWhy.jsonSoftwareDesc'),
          },
        ]}
      />

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        <LandingHeader />

        <div className="relative z-10">
          <LandingArticle />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingPricingCurrencySelect } from '@/components/landing/LandingPricingCurrencySelect';
import { PublicPriceDecision } from '@/components/landing/PublicPriceDecision';
import { SeoTags } from '@/seo/SeoTags';
import { usePublicPricingCurrency } from '@/hooks/usePublicPricingCurrency';

export default function PreciosPage() {
  const { t, i18n } = useTranslation('landing');
  const lang = i18n.language.startsWith('en') ? 'en' : 'es';

  const { currency, setCurrency, currencyOptions, ratesLoading, formatMonthly, billingNote } =
    usePublicPricingCurrency();

  const enterpriseMail = `mailto:hello@taimbox.com?subject=${encodeURIComponent(t('pricing.enterpriseMailSubject'))}`;

  return (
    <>
      <SeoTags
        pathEs="/precios"
        pathEn="/en/pricing"
        title={t('pricing.seoTitle')}
        description={t('pricing.seoDescription')}
        lang={lang}
      />

      <div className="pub-stage pub-stage--plain relative min-h-screen overflow-x-clip bg-[#14123B]">
        <LandingHeader />

        <article className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
          <header className="mx-auto mb-8 max-w-3xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C4B5FD]">
              {t('pricing.heroKicker')}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
              {t('pricing.heroLine1')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#D4CEF0] sm:text-lg">
              {t('pricing.heroSub')}
            </p>
          </header>

          <LandingPricingCurrencySelect
            currency={currency}
            onCurrencyChange={setCurrency}
            options={currencyOptions}
            loading={ratesLoading}
            variant="dark"
          />
          <p className="-mt-4 mb-2 text-center text-[11px] text-[#D4CEF0]">{billingNote}</p>

          <PublicPriceDecision formatMoney={formatMonthly} enterpriseMail={enterpriseMail} />

          <p className="mt-10 text-center text-sm text-[#D4CEF0]">
            {t('pricing.finalLogin')}{' '}
            <Link to="/login" className="text-white underline decoration-[#C4B5FD] underline-offset-4">
              {t('pricing.finalLoginLink')}
            </Link>
          </p>
        </article>

        <LandingFooter variant="stage" />
      </div>
    </>
  );
}

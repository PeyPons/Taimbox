import { PlannerGrid } from '@/components/planner/PlannerGrid';
import { Helmet } from 'react-helmet-async';
import { useAppTranslation } from '@/hooks/useAppTranslation';

const Index = () => {
  const { t } = useAppTranslation();
  return (
    <>
      <Helmet>
        <title>{t('dashboard.metaTitle')}</title>
        <meta name="description" content={t('dashboard.metaDescription')} />
      </Helmet>
      <div className="h-screen flex flex-col">
        <PlannerGrid />
      </div>
    </>
  );
};

export default Index;

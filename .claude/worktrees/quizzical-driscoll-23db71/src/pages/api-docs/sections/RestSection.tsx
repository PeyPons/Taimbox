import { Plug } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from '../components/SectionHeading';
import { EndpointBlock } from '../components/EndpointBlock';

const HTTP_BASE = 'https://api.taimbox.com';

function expandBase(curl: string): string {
  return curl.split('<BASE_URL>').join(HTTP_BASE);
}

export function RestSection() {
  const { t } = useTranslation('apiDocs');

  return (
    <section>
      <SectionHeading id="rest" icon={Plug} className="mb-6">
        {t('rest.title')}
      </SectionHeading>
      <p className="text-indigo-100/85 mb-6">
        {t('rest.intro')}
      </p>
      <div className="space-y-6">
        <EndpointBlock
          method="GET"
          path="/rest/v1/{recurso}?select=col1,col2&filtro=eq.valor"
          description={t('rest.getDesc')}
          curlExample={expandBase(t('rest.getCurl'))}
          sdkExample={t('rest.getSdk')}
        />
        <EndpointBlock
          method="POST"
          path="/rest/v1/{recurso}"
          description={t('rest.postDesc')}
          curlExample={expandBase(t('rest.postCurl'))}
          sdkExample={t('rest.postSdk')}
        />
        <EndpointBlock
          method="PATCH"
          path="/rest/v1/{recurso}?id=eq.{uuid}"
          description={t('rest.patchDesc')}
          curlExample={expandBase(t('rest.patchCurl'))}
          sdkExample={t('rest.patchSdk')}
        />
        <EndpointBlock
          method="DELETE"
          path="/rest/v1/{recurso}?id=eq.{uuid}"
          description={t('rest.deleteDesc')}
          curlExample={expandBase(t('rest.deleteCurl'))}
          sdkExample={t('rest.deleteSdk')}
        />
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3">{t('rest.rpcTitle')}</h4>
        <p className="text-indigo-100/85 mb-4 text-sm">
          {t('rest.rpcIntro')}
        </p>
        <EndpointBlock
          method="POST"
          path="/rest/v1/rpc/log_timer_hours"
          description={t('rest.logTimerDesc')}
          curlExample={expandBase(t('rest.logTimerCurl'))}
          sdkExample={t('rest.logTimerSdk')}
        />
        <EndpointBlock
          method="POST"
          path="/rest/v1/rpc/get_team_active_timers"
          description={t('rest.teamTimersDesc')}
          curlExample={expandBase(t('rest.teamTimersCurl'))}
          sdkExample={t('rest.teamTimersSdk')}
        />
      </div>
    </section>
  );
}

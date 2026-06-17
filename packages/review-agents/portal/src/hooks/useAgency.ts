import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAgency() {
  const [agencyId, setAgencyId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('user_agencies')
        .select('agency_id, is_primary')
        .eq('user_id', user.id);
      const primary = data?.find((r) => r.is_primary) ?? data?.[0];
      if (primary) setAgencyId(primary.agency_id);
      setLoading(false);
    })();
  }, []);

  return { agencyId, loading, hasAgency: Boolean(agencyId) };
}

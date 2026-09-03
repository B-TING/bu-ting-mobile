import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { useLocationConsentStore } from '../../stores/useLocationConsentStore';
import { LOCATION_POLL_INTERVAL_MS } from '../../utils/location/locationCache';
import { refreshLocationCacheIfPermitted } from '../../utils/location/refreshLocationCache';

/**
 * #182 이벤트 화면 포그라운드에서만 위치를 주기 갱신한다.
 * watchPosition 추적은 하지 않는다.
 */
export function useLocationCache() {
  const isFocused = useIsFocused();
  const disclosureAccepted = useLocationConsentStore(s => s.disclosureAccepted);

  useEffect(() => {
    if (!isFocused || !disclosureAccepted) {
      return;
    }

    const tick = () => {
      void refreshLocationCacheIfPermitted();
    };

    tick();
    const intervalId = setInterval(tick, LOCATION_POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isFocused, disclosureAccepted]);
}

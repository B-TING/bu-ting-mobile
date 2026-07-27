import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { getLocationConsentCopy } from '../../../constants/common/locationConsent';
import { useAppStore, useLocationConsentStore } from '../../../stores';
import { LocationConsentDisclosure } from './LocationConsentDisclosure';

export type LocationConsentResult = 'accepted' | 'declined';

type LocationConsentContextValue = {
  /**
   * 위치 기능 사용 전 호출.
   * 미동의면 Prominent Disclosure를 띄우고, 동의/거절 결과를 반환한다.
   * 이미 동의했으면 모달 없이 `accepted`를 반환한다.
   */
  ensureLocationConsent: () => Promise<LocationConsentResult>;
};

const LocationConsentContext =
  createContext<LocationConsentContextValue | null>(null);

export function LocationConsentProvider({ children }: { children: ReactNode }) {
  const language = useAppStore(s => s.language);
  const copy = getLocationConsentCopy(language);
  const acceptDisclosure = useLocationConsentStore(s => s.acceptDisclosure);

  const [visible, setVisible] = useState(false);
  const pendingRef = useRef<((result: LocationConsentResult) => void) | null>(
    null,
  );

  const resolvePending = useCallback((result: LocationConsentResult) => {
    setVisible(false);
    const resolve = pendingRef.current;
    pendingRef.current = null;
    resolve?.(result);
  }, []);

  const ensureLocationConsent =
    useCallback((): Promise<LocationConsentResult> => {
      if (useLocationConsentStore.getState().disclosureAccepted) {
        return Promise.resolve('accepted');
      }

      return new Promise(resolve => {
        pendingRef.current = resolve;
        setVisible(true);
      });
    }, []);

  const onAccept = useCallback(() => {
    acceptDisclosure();
    resolvePending('accepted');
  }, [acceptDisclosure, resolvePending]);

  const onDecline = useCallback(() => {
    resolvePending('declined');
  }, [resolvePending]);

  const value = useMemo(
    () => ({ ensureLocationConsent }),
    [ensureLocationConsent],
  );

  return (
    <LocationConsentContext.Provider value={value}>
      {children}
      <LocationConsentDisclosure
        visible={visible}
        title={copy.title}
        disclosure={copy.disclosure}
        detail={copy.detail}
        acceptLabel={copy.accept}
        declineLabel={copy.decline}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    </LocationConsentContext.Provider>
  );
}

export function useLocationConsent(): LocationConsentContextValue {
  const ctx = useContext(LocationConsentContext);
  if (!ctx) {
    throw new Error(
      'useLocationConsent must be used within LocationConsentProvider',
    );
  }
  return ctx;
}

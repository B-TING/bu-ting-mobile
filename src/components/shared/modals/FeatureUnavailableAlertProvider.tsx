import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getFeatureUnavailableCopy } from '../../../constants/common/featureUnavailable';
import { useAppStore } from '../../../stores';
import { FeatureUnavailableAlert } from './FeatureUnavailableAlert';

type FeatureUnavailableAlertContextValue = {
  showUnavailable: (featureName?: string) => void;
};

const FeatureUnavailableAlertContext =
  createContext<FeatureUnavailableAlertContextValue | null>(null);

type AlertState = {
  visible: boolean;
  featureName?: string;
};

export function FeatureUnavailableAlertProvider({
  children,
}: {
  children: ReactNode;
}) {
  const language = useAppStore(s => s.language);
  const copy = getFeatureUnavailableCopy(language);
  const [state, setState] = useState<AlertState | null>(null);

  const close = useCallback(() => {
    setState(prev => (prev ? { ...prev, visible: false } : null));
  }, []);

  const showUnavailable = useCallback((featureName?: string) => {
    setState({
      visible: true,
      featureName: featureName?.trim() ? featureName.trim() : undefined,
    });
  }, []);

  const value = useMemo(() => ({ showUnavailable }), [showUnavailable]);

  const title = copy.title;
  const message = state?.featureName
    ? copy.messageWithFeature(state.featureName)
    : copy.message;

  return (
    <FeatureUnavailableAlertContext.Provider value={value}>
      {children}
      {state ? (
        <FeatureUnavailableAlert
          visible={state.visible}
          title={title}
          message={message}
          confirmLabel={copy.confirm}
          onClose={close}
        />
      ) : null}
    </FeatureUnavailableAlertContext.Provider>
  );
}

export function useFeatureUnavailableAlert(): FeatureUnavailableAlertContextValue {
  const ctx = useContext(FeatureUnavailableAlertContext);
  if (!ctx) {
    throw new Error(
      'useFeatureUnavailableAlert must be used within FeatureUnavailableAlertProvider',
    );
  }
  return ctx;
}

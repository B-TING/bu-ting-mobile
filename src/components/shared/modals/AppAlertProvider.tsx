import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { AppAlertModal, type AppAlertButton } from './AppAlertModal';

type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
};

type AppAlertContextValue = {
  alert: (options: AlertOptions) => void;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

type AlertState = AlertOptions & { visible: boolean };

export function AppAlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlertState | null>(null);

  const close = useCallback(() => {
    setState(prev => (prev ? { ...prev, visible: false } : null));
  }, []);

  const alert = useCallback((options: AlertOptions) => {
    setState({ ...options, visible: true });
  }, []);

  const value = useMemo(() => ({ alert }), [alert]);

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      {state ? (
        <AppAlertModal
          visible={state.visible}
          title={state.title}
          message={state.message}
          buttons={state.buttons}
          onClose={close}
        />
      ) : null}
    </AppAlertContext.Provider>
  );
}

export function useAppAlert(): AppAlertContextValue {
  const ctx = useContext(AppAlertContext);
  if (!ctx) {
    throw new Error('useAppAlert must be used within AppAlertProvider');
  }
  return ctx;
}

export function showAppAlert(
  alertFn: AppAlertContextValue['alert'],
  title: string,
  message?: string,
  buttons?: AppAlertButton[],
) {
  alertFn({ title, message, buttons });
}

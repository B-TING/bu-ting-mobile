import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../../stores';
import type { AppLanguage } from '../../types/user';
import { buildCopyProxy, type CopyTree } from '../buildCopyProxy';
import { COPY_NAMESPACES, type CopyNamespace } from '../copyRegistry';
import { DEFAULT_LANGUAGE } from '../index';

export function useAppLanguage(): AppLanguage {
  return useAppStore(state => state.language) ?? DEFAULT_LANGUAGE;
}

/** 기존 *_COPY[language] 와 동일한 API — i18n 기반 */
export function useCopy<N extends CopyNamespace>(
  namespace: N,
): (typeof COPY_NAMESPACES)[N][AppLanguage] {
  const language = useAppLanguage();
  const { t, i18n } = useTranslation(namespace);

  return useMemo((): (typeof COPY_NAMESPACES)[N][AppLanguage] => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
    return buildCopyProxy(
      t,
      COPY_NAMESPACES[namespace][language] as CopyTree,
    ) as (typeof COPY_NAMESPACES)[N][AppLanguage];
  }, [i18n, language, namespace, t]);
}

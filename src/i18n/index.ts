import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { AppLanguage } from '../types/user';
import { buildCopyProxy, type CopyTree } from './buildCopyProxy';
import { APP_LANGUAGES, COPY_NAMESPACES, type CopyNamespace } from './copyRegistry';
import { flattenCopyToResources } from './flattenResources';

export const DEFAULT_LANGUAGE: AppLanguage = 'ko';

const resources: Record<string, Record<string, Record<string, string>>> = {};

for (const lang of APP_LANGUAGES) {
  resources[lang] = {};
  for (const [namespace, copyByLang] of Object.entries(COPY_NAMESPACES)) {
    resources[lang][namespace] = flattenCopyToResources(copyByLang[lang] as Record<string, unknown>);
  }
}

let initialized = false;

export function initI18n(language: AppLanguage = DEFAULT_LANGUAGE): typeof i18n {
  if (!initialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: DEFAULT_LANGUAGE,
      defaultNS: 'common',
      ns: Object.keys(COPY_NAMESPACES),
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
      returnNull: false,
    });
    initialized = true;
    return i18n;
  }

  if (i18n.language !== language) {
    void i18n.changeLanguage(language);
  }

  return i18n;
}

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  initI18n(language);
  await i18n.changeLanguage(language);
}

export function getCopyForLanguage<N extends CopyNamespace>(
  namespace: N,
  language: AppLanguage,
): (typeof COPY_NAMESPACES)[N][typeof language] {
  const t = i18n.getFixedT(language, namespace);
  return buildCopyProxy(t, COPY_NAMESPACES[namespace][language] as CopyTree) as (typeof COPY_NAMESPACES)[N][typeof language];
}

export { i18n };
export type { CopyNamespace };
export type { CopyFor } from './types';
export { useCopy, useAppLanguage } from './hooks/useCopy';

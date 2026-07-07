import type { TFunction } from 'i18next';

type CopyLeaf = string | ((...args: unknown[]) => string) | CopyTree;
export type CopyTree = { [key: string]: CopyLeaf };

function buildLeafProxy(
  t: TFunction,
  key: string,
  value: CopyLeaf,
): string | ((...args: unknown[]) => string) | CopyTree {
  if (typeof value === 'string') {
    return t(key, { defaultValue: value });
  }

  if (typeof value === 'function') {
    return (...args: unknown[]) => {
      const params: Record<string, unknown> = { defaultValue: value(...args) };
      args.forEach((arg, index) => {
        params[`arg${index}`] = arg;
      });
      return t(key, params);
    };
  }

  return buildCopyProxy(t, value, key);
}

/** i18n t 함수로 COPY 와 동일한 형태의 프록시 객체 생성 */
export function buildCopyProxy<T extends CopyTree>(
  t: TFunction,
  copy: T,
  prefix = '',
): T {
  const proxy = {} as T;

  for (const [key, value] of Object.entries(copy)) {
    const resourceKey = prefix ? `${prefix}.${key}` : key;
    (proxy as CopyTree)[key] = buildLeafProxy(t, resourceKey, value as CopyLeaf) as T[keyof T];
  }

  return proxy;
}

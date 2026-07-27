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
    // 언어별 COPY 함수는 이미 locale 로직을 포함하므로 i18n 템플릿 보간을 거치지 않음
    // (배열 인덱스 등 2차 변환이 있는 함수는 프로브 값으로 깨진 템플릿이 생성될 수 있음)
    return (...args: unknown[]) => value(...args);
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

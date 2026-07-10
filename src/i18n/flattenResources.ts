type FlatResource = Record<string, string>;

const ARG_MARKERS = ['__ARG0__', '__ARG1__', '__ARG2__', '__ARG3__', '__ARG4__'] as const;

/** 함수 템플릿 추출용 — .toFixed / .toLocaleString 등 숫자 메서드 호출 가능 */
const PROBE_NUMBERS = [9.5, 1234, 3, 4, 5] as const;

function replaceProbeInTemplate(template: string, probe: number, index: number): string {
  const placeholder = `{{arg${index}}}`;
  const variants = new Set<string>([String(probe), probe.toFixed(1)]);

  for (const locale of ['ko-KR', 'en-US', 'ja-JP', 'zh-CN', undefined] as const) {
    try {
      variants.add(locale ? probe.toLocaleString(locale) : probe.toLocaleString());
    } catch {
      // ignore unsupported locale
    }
  }

  let result = template;
  for (const variant of variants) {
    if (variant.length > 0 && result.includes(variant)) {
      result = result.split(variant).join(placeholder);
    }
  }
  return result;
}

function templateFromStringMarkers(fn: (...args: unknown[]) => string, arity: number): string {
  const markers = ARG_MARKERS.slice(0, arity);
  const result = fn(...markers);
  let template = result;

  markers.forEach((marker, index) => {
    template = template.split(marker).join(`{{arg${index}}}`);
  });

  return template;
}

/** COPY 함수 값을 i18n interpolation 템플릿 문자열로 변환 */
export function functionToTemplate(fn: (...args: unknown[]) => string): string {
  const arity = Math.max(fn.length, 1);
  const probes = PROBE_NUMBERS.slice(0, arity);

  try {
    const result = fn(...probes);
    let template = result;
    probes.forEach((probe, index) => {
      template = replaceProbeInTemplate(template, probe, index);
    });
    return template;
  } catch {
    return templateFromStringMarkers(fn, arity);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

/** COPY 객체를 i18n flat resource 로 변환 (문자열 + 함수 템플릿) */
export function flattenCopyToResources(
  copy: Record<string, unknown>,
  prefix = '',
): FlatResource {
  const resources: FlatResource = {};

  for (const [key, value] of Object.entries(copy)) {
    const resourceKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      resources[resourceKey] = value;
      continue;
    }

    if (typeof value === 'function') {
      resources[resourceKey] = functionToTemplate(value as (...args: unknown[]) => string);
      continue;
    }

    if (isPlainObject(value)) {
      Object.assign(resources, flattenCopyToResources(value, resourceKey));
    }
  }

  return resources;
}

/** 로컬 엔티티용 간단 ID (추후 UUID v4로 교체 가능) */
export function createId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

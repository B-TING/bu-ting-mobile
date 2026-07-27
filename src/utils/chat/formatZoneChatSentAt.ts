const LOCALE_BY_LANGUAGE: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

/** 채팅 말풍선 옆에 표시할 전송 시각 */
export function formatZoneChatSentAt(sentAt: string, language = 'ko'): string {
  const date = new Date(sentAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const locale = LOCALE_BY_LANGUAGE[language] ?? 'ko-KR';
  const use12Hour = language === 'ko' || language === 'en';
  const isToday = date.toDateString() === new Date().toDateString();

  if (isToday) {
    return date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: use12Hour,
    });
  }

  return date.toLocaleString(locale, {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: use12Hour,
  });
}

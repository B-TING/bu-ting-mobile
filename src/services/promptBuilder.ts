import type { OnboardingProfile } from '../types/user';

const PURPOSE_LABELS: Record<string, Record<string, string>> = {
  food: { ko: '음식', en: 'food', ja: 'グルメ', zh: '美食' },
  scenery: { ko: '풍경', en: 'scenery', ja: '景色', zh: '风景' },
  culture: { ko: '문화체험', en: 'culture', ja: '文化', zh: '文化' },
  shopping: { ko: '쇼핑', en: 'shopping', ja: '買い物', zh: '购物' },
  nightlife: { ko: '나이트라이프', en: 'nightlife', ja: 'ナイト', zh: '夜生活' },
  relaxation: { ko: '휴식', en: 'relaxation', ja: '休息', zh: '休闲' },
};

/** AI 라우팅·추천 프롬프트에 넣을 유저 컨텍스트 문자열 */
export function buildUserPromptContext(profile: OnboardingProfile): string {
  const lang = profile.language;
  const lines: string[] = [
    `[User profile for Bu-Ting route agent]`,
    `Preferred UI language: ${lang}`,
  ];

  if (profile.travelStyle) {
    lines.push(
      `Travel style: ${profile.travelStyle === 'planned' ? 'prefers detailed planning' : 'prefers spontaneous exploration'}`,
    );
  }
  if (profile.companions) {
    lines.push(
      `Companions: ${profile.companions === 'solo' ? 'solo traveler' : 'travels with others (sync/offline relevant)'}`,
    );
  }
  if (profile.luggage) {
    lines.push(
      `Luggage: ${profile.luggage === 'heavy' ? 'heavy luggage — prioritize locker stations, flat routes, luggage-friendly buses' : 'travel light'}`,
    );
  }
  if (profile.purposes.length > 0) {
    const labels = profile.purposes.map(p => PURPOSE_LABELS[p]?.[lang] ?? p);
    lines.push(`Visit purposes in Busan: ${labels.join(', ')}`);
  }
  if (profile.busanFamiliarity) {
    lines.push(
      profile.busanFamiliarity === 'novice'
        ? 'Busan familiarity: low — enable GPS nearby explanations and guided tips'
        : 'Busan familiarity: high — enable travel journal / contributor features',
    );
  }
  if (profile.skippedAll || profile.skippedSteps.length > 0) {
    lines.push(
      `Onboarding skipped steps: ${profile.skippedAll ? 'all' : profile.skippedSteps.join(', ')}`,
    );
  }

  return lines.join('\n');
}

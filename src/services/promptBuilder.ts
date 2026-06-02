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
    lines.push(
      profile.travelStyle === 'planned'
        ? 'Highlight features: trip planner (primary), nearby suggestions (secondary)'
        : 'Highlight features: nearby suggestions (primary), trip planner (secondary)',
    );
  }
  if (profile.companions) {
    lines.push(
      `Companions: ${profile.companions === 'solo' ? 'solo traveler' : 'travels with others (sync/offline relevant)'}`,
    );
    lines.push(
      profile.companions === 'group'
        ? 'Highlight features: itinerary sync (primary), offline mode (primary)'
        : 'Highlight features: offline mode (primary), itinerary sync (secondary)',
    );
  }
  if (profile.luggage) {
    lines.push(
      `Luggage: ${profile.luggage === 'heavy' ? 'heavy luggage — prioritize locker stations, flat routes, luggage-friendly buses' : 'travel light'}`,
    );
    lines.push(
      profile.luggage === 'heavy'
        ? 'Highlight features: luggage storage guide (primary), amenities map (primary)'
        : 'Highlight features: amenities map (primary), luggage storage guide (secondary)',
    );
  }
  if (profile.purposes.length > 0) {
    const labels = profile.purposes.map(p => PURPOSE_LABELS[p]?.[lang] ?? p);
    lines.push(`Visit purposes in Busan: ${labels.join(', ')}`);
    const highlights: string[] = [];
    if (profile.purposes.includes('food')) {
      highlights.push('restaurant list');
    }
    if (
      profile.purposes.includes('culture') ||
      profile.purposes.includes('nightlife')
    ) {
      highlights.push('festival & events list');
    }
    if (profile.purposes.includes('scenery')) {
      highlights.push('scenic spots');
    }
    if (highlights.length > 0) {
      lines.push(`Highlight features: ${highlights.join(', ')}`);
    }
  }
  if (profile.busanFamiliarity) {
    lines.push(
      profile.busanFamiliarity === 'novice'
        ? 'Busan familiarity: low — enable GPS nearby explanations and guided tips'
        : 'Busan familiarity: high — enable travel journal / contributor features',
    );
    lines.push(
      profile.busanFamiliarity === 'novice'
        ? 'Highlight features: GPS nearby guide (primary), travel journal (secondary)'
        : 'Highlight features: travel journal (primary), GPS nearby guide (secondary)',
    );
  }
  if (profile.skippedAll || profile.skippedSteps.length > 0) {
    lines.push(
      `Onboarding skipped steps: ${profile.skippedAll ? 'all' : profile.skippedSteps.join(', ')}`,
    );
  }

  return lines.join('\n');
}

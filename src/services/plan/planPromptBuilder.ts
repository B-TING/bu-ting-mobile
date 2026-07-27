import {
  ACCOMMODATION_AREAS,
  BUSAN_ATTRACTIONS,
  BUSAN_FOODS,
  COMPANION_TYPE_OPTIONS,
} from '../../constants/plan/planWizard';
import type { PlanWizardAnswers } from '../../types/planWizard';
import type { OnboardingProfile } from '../../types/user';

function labelsForIds(
  ids: string[],
  options: { id: string; label: Record<string, string> }[],
  lang: string,
): string[] {
  return ids.map(id => options.find(o => o.id === id)?.label[lang as keyof typeof options[0]['label']] ?? id);
}

/** 계획 위저드 + 온보딩 → AI 에이전트 요청용 컨텍스트 */
export function buildPlanRequestPrompt(
  wizard: PlanWizardAnswers,
  onboarding: OnboardingProfile | null,
): string {
  const lang = onboarding?.language ?? 'ko';
  const lines: string[] = [
    '[Bu-Ting travel plan request]',
    `Trip window: ${wizard.startDate} → ${wizard.endDate}`,
    `Travelers: ${wizard.companionCount}`,
    `Companion types: ${labelsForIds(wizard.companionTypes, COMPANION_TYPE_OPTIONS, lang).join(', ') || 'unspecified'}`,
    `Heavy baggage: ${wizard.hasHeavyBaggage}`,
    `Preferred attractions: ${labelsForIds(wizard.attractionIds, BUSAN_ATTRACTIONS, lang).join(', ') || 'open'}`,
    `Preferred foods: ${labelsForIds(wizard.foodIds, BUSAN_FOODS, lang).join(', ') || 'open'}`,
  ];

  if (wizard.accommodationMode === 'booked' && wizard.accommodationName) {
    lines.push(`Accommodation (booked): ${wizard.accommodationName}`);
  } else if (wizard.accommodationAreaIds.length > 0) {
    lines.push(
      `Accommodation areas: ${labelsForIds(wizard.accommodationAreaIds, ACCOMMODATION_AREAS, lang).join(', ')}`,
    );
  }

  lines.push(
    `Generation mode: ${wizard.generationMode === 'auto' ? 'AUTO — return full itinerary JSON' : 'CANDIDATES — return 2-3 plan variants for user pick'}`,
  );

  if (onboarding?.aiPromptContext) {
    lines.push('', '[Onboarding profile]', onboarding.aiPromptContext);
  }

  lines.push(
    '',
    '[Expected response shape]',
    'TravelPlan with planId, title, dates, constraints, members, itinerary (DailyItinerary → RouteItem with sequence, placeId, lat/lng, type).',
  );

  return lines.join('\n');
}

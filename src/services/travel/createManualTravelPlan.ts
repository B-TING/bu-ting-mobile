import type { PlanWizardAnswers } from '../../types/planWizard';
import type { PlanMember, TravelPlan } from '../../types/travelPlan';
import { resolveInitialPlanAnchor } from '../../utils/plan/planAnchor';
import {
  toPlanCreateRequests,
  toTravelCreateRequest,
  travelResponseToPlan,
  wizardAnswersToConstraints,
} from './travelMapper';
import { createTravel, createTravelPlan } from './travelService';

export class ManualTravelPlanError extends Error {
  cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'ManualTravelPlanError';
    this.cause = options?.cause;
  }
}

export type CreateManualTravelPlanInput = {
  accessToken: string;
  answers: PlanWizardAnswers;
  members: PlanMember[];
};

/**
 * 위저드「직접 일정 만들기」— Travel + 일차별 Plan 생성 후 빈 일정 `TravelPlan` 반환.
 */
export async function createManualTravelPlan(
  input: CreateManualTravelPlanInput,
): Promise<TravelPlan> {
  const { accessToken, answers, members } = input;

  if (!accessToken?.trim()) {
    throw new ManualTravelPlanError('로그인이 필요합니다.');
  }

  const constraints = {
    ...wizardAnswersToConstraints(answers),
    initialAnchor: resolveInitialPlanAnchor(answers),
  };
  const travelBody = toTravelCreateRequest(answers);

  try {
    const travel = await createTravel(accessToken, travelBody);
    const planRequests = toPlanCreateRequests(answers.startDate, answers.endDate);
    const dayPlans = [];

    for (const planBody of planRequests) {
      const plan = await createTravelPlan(accessToken, travel.id, planBody);
      dayPlans.push(plan);
    }

    return travelResponseToPlan(travel, dayPlans, members, constraints);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '여행 생성에 실패했습니다.';
    throw new ManualTravelPlanError(message, { cause: error });
  }
}

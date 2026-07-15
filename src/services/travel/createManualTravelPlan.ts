import { useTravelRecordStore } from '../../stores/useTravelRecordStore';
import type { PlanWizardAnswers } from '../../types/planWizard';
import type { PlanMember, TravelPlan } from '../../types/travelPlan';
import type { TravelRecordResponse } from '../../types/travelRecordApi';
import { mapTravelRecordResponse } from '../../types/travelRecordApi';
import { resolveInitialPlanAnchor } from '../../utils/plan/planAnchor';
import {
  toPlanCreateRequests,
  toTravelCreateRequest,
  travelResponseToPlan,
  wizardAnswersToConstraints,
} from './travelMapper';
import { createTravelRecordDraft } from './travelRecordService';
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

function upsertLocalDraftFromTravel(options: {
  travelId: string;
  title: string | null | undefined;
  startDate: string;
  endDate: string;
  member: PlanMember | undefined;
  draftDto?: TravelRecordResponse;
}) {
  const { travelId, title, startDate, endDate, member, draftDto } = options;
  const authorNickname = member?.nickname ?? 'Traveler';
  const authorId = member?.userId ?? 'local-user';

  if (draftDto) {
    useTravelRecordStore.getState().upsertTravelRecords([
      mapTravelRecordResponse(draftDto, { authorNickname }),
    ]);
    return;
  }

  useTravelRecordStore.getState().upsertTravelRecords([
    {
      travelRecordId: `local-draft-${travelId}`,
      originalTravelId: travelId,
      authorId,
      authorNickname,
      title: title ?? null,
      content: null,
      coverImageUrl: null,
      travelStartDate: startDate,
      travelEndDate: endDate,
      status: 'DRAFT',
      publishedAt: null,
      likeCount: 0,
      viewCount: 0,
      days: [],
      placeReviews: [],
    },
  ]);
}

/**
 * 위저드「직접 일정 만들기」— Travel + 일차별 Plan + 여행기 초안 생성 후 `TravelPlan` 반환.
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
  const leader = members[0];

  try {
    const travel = await createTravel(accessToken, travelBody);
    const planRequests = toPlanCreateRequests(answers.startDate, answers.endDate);
    const dayPlans = [];

    for (const planBody of planRequests) {
      const plan = await createTravelPlan(accessToken, travel.id, planBody);
      dayPlans.push(plan);
    }

    try {
      const draft = await createTravelRecordDraft(accessToken, travel.id, {
        title: travel.title ?? travelBody.title ?? null,
      });
      upsertLocalDraftFromTravel({
        travelId: travel.id,
        title: draft.title ?? travel.title,
        startDate: travel.startDate,
        endDate: travel.endDate,
        member: leader,
        draftDto: draft,
      });
    } catch (draftError) {
      if (__DEV__) {
        console.warn(
          '[createManualTravelPlan] travel record draft failed; keeping local draft',
          draftError,
        );
      }
      upsertLocalDraftFromTravel({
        travelId: travel.id,
        title: travel.title ?? travelBody.title,
        startDate: travel.startDate,
        endDate: travel.endDate,
        member: leader,
      });
    }

    return travelResponseToPlan(travel, dayPlans, members, constraints);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '여행 생성에 실패했습니다.';
    throw new ManualTravelPlanError(message, { cause: error });
  }
}

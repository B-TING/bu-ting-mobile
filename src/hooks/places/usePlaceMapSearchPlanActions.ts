import { useCallback, useMemo, useState } from 'react';

import { useAppAlert } from '../../components/shared/modals';
import { useAppLanguage, useCopy } from '../../i18n';
import { addPlaceCandidateToDay } from '../../services/travel/addPlaceCandidateToDay';
import {
  selectHomeFeaturedPlan,
  selectSelectableHomePlans,
  usePlanStore,
} from '../../stores';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import type { BusanPlace } from '../../types/placeSearch';
import type { PlaceDetailVO } from '../../types/googlePlaces';
import type { TravelPlan } from '../../types/travelPlan';
import { isPlanForCurrentApiServer } from '../../utils/api/apiServerOrigin';
import { busanPlaceToRebootCandidate } from '../../utils/places/placeModelBridge';
import { isServerBackedPlan } from '../../utils/plan/serverBackedPlan';
import { resolvePlanTravelStatus } from '../../utils/plan/planTravelStatus';
import { useDirectionsFromMyLocation } from '../useDirectionsFromMyLocation';

function isEditableTravelPlan(plan: TravelPlan): boolean {
  if (!isPlanForCurrentApiServer(plan)) {
    return false;
  }
  const status = resolvePlanTravelStatus(plan);
  return status === 'PLANNED' || status === 'IN_PROGRESS';
}

function collectEditablePlans(
  selectable: TravelPlan[],
  allPlans: TravelPlan[],
): TravelPlan[] {
  const fromSelectable = selectable.filter(isEditableTravelPlan);
  const localExtras = allPlans.filter(
    plan =>
      isEditableTravelPlan(plan) &&
      !isServerBackedPlan(plan) &&
      !fromSelectable.some(existing => existing.planId === plan.planId),
  );
  return [...fromSelectable, ...localExtras];
}

export function usePlaceMapSearchPlanActions(options: {
  selectedPlace: BusanPlace | null;
  selectedDetail: PlaceDetailVO | null;
  /** 위저드 픽 모드면 일정 추가·길찾기 CTA 숨김 */
  pickFor?: string | null;
}) {
  const { selectedPlace, selectedDetail, pickFor } = options;
  const language = useAppLanguage();
  const copy = useCopy('placeSearch');
  const planCopy = useCopy('planDetail');
  const { alert } = useAppAlert();
  const accessToken = useAuthStore(selectReusableAccessToken);
  const selectablePlans = usePlanStore(selectSelectableHomePlans);
  const allPlans = usePlanStore(s => s.plans);
  const featuredPlan = usePlanStore(selectHomeFeaturedPlan);

  const editablePlans = useMemo(
    () => collectEditablePlans(selectablePlans, allPlans),
    [selectablePlans, allPlans],
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const notify = useCallback(
    (message: string) => {
      alert({ title: copy.directions, message });
    },
    [alert, copy.directions],
  );

  const { openDirectionsFromMyLocation } = useDirectionsFromMyLocation(
    {
      directionsMyLocationLabel: planCopy.directionsMyLocationLabel,
      directionsLocationUnavailable: planCopy.directionsLocationUnavailable,
      directionsLocationDenied: planCopy.directionsLocationDenied,
      directionsUnavailable: planCopy.directionsUnavailable,
      directionsFailed: planCopy.directionsFailed,
    },
    notify,
  );

  const showPlanActions = !pickFor;

  const handleOpenAddToPlan = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    if (editablePlans.length === 0) {
      alert({ title: copy.addToPlan, message: copy.addToPlanNoPlan });
      return;
    }
    setAddModalOpen(true);
  }, [alert, copy.addToPlan, copy.addToPlanNoPlan, editablePlans.length, selectedPlace]);

  const handleConfirmAddToPlan = useCallback(
    async (planId: string, dayNumber: number) => {
      if (!selectedPlace || saving) {
        return;
      }
      const plan = editablePlans.find(p => p.planId === planId);
      if (!plan) {
        alert({ title: copy.addToPlan, message: copy.addToPlanNoPlan });
        return;
      }

      setSaving(true);
      try {
        const candidate = busanPlaceToRebootCandidate({
          ...selectedPlace,
          address: selectedDetail?.formattedAddress ?? selectedPlace.address,
          imageUrl: selectedDetail?.imageUrl ?? selectedPlace.imageUrl,
        });
        await addPlaceCandidateToDay({
          plan,
          dayNumber,
          candidate,
          language,
          accessToken,
        });
        setAddModalOpen(false);
        alert({ title: copy.addToPlan, message: copy.addToPlanSuccess });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : copy.addToPlanFailed;
        alert({ title: copy.addToPlan, message });
      } finally {
        setSaving(false);
      }
    },
    [
      accessToken,
      alert,
      copy.addToPlan,
      copy.addToPlanFailed,
      copy.addToPlanNoPlan,
      copy.addToPlanSuccess,
      editablePlans,
      language,
      saving,
      selectedDetail?.formattedAddress,
      selectedDetail?.imageUrl,
      selectedPlace,
    ],
  );

  const handleDirectionsGoogle = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    openDirectionsFromMyLocation('google', {
      lat: selectedPlace.location.lat,
      lng: selectedPlace.location.lng,
      name: selectedPlace.name,
      address: selectedDetail?.formattedAddress ?? selectedPlace.address,
    });
  }, [openDirectionsFromMyLocation, selectedDetail?.formattedAddress, selectedPlace]);

  const handleDirectionsKakao = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    openDirectionsFromMyLocation('kakao', {
      lat: selectedPlace.location.lat,
      lng: selectedPlace.location.lng,
      name: selectedPlace.name,
      address: selectedDetail?.formattedAddress ?? selectedPlace.address,
    });
  }, [openDirectionsFromMyLocation, selectedDetail?.formattedAddress, selectedPlace]);

  return {
    showPlanActions,
    addModalOpen,
    setAddModalOpen,
    saving,
    editablePlans,
    featuredPlanId: featuredPlan?.planId ?? null,
    handleOpenAddToPlan,
    handleConfirmAddToPlan,
    handleDirectionsGoogle,
    handleDirectionsKakao,
  };
}

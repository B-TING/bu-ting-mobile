import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { RouteItemCard } from '../RouteItemCard';
import { TransportModePicker } from '../TransportModePicker';
import type { RouteItem, TravelLegMode } from '../../../types/travelPlan';

export type RebootPhase = 'idle' | 'choose';

type ScheduleRouteSlotProps = {
  route: RouteItem;
  displayIndex: number;
  phase: RebootPhase;
  copy: {
    markVisited: string;
    editRoute: string;
    rebootActionSub: (name: string) => string;
    rebootDelete: string;
    rebootReplace: string;
    rebootCancel: string;
    recordReview?: string;
    quickRatingHint?: string;
    transportModeTitle?: string;
    legWalk: string;
    legDrive: string;
    legTransit: string;
  };
  reviewRating?: number;
  onWriteReview?: () => void;
  onQuickRating?: (rating: number) => void;
  onLegModeChange?: (mode: TravelLegMode) => void;
  onPress: () => void;
  onEdit: () => void;
  indexSelected: boolean;
  indexHint: string;
  onIndexPress: () => void;
  onToggleVisited: () => void;
  onDelete: () => void;
  onReplace: () => void;
  onCancel: () => void;
};

const DURATION_OUT = 200;
const DURATION_IN = 260;

export function ScheduleRouteSlot({
  route,
  displayIndex,
  phase,
  copy,
  onPress,
  onEdit,
  indexSelected,
  indexHint,
  onIndexPress,
  onToggleVisited,
  onDelete,
  onReplace,
  onCancel,
  reviewRating,
  onWriteReview,
  onQuickRating,
  onLegModeChange,
}: ScheduleRouteSlotProps) {
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardSlide = useRef(new Animated.Value(0)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const panelSlide = useRef(new Animated.Value(10)).current;

  const animateOut = (onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: DURATION_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: -10,
        duration: DURATION_OUT,
        useNativeDriver: true,
      }),
    ]).start(onDone);
  };

  const animatePanelIn = () => {
    panelOpacity.setValue(0);
    panelSlide.setValue(10);
    Animated.parallel([
      Animated.timing(panelOpacity, {
        toValue: 1,
        duration: DURATION_IN,
        useNativeDriver: true,
      }),
      Animated.timing(panelSlide, {
        toValue: 0,
        duration: DURATION_IN,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateCardIn = () => {
    cardOpacity.setValue(0);
    cardSlide.setValue(10);
    panelOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: DURATION_IN,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: DURATION_IN,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const prevPhase = useRef(phase);

  useEffect(() => {
    const wasChoose = prevPhase.current === 'choose';
    if (phase === 'choose') {
      if (prevPhase.current === 'idle') {
        animateOut(animatePanelIn);
      }
    } else if (wasChoose && phase === 'idle') {
      animateCardIn();
    }
    prevPhase.current = phase;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- phase drives transition
  }, [phase]);

  return (
    <View>
      {phase === 'idle' && (
        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardSlide }],
          }}>
          <RouteItemCard
            route={route}
            displayIndex={displayIndex}
            onPress={onPress}
            onEditPress={onEdit}
            indexSelected={indexSelected}
            indexHint={indexHint}
            onIndexPress={onIndexPress}
            onToggleVisited={onToggleVisited}
            visitedLabel={copy.markVisited}
            editLabel={copy.editRoute}
            recordReviewLabel={copy.recordReview}
            quickRatingHint={copy.quickRatingHint}
            reviewRating={reviewRating}
            onWriteReview={onWriteReview}
            onQuickRating={onQuickRating}
          />
        </Animated.View>
      )}

      {phase === 'choose' && (
        <Animated.View
          style={{
            opacity: panelOpacity,
            transform: [{ translateY: panelSlide }],
          }}
          className="mb-2 overflow-hidden rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF]">
          <View className="p-3">
            <Text className="mb-3 text-sm leading-5 text-brand-text">
              {copy.rebootActionSub(route.placeName)}
            </Text>
            {onLegModeChange && copy.transportModeTitle ? (
              <View className="mb-3">
                <TransportModePicker
                  title={copy.transportModeTitle}
                  value={route.legMode ?? 'walk'}
                  onChange={onLegModeChange}
                  labels={{
                    walk: copy.legWalk,
                    drive: copy.legDrive,
                    transit: copy.legTransit,
                  }}
                />
              </View>
            ) : null}
            <View className="flex-row flex-wrap gap-1.5">
              <Pressable
                onPress={onDelete}
                className="rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5 active:opacity-90">
                <Text className="text-xs font-bold text-[#B91C1C]">{copy.rebootDelete}</Text>
              </Pressable>
              <Pressable
                onPress={onReplace}
                className="rounded-full bg-brand-primary px-3 py-1.5 active:opacity-90">
                <Text className="text-xs font-bold text-white">{copy.rebootReplace}</Text>
              </Pressable>
              <Pressable
                onPress={onCancel}
                className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 active:opacity-90">
                <Text className="text-xs font-semibold text-brand-muted">
                  {copy.rebootCancel}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

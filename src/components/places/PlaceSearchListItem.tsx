import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

import {
  ICON_COLOR_PRIMARY,
  ICON_COLOR_WHITE,
} from '../../constants/icons';
import type { BusanPlace } from '../../types/placeSearch';
import { AppIcon } from '../shared/icons/AppIcon';
import { cn } from '../../utils/common/cn';
import { PlaceImage } from './PlaceImage';

const ACTION_SLOT_WIDTH = 84;

type PlaceSearchListItemProps = {
  place: BusanPlace;
  selected?: boolean;
  meta?: string | null;
  onPress?: () => void;
  /** 선택(확장) 시 우측에 트랜지션으로 나타나는 아이콘 액션 */
  expandActions?: {
    viewDetailLabel: string;
    addLabel: string;
    onViewDetail: () => void;
    onAdd: () => void;
  };
};

export function PlaceSearchListItem({
  place,
  selected = false,
  meta,
  onPress,
  expandActions,
}: PlaceSearchListItemProps) {
  const expandAnim = useRef(new Animated.Value(selected && expandActions ? 1 : 0)).current;

  useEffect(() => {
    if (!expandActions) {
      expandAnim.setValue(0);
      return;
    }
    Animated.timing(expandAnim, {
      toValue: selected ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expandAnim, expandActions, selected]);

  const actionsWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ACTION_SLOT_WIDTH],
  });
  const actionsOpacity = expandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });
  const actionsTranslate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const content = (
    <View className="flex-row items-center overflow-hidden">
      <PlaceImage
        imageUrl={place.imageUrl}
        className="mr-3 h-12 w-12 rounded-xl"
        iconSize={22}
      />
      <View className="min-w-0 flex-1 pr-1">
        <Text className="text-base font-bold text-brand-text" numberOfLines={2}>
          {place.name}
        </Text>
        {meta ? (
          <Text className="mt-0.5 text-xs text-brand-muted" numberOfLines={2}>
            {meta}
          </Text>
        ) : null}
      </View>

      {expandActions ? (
        <Animated.View
          style={{
            width: actionsWidth,
            opacity: actionsOpacity,
            transform: [{ translateX: actionsTranslate }],
            overflow: 'hidden',
          }}>
          <View className="h-12 flex-row items-center justify-end gap-1.5 pl-1">
            <Pressable
              onPress={expandActions.onViewDetail}
              accessibilityRole="button"
              accessibilityLabel={expandActions.viewDetailLabel}
              hitSlop={4}
              className="h-9 w-9 items-center justify-center rounded-full border border-brand-border bg-brand-background active:opacity-80">
              <AppIcon name="fileText" size={16} color={ICON_COLOR_PRIMARY} strokeWidth={2.2} />
            </Pressable>
            <Pressable
              onPress={expandActions.onAdd}
              accessibilityRole="button"
              accessibilityLabel={expandActions.addLabel}
              hitSlop={4}
              className="h-9 w-9 items-center justify-center rounded-full bg-brand-primary active:opacity-90">
              <AppIcon name="plus" size={18} color={ICON_COLOR_WHITE} strokeWidth={2.4} />
            </Pressable>
          </View>
        </Animated.View>
      ) : selected ? (
        <AppIcon name="check" size={20} color={ICON_COLOR_PRIMARY} strokeWidth={2.5} />
      ) : null}
    </View>
  );

  if (!onPress && !expandActions) {
    return (
      <View
        className={cn(
          'mb-2 rounded-2xl border p-3',
          selected ? 'border-brand-primary bg-brand-selected' : 'border-brand-border bg-brand-surface',
        )}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'mb-2 rounded-2xl border p-3 active:opacity-90',
        selected ? 'border-brand-primary bg-brand-selected' : 'border-brand-border bg-brand-surface',
      )}>
      {content}
    </Pressable>
  );
}

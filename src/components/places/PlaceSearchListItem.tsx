import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR_PRIMARY } from '../../constants/icons';
import type { BusanPlace } from '../../types/placeSearch';
import { AppIcon } from '../shared/icons/AppIcon';
import { cn } from '../../utils/common/cn';
import { PlaceImage } from './PlaceImage';

type PlaceSearchListItemProps = {
  place: BusanPlace;
  selected?: boolean;
  meta?: string | null;
  onPress: () => void;
};

export function PlaceSearchListItem({
  place,
  selected = false,
  meta,
  onPress,
}: PlaceSearchListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'mb-2 flex-row items-center rounded-2xl border p-3 active:opacity-90',
        selected ? 'border-brand-primary bg-brand-selected' : 'border-brand-border bg-brand-surface',
      )}>
      <PlaceImage
        imageUrl={place.imageUrl}
        className="mr-3 h-12 w-12 rounded-xl"
        iconSize={22}
      />
      <View className="flex-1">
        <Text className="text-base font-bold text-brand-text">{place.name}</Text>
        {meta ? <Text className="mt-0.5 text-xs text-brand-muted">{meta}</Text> : null}
      </View>
      {selected ? <AppIcon name="check" size={20} color={ICON_COLOR_PRIMARY} strokeWidth={2.5} /> : null}
    </Pressable>
  );
}

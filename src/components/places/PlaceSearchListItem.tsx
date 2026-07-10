import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { catalogThumbnail } from '../../constants/places/placeCatalog';
import { ICON_COLOR_PRIMARY } from '../../constants/icons';
import type { BusanPlace } from '../../types/placeSearch';
import { AppIcon } from '../shared/icons/AppIcon';
import { cn } from '../../utils/common/cn';

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
  const [imageFailed, setImageFailed] = useState(false);
  const thumb = catalogThumbnail(place.contentId);
  const imageUrl = place.imageUrl;

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'mb-2 flex-row items-center rounded-2xl border p-3 active:opacity-90',
        selected ? 'border-brand-primary bg-brand-selected' : 'border-brand-border bg-brand-surface',
      )}>
      {imageUrl && !imageFailed ? (
        <Image
          source={{ uri: imageUrl }}
          className="mr-3 h-12 w-12 rounded-xl bg-brand-border"
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View className="mr-3 h-12 w-12 rounded-xl" style={{ backgroundColor: thumb }} />
      )}
      <View className="flex-1">
        <Text className="text-base font-bold text-brand-text">{place.name}</Text>
        {meta ? <Text className="mt-0.5 text-xs text-brand-muted">{meta}</Text> : null}
      </View>
      {selected ? <AppIcon name="check" size={20} color={ICON_COLOR_PRIMARY} strokeWidth={2.5} /> : null}
    </Pressable>
  );
}

import { Pressable, View } from 'react-native';

import {
  ICON_COLOR_STAR,
  ICON_COLOR_STAR_EMPTY,
} from '../../../constants/icons';
import { AppIcon } from '../icons/AppIcon';

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
  readonly?: boolean;
};

const STAR_COUNT = 5;

export function StarRating({
  value,
  onChange,
  size = 'md',
  readonly = false,
}: StarRatingProps) {
  const starSize = size === 'sm' ? 18 : 24;

  return (
    <View className="flex-row gap-1">
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const star = i + 1;
        const filled = star <= Math.round(value);
        return (
          <Pressable
            key={star}
            disabled={readonly || !onChange}
            onPress={() => onChange?.(star)}
            className="active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={`${star} stars`}>
            <AppIcon
              name="star"
              size={starSize}
              color={filled ? ICON_COLOR_STAR : ICON_COLOR_STAR_EMPTY}
              filled={filled}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

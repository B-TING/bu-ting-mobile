import { Pressable, Text, View } from 'react-native';

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
  const starSize = size === 'sm' ? 'text-lg' : 'text-2xl';

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
            <Text className={`${starSize} ${filled ? 'text-amber-400' : 'text-brand-border'}`}>
              ★
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

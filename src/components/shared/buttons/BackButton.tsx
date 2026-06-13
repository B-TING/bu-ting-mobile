import { Pressable, Text } from 'react-native';

type BackButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

export function BackButton({
  onPress,
  accessibilityLabel = 'Go back',
}: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      className="mr-2 h-10 w-10 items-center justify-center rounded-lg active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <Text className="text-2xl font-semibold leading-7 text-brand-primary">←</Text>
    </Pressable>
  );
}

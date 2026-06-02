import { Pressable, View } from 'react-native';

type HamburgerButtonProps = {
  onPress: () => void;
};

export function HamburgerButton({ onPress }: HamburgerButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      className="mr-3 h-10 w-10 items-center justify-center rounded-lg active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel="Open menu">
      <View className="mb-1.5 h-0.5 w-5 rounded-sm bg-brand-text" />
      <View className="mb-1.5 h-0.5 w-5 rounded-sm bg-brand-text" />
      <View className="h-0.5 w-5 rounded-sm bg-brand-text" />
    </Pressable>
  );
}

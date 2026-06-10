import { Platform, Pressable, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** 상태바·전면 카메라(펀치홀) 아래 여백 */
const TOP_GAP = 10;
/** 메뉴·로고·프로필이 들어가는 바 본문 높이 */
const BAR_HEIGHT = 48;

type AppBarProps = {
  onMenuPress?: () => void;
  onProfilePress?: () => void;
};

function MenuIcon() {
  return (
    <View className="h-3.5 w-5 justify-between">
      <View className="h-0.5 w-full rounded-full bg-brand-text" />
      <View className="h-0.5 w-full rounded-full bg-brand-text" />
      <View className="h-0.5 w-full rounded-full bg-brand-text" />
    </View>
  );
}

/** 전면 카메라·노치 아래로 내리기 위한 상단 inset (px) */
export function useAppBarTopInset(): number {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  return Math.max(insets.top, statusBarHeight) + TOP_GAP;
}

export function AppBar({ onMenuPress, onProfilePress }: AppBarProps) {
  const topPadding = useAppBarTopInset();

  return (
    <View
      className="border-b border-brand-border bg-brand-surface"
      style={{ paddingTop: topPadding }}>
      <View
        className="flex-row items-center justify-between px-4"
        style={{ height: BAR_HEIGHT }}>
        <Pressable
          onPress={onMenuPress}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="메뉴">
          <MenuIcon />
        </Pressable>

        <Text className="text-lg font-bold tracking-tight text-brand-primary">
          BU-TING
        </Text>

        <Pressable
          onPress={onProfilePress}
          hitSlop={12}
          className="active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="프로필">
          <View className="h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-brand-border bg-brand-selected">
            <Text className="text-xs">👤</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

/** AppBar가 차지하는 대략적인 전체 높이 (스크롤 패딩 등) */
export const APP_BAR_TOTAL_HEIGHT = BAR_HEIGHT + TOP_GAP;

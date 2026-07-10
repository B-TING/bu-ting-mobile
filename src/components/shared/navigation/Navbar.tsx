import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY, NAVBAR_TAB_ICONS } from '../../../constants/icons';
import { cn } from '../../../utils/common/cn';
import { AppIcon } from '../icons/AppIcon';

export type NavbarTab = 'home' | 'route' | 'feed' | 'my';

type TabConfig = {
  id: NavbarTab;
  labelKo: string;
  labelEn: string;
};

const TABS: TabConfig[] = [
  { id: 'home', labelKo: '홈', labelEn: 'Home' },
  { id: 'route', labelKo: '일정', labelEn: 'Itinerary' },
  { id: 'feed', labelKo: '피드', labelEn: 'Feed' },
  { id: 'my', labelKo: '마이', labelEn: 'My' },
];

type NavbarProps = {
  activeTab: NavbarTab;
  language?: 'ko' | 'en' | 'ja' | 'zh';
  onTabPress: (tab: NavbarTab) => void;
};

export function Navbar({ activeTab, language = 'ko', onTabPress }: NavbarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-t border-brand-border bg-brand-surface"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      <View className="flex-row items-center justify-around px-2 pt-2">
        {TABS.map(tab => {
          const active = tab.id === activeTab;
          const label = language === 'ko' ? tab.labelKo : tab.labelEn;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabPress(tab.id)}
              className="min-w-[56px] flex-1 items-center py-1 active:opacity-70"
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              <AppIcon
                name={NAVBAR_TAB_ICONS[tab.id]}
                size={22}
                color={active ? ICON_COLOR_PRIMARY : ICON_COLOR_MUTED}
              />
              <Text
                className={cn(
                  'mt-0.5 text-[11px] font-semibold',
                  active ? 'text-brand-primary' : 'text-brand-muted',
                )}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

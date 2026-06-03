import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn';

export type NavbarTab = 'home' | 'route' | 'feed' | 'my';

type TabConfig = {
  id: NavbarTab;
  labelKo: string;
  labelEn: string;
  icon: string;
};

const TABS: TabConfig[] = [
  { id: 'home', labelKo: '홈', labelEn: 'Home', icon: '🏠' },
  { id: 'route', labelKo: '경로', labelEn: 'Route', icon: '🗺️' },
  { id: 'feed', labelKo: '피드', labelEn: 'Feed', icon: '🧭' },
  { id: 'my', labelKo: '마이', labelEn: 'My', icon: '👤' },
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
              <Text className={cn('text-lg', active ? 'opacity-100' : 'opacity-50')}>
                {tab.icon}
              </Text>
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

import { useEffect, useRef, type ReactNode } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

import { PLAN_DETAIL_TABS, type PlanDetailTab } from '../../constants/planDetail';
import type { AppLanguage } from '../../types/user';
import { PlanTabBar } from './PlanTabBar';

const TAB_ORDER = PLAN_DETAIL_TABS.map(t => t.id);

type PlanTabPagerProps = {
  active: PlanDetailTab;
  onChange: (tab: PlanDetailTab) => void;
  language: AppLanguage;
  bottomInset: number;
  pages: Record<PlanDetailTab, ReactNode>;
};

export function PlanTabPager({
  active,
  onChange,
  language,
  bottomInset,
  pages,
}: PlanTabPagerProps) {
  const width = Dimensions.get('window').width;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const index = TAB_ORDER.indexOf(active);
    if (index >= 0) {
      scrollRef.current?.scrollTo({ x: index * width, animated: true });
    }
  }, [active, width]);

  const scrollToTab = (tab: PlanDetailTab) => {
    const index = TAB_ORDER.indexOf(tab);
    if (index >= 0) {
      scrollRef.current?.scrollTo({ x: index * width, animated: true });
    }
    onChange(tab);
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    const next = TAB_ORDER[index];
    if (next && next !== active) {
      onChange(next);
    }
  };

  return (
    <View className="flex-1">
      <PlanTabBar active={active} onChange={scrollToTab} language={language} />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}>
        {TAB_ORDER.map(tab => (
          <ScrollView
            key={tab}
            style={{ width }}
            contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
            showsVerticalScrollIndicator={false}>
            {pages[tab]}
          </ScrollView>
        ))}
      </ScrollView>
    </View>
  );
}

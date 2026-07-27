import { useEffect, useRef, type ReactNode } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

import { PLAN_DETAIL_TABS, type PlanDetailTab } from '../../../constants/plan/planDetail';
import type { AppLanguage } from '../../../types/user';
import { PlanTabBar } from './PlanTabBar';

const TAB_ORDER = PLAN_DETAIL_TABS.map(t => t.id);

type PlanTabPagerProps = {
  active: PlanDetailTab;
  onChange: (tab: PlanDetailTab) => void;
  language: AppLanguage;
  horizontalScrollEnabled?: boolean;
  /** Navbar 등 absolute 오버레이 위로 스크롤 콘텐츠를 올리기 위한 하단 여백 */
  scrollBottomInset?: number;
  pages: Record<PlanDetailTab, ReactNode>;
};

export function PlanTabPager({
  active,
  onChange,
  language,
  horizontalScrollEnabled = true,
  scrollBottomInset = 0,
  pages,
}: PlanTabPagerProps) {
  const width = Dimensions.get('window').width;
  const scrollRef = useRef<ScrollView>(null);
  /** 탭 버튼·위젯 등 코드로 페이지를 맞출 때 — 스와이프 동기화 이벤트 무시 */
  const syncingFromStateRef = useRef(false);
  const pageBottomPadding = 24 + scrollBottomInset;

  useEffect(() => {
    const index = TAB_ORDER.indexOf(active);
    if (index < 0) {
      return;
    }
    syncingFromStateRef.current = true;
    scrollRef.current?.scrollTo({ x: index * width, animated: false });
  }, [active, width]);

  const scrollToTab = (tab: PlanDetailTab) => {
    if (tab === active) {
      return;
    }
    onChange(tab);
  };

  const syncTabFromScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    const clamped = Math.max(0, Math.min(TAB_ORDER.length - 1, index));
    const next = TAB_ORDER[clamped];

    if (syncingFromStateRef.current) {
      if (next === active) {
        syncingFromStateRef.current = false;
      }
      return;
    }

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
        scrollEnabled={horizontalScrollEnabled}
        style={{ flex: 1 }}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={syncTabFromScroll}
        onScrollEndDrag={syncTabFromScroll}
        scrollEventThrottle={16}>
        {TAB_ORDER.map(tab =>
          tab === 'schedule' ? (
            <View key={tab} style={{ width, flex: 1 }}>
              {pages[tab]}
            </View>
          ) : (
            <ScrollView
              key={tab}
              style={{ width }}
              contentContainerStyle={{ paddingBottom: pageBottomPadding }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled>
              {pages[tab]}
            </ScrollView>
          ),
        )}
      </ScrollView>
    </View>
  );
}

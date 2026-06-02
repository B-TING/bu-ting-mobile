import { Pressable, ScrollView, Text } from 'react-native';

import { PLAN_DETAIL_TABS, type PlanDetailTab } from '../../constants/planDetail';
import type { AppLanguage } from '../../types/user';
import { cn } from '../../utils/cn';

type PlanTabBarProps = {
  active: PlanDetailTab;
  onChange: (tab: PlanDetailTab) => void;
  language: AppLanguage;
};

export function PlanTabBar({ active, onChange, language }: PlanTabBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="border-b border-brand-border bg-brand-surface">
      {PLAN_DETAIL_TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            className={cn(
              'px-4 py-3 active:opacity-80',
              isActive && 'border-b-2 border-brand-primary',
            )}>
            <Text
              className={cn(
                'text-sm font-semibold',
                isActive ? 'text-brand-primary' : 'text-brand-muted',
              )}>
              {tab.id === 'budget' ? '가계부' : tab.label[language]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

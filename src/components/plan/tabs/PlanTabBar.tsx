import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PLAN_DETAIL_TABS, type PlanDetailTab } from '../../../constants/planDetail';
import type { AppLanguage } from '../../../types/user';

const TAB_BAR_HEIGHT = 44;
const TAB_FONT_SIZE = 14;
const TAB_LINE_HEIGHT = 18;

type PlanTabBarProps = {
  active: PlanDetailTab;
  onChange: (tab: PlanDetailTab) => void;
  language: AppLanguage;
};

function tabLabel(tab: (typeof PLAN_DETAIL_TABS)[number], language: AppLanguage) {
  return tab.label[language];
}

export function PlanTabBar({ active, onChange, language }: PlanTabBarProps) {
  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {PLAN_DETAIL_TABS.map(tab => {
          const isActive = tab.id === active;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              style={[styles.tab, isActive && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}>
              <Text
                style={[
                  styles.label,
                  isActive ? styles.labelActive : styles.labelInactive,
                ]}>
                {tabLabel(tab, language)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: TAB_BAR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    height: TAB_BAR_HEIGHT,
    alignItems: 'stretch',
    paddingHorizontal: 4,
  },
  tab: {
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0077B6',
  },
  label: {
    fontSize: TAB_FONT_SIZE,
    lineHeight: TAB_LINE_HEIGHT,
    fontWeight: '600',
  },
  labelActive: {
    color: '#0077B6',
  },
  labelInactive: {
    color: '#64748B',
  },
});

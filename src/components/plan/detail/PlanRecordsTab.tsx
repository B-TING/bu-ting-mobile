import { Text, View } from 'react-native';

import type { PLAN_DETAIL_COPY } from '../../../constants/planDetail';
import type { AppLanguage } from '../../../types/user';

type Copy = (typeof PLAN_DETAIL_COPY)[AppLanguage];

type PlanRecordsTabProps = {
  copy: Copy;
  language: AppLanguage;
};

export function PlanRecordsTab({ copy, language }: PlanRecordsTabProps) {
  return (
    <View className="px-6 py-12">
      <View className="mb-6 items-center rounded-2xl border-2 border-dashed border-brand-border bg-brand-surface py-10">
        <Text className="text-4xl">📷</Text>
        <Text className="mt-3 text-sm font-semibold text-brand-text">
          {language === 'ko' ? '여행 기록' : 'Travel memories'}
        </Text>
      </View>
      <Text className="text-center text-sm text-brand-muted">{copy.recordsSoon}</Text>
    </View>
  );
}

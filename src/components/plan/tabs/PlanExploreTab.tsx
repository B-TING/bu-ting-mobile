import { Text, View } from 'react-native';

import { RouteMapView } from '../../../kakaoMap';
import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import type { RouteItem } from '../../../types/travelPlan';

type Copy = CopyFor<'planDetail'>;

type PlanExploreTabProps = {
  copy: Copy;
  language: AppLanguage;
  allRoutes: RouteItem[];
};

export function PlanExploreTab({ copy, language, allRoutes }: PlanExploreTabProps) {
  return (
    <View className="px-4 pb-8">
      <RouteMapView
        title={copy.mapPlaceholder}
        subtitle={copy.mapPlaceholderSub}
        routes={allRoutes}
        tapHint={copy.mapTapHint}
      />
      <Text className="mt-6 text-center text-sm text-brand-muted">{copy.exploreSoon}</Text>
      {language === 'ko' && (
        <Text className="mt-2 text-center text-xs text-brand-muted">
          주변 맛집·관광지 추천이 이곳에 표시됩니다.
        </Text>
      )}
    </View>
  );
}

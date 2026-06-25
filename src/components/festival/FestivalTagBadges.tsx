import { Text, View } from 'react-native';

import {
  festivalStatusLabel,
  getFestivalStatus,
  type BusanFestival,
  type FestivalStatus,
} from '../../constants/festival/festivalCalendar';
import type { AppLanguage } from '../../types/user';
import { cn } from '../../utils/common/cn';

type FestivalTagBadgesProps = {
  festival: BusanFestival;
  language: AppLanguage;
  className?: string;
};

function statusBadgeClass(status: FestivalStatus): string {
  if (status === 'upcoming') {
    return 'bg-violet-600';
  }
  if (status === 'ended') {
    return 'bg-slate-500';
  }
  return '';
}

export function FestivalTagBadges({ festival, language, className }: FestivalTagBadgesProps) {
  const status = getFestivalStatus(festival);

  return (
    <View className={cn('flex-row flex-wrap gap-1.5', className)}>
      <View
        className={cn(
          'rounded-md px-2 py-0.5',
          festival.tag === 'FESTIVAL' ? 'bg-brand-primary' : 'bg-orange-500',
        )}>
        <Text className="text-[10px] font-bold text-white">{festival.tag}</Text>
      </View>
      {status !== 'ongoing' ? (
        <View className={cn('rounded-md px-2 py-0.5', statusBadgeClass(status))}>
          <Text className="text-[10px] font-bold text-white">
            {festivalStatusLabel(status, language)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

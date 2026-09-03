import { Text, View } from 'react-native';

import { cn } from '../../utils/common/cn';

export type EventCalloutTone = 'warning' | 'event' | 'info';

type EventCalloutProps = {
  title: string;
  body: string;
  tone?: EventCalloutTone;
};

// Figma Callout: Event=bg#FDF2F8/border#F9A8D4/title#BE185D, Info=bg#E8F4FC/border#0077B6/title#0077B6, Warning=bg#FFF7ED/border#B45309/title#B45309
const TONE_CLASS: Record<EventCalloutTone, { wrap: string; title: string }> = {
  event: {
    wrap: 'border border-[#F9A8D4] bg-[#FDF2F8]',
    title: 'text-[#BE185D]',
  },
  info: {
    wrap: 'border border-[#0077B6] bg-[#E8F4FC]',
    title: 'text-[#0077B6]',
  },
  warning: {
    wrap: 'border border-[#B45309] bg-[#FFF7ED]',
    title: 'text-[#B45309]',
  },
};

export function EventCallout({ title, body, tone = 'warning' }: EventCalloutProps) {
  const styles = TONE_CLASS[tone];

  return (
    <View className={cn('gap-1.5 rounded-2xl px-3.5 py-3', styles.wrap)}>
      <Text className={cn('text-[13px] font-bold leading-5', styles.title)}>{title}</Text>
      <Text className="text-xs leading-[18px] text-[#1E293B]">{body}</Text>
    </View>
  );
}

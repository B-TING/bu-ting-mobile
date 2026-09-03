import { Text, View } from 'react-native';

import { cn } from '../../utils/common/cn';

type EventInfoCardTone = 'default' | 'event' | 'warning' | 'success';

type EventInfoCardProps = {
  label: string;
  title: string;
  body?: string;
  tone?: EventInfoCardTone;
};

// Figma InfoCard: label(11px bold muted), title(13px bold text), body(12px regular text)
// Tones: default=bg-white/border-#E2E8F0, event=bg-#FDF2F8/border-#F9A8D4, warning=bg-#FFF7ED/border-#FED7AA, success=bg-#ECFDF5/border-#A7F3D0
const TONE_WRAP: Record<EventInfoCardTone, { wrap: string; label: string }> = {
  default: { wrap: 'border-[#E2E8F0] bg-white', label: 'text-[#64748B]' },
  event: { wrap: 'border-[#F9A8D4] bg-[#FDF2F8]', label: 'text-[#BE185D]' },
  warning: { wrap: 'border-[#FED7AA] bg-[#FFF7ED]', label: 'text-[#B45309]' },
  success: { wrap: 'border-[#A7F3D0] bg-[#ECFDF5]', label: 'text-[#047857]' },
};

export function EventInfoCard({
  label,
  title,
  body,
  tone = 'default',
}: EventInfoCardProps) {
  const styles = TONE_WRAP[tone];
  return (
    <View className={cn('gap-1 rounded-2xl border px-3.5 py-3', styles.wrap)}>
      <Text className={cn('text-[11px] font-bold leading-[15px]', styles.label)}>{label}</Text>
      <Text className="text-[13px] font-bold leading-[18px] text-[#1E293B]">{title}</Text>
      {body ? (
        <Text className="text-xs leading-[18px] text-[#1E293B]">{body}</Text>
      ) : null}
    </View>
  );
}

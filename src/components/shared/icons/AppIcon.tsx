import type { LucideIconName } from '../../../constants/icons';
import { ICON_COLOR_DEFAULT, LUCIDE_ICONS } from '../../../constants/icons';

type AppIconProps = {
  name: LucideIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
};

/** Lucide 아이콘 — `src/constants/icons/lucideIcons.ts` 레지스트리 이름으로 렌더 */
export function AppIcon({
  name,
  size = 24,
  color = ICON_COLOR_DEFAULT,
  strokeWidth = 2,
  filled = false,
}: AppIconProps) {
  const Icon = LUCIDE_ICONS[name];
  return (
    <Icon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={filled ? color : 'transparent'}
    />
  );
}

import { HelpDeskChatFab } from './HelpDeskChatFab';
import { ScheduleRebootFab } from '../plan/fab/ScheduleRebootFab';

const FAB_SIZE = 56;
const FAB_GAP = 12;

type HomeActionFabsProps = {
  bottom: number;
  helpLabel: string;
  showReboot: boolean;
  onHelpPress: () => void;
  onRebootPress: () => void;
};

/** 메인 홈 — AI 헬프데스크(위) + 리부트(아래) FAB */
export function HomeActionFabs({
  bottom,
  helpLabel,
  showReboot,
  onHelpPress,
  onRebootPress,
}: HomeActionFabsProps) {
  const rebootBottom = bottom;
  const helpBottom = showReboot ? bottom + FAB_SIZE + FAB_GAP : bottom;

  return (
    <>
      <HelpDeskChatFab
        bottom={helpBottom}
        accessibilityLabel={helpLabel}
        onPress={onHelpPress}
      />
      {showReboot ? (
        <ScheduleRebootFab bottom={rebootBottom} onPress={onRebootPress} />
      ) : null}
    </>
  );
}

export { FAB_SIZE, FAB_GAP };

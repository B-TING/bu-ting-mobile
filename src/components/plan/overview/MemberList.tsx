import { Pressable, ScrollView, Text, View } from 'react-native';

import type { MemberRole, PlanMember } from '../../../types/travelPlan';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';

type MemberListProps = {
  members: PlanMember[];
  title: string;
  roleLabels: Record<MemberRole, string>;
  inviteLabel?: string;
  onInvite?: () => void;
};

function initials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

const AVATAR_COLORS = ['#0077B6', '#00B4D8', '#F97316', '#8B5CF6', '#10B981'];

const CARD_WIDTH = 96;

export function MemberList({
  members,
  title,
  roleLabels,
  inviteLabel,
  onInvite,
}: MemberListProps) {
  return (
    <View className="mb-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-bold text-brand-text">{title}</Text>
        {inviteLabel && onInvite && (
          <Pressable
            onPress={onInvite}
            className="rounded-full border border-brand-primary bg-brand-selected px-2.5 py-1 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={inviteLabel}>
            <Text className="text-[10px] font-semibold text-brand-primary">{inviteLabel}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
        {members.map((m, i) => (
          <View
            key={m.userId}
            style={{ width: CARD_WIDTH }}
            className="items-center rounded-xl border border-brand-border bg-brand-surface px-2 py-2.5">
            <View
              className="mb-1.5 h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
              <Text className="text-xs font-bold text-white">{initials(m.nickname)}</Text>
            </View>
            <Text className="w-full text-center text-xs font-semibold text-brand-text" numberOfLines={1}>
              {m.nickname}
            </Text>
            <Text className="mt-0.5 text-[10px] text-brand-muted" numberOfLines={1}>
              {roleLabels[m.role]}
            </Text>
          </View>
        ))}

        {inviteLabel && onInvite ? (
          <Pressable
            onPress={onInvite}
            style={{ width: CARD_WIDTH }}
            className="items-center justify-center rounded-xl border border-dashed border-brand-primary/40 bg-brand-primary/5 px-2 py-2.5 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={inviteLabel}>
            <AppIcon name="plus" size={20} color={ICON_COLOR_PRIMARY} />
            <Text className="mt-0.5 text-[10px] font-semibold text-brand-primary" numberOfLines={2}>
              {inviteLabel}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

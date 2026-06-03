import { Pressable, Text, View } from 'react-native';

import type { MemberRole, PlanMember } from '../../types/travelPlan';
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

export function MemberList({
  members,
  title,
  roleLabels,
  inviteLabel,
  onInvite,
}: MemberListProps) {
  return (
    <View className="mb-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold text-brand-text">{title}</Text>
        {inviteLabel && onInvite && (
          <Pressable
            onPress={onInvite}
            className="rounded-full border border-brand-primary bg-brand-selected px-3 py-1.5 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={inviteLabel}>
            <Text className="text-xs font-semibold text-brand-primary">{inviteLabel}</Text>
          </Pressable>
        )}
      </View>
      {members.map((m, i) => (
        <View
          key={m.userId}
          className="mb-2 flex-row items-center rounded-xl border border-brand-border bg-brand-surface px-3 py-3">
          <View
            className="mr-3 h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
            <Text className="font-bold text-white">{initials(m.nickname)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-brand-text">{m.nickname}</Text>
            <Text className="text-xs text-brand-muted">{roleLabels[m.role]}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

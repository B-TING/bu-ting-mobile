import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  BUSAN_SUBWAY_LINE_COLOR_FALLBACK,
  getSubwayLineColor,
  getSubwayLineTint,
} from '../../constants/locker/subwayLineColors';

export type LockerLineFilter = 'all' | 'unknown' | number;

type LockerLineFilterBarProps = {
  lines: number[];
  hasUnknown: boolean;
  value: LockerLineFilter;
  onChange: (next: LockerLineFilter) => void;
  allLabel: string;
  unknownLabel: string;
  lineLabel: (line: number) => string;
};

type ChipProps = {
  label: string;
  selected: boolean;
  color: string;
  tint: string;
  onPress: () => void;
};

function FilterChip({ label, selected, color, tint, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="rounded-full border px-3 py-1.5 active:opacity-80"
      style={{
        borderColor: selected ? color : '#E2E8F0',
        backgroundColor: selected ? tint : '#FFFFFF',
      }}>
      <Text
        className="text-xs font-bold"
        style={{ color: selected ? color : '#64748B' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function LockerLineFilterBar({
  lines,
  hasUnknown,
  value,
  onChange,
  allLabel,
  unknownLabel,
  lineLabel,
}: LockerLineFilterBarProps) {
  if (lines.length === 0 && !hasUnknown) {
    return null;
  }

  const select = (next: LockerLineFilter) => {
    onChange(value === next ? 'all' : next);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, gap: 8 }}>
      <FilterChip
        label={allLabel}
        selected={value === 'all'}
        color="#0077B6"
        tint="rgba(0,119,182,0.12)"
        onPress={() => onChange('all')}
      />
      {lines.map(line => (
        <FilterChip
          key={line}
          label={lineLabel(line)}
          selected={value === line}
          color={getSubwayLineColor(line)}
          tint={getSubwayLineTint(line)}
          onPress={() => select(line)}
        />
      ))}
      {hasUnknown ? (
        <FilterChip
          label={unknownLabel}
          selected={value === 'unknown'}
          color={BUSAN_SUBWAY_LINE_COLOR_FALLBACK}
          tint={getSubwayLineTint(0)}
          onPress={() => select('unknown')}
        />
      ) : null}
      <View className="w-1" />
    </ScrollView>
  );
}

import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR_MUTED } from '../../../constants/icons';
import { GoogleGIcon } from '../../setup/icons/GoogleGIcon';
import { KakaoSymbolIcon } from '../../setup/icons/KakaoSymbolIcon';
import { AppIcon } from '../../shared/icons/AppIcon';
import { ScheduleTimelineRail } from './ScheduleTimelineRail';

type DirectionsButtonProps = {
  label: string;
  disabled?: boolean;
  onPress?: () => void;
  variant?: 'google' | 'kakao';
};

function DirectionsButtonIcon({
  variant,
  disabled,
}: {
  variant: 'google' | 'kakao';
  disabled: boolean;
}) {
  if (variant === 'google') {
    return (
      <View style={disabled ? { opacity: 0.45 } : undefined}>
        <GoogleGIcon size={14} />
      </View>
    );
  }

  return (
    <KakaoSymbolIcon
      size={14}
      color={disabled ? ICON_COLOR_MUTED : '#3C1E1E'}
    />
  );
}

function DirectionsButton({
  label,
  disabled = false,
  onPress,
  variant = 'google',
}: DirectionsButtonProps) {
  const isKakao = variant === 'kakao';
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityLabel={label}
      className={`flex-row items-center rounded-lg border px-2 py-1 active:opacity-90 ${
        disabled
          ? 'border-brand-border bg-brand-background'
          : isKakao
            ? 'border-[#F9E000] bg-[#FFFBE6]'
            : 'border-brand-primary bg-brand-selected'
      }`}>
      <DirectionsButtonIcon variant={variant} disabled={disabled} />
      <Text
        className={`ml-1 text-xs font-semibold ${
          disabled ? 'text-brand-muted' : isKakao ? 'text-[#3C1E1E]' : 'text-brand-primary'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

type TravelLegRowProps = {
  googleLabel: string;
  kakaoLabel: string;
  lineColor?: string;
  onGooglePress?: () => void;
  onKakaoPress?: () => void;
  directionsDisabled?: boolean;
};

export function TravelLegRow({
  googleLabel,
  kakaoLabel,
  lineColor = '#CBD5E1',
  onGooglePress,
  onKakaoPress,
  directionsDisabled = false,
}: TravelLegRowProps) {
  return (
    <View className="flex-row items-stretch py-1">
      <ScheduleTimelineRail
        lineColor={lineColor}
        extendTop={14}
        extendBottom={14}
        dashed
        node={
          <View className="h-8 w-8 items-center justify-center rounded-full border border-brand-border bg-brand-surface">
            <AppIcon name="map" size={16} color={ICON_COLOR_MUTED} />
          </View>
        }
      />
      <View className="flex-1 justify-center pl-1">
        <View className="flex-row flex-wrap gap-1.5">
          <DirectionsButton
            label={googleLabel}
            disabled={directionsDisabled}
            onPress={onGooglePress}
            variant="google"
          />
          <DirectionsButton
            label={kakaoLabel}
            disabled={directionsDisabled}
            onPress={onKakaoPress}
            variant="kakao"
          />
        </View>
      </View>
    </View>
  );
}

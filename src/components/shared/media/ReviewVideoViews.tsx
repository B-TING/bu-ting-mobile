import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ICON_COLOR_MUTED,
  ICON_COLOR_WHITE,
} from '../../../constants/icons';
import { AppIcon } from '../icons/AppIcon';
import { ResolvedRemoteVideo } from './ResolvedRemoteVideo';
import { ReviewVideoPlayerModal } from './ReviewVideoPlayerModal';

const FILL = {
  position: 'absolute' as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

type ReviewVideoThumbProps = {
  uri: string;
  fileKey?: string | null;
  size?: number;
};

/** 작은 썸네일 — 탭 시 전체 화면 재생 */
export function ReviewVideoThumb({
  uri,
  fileKey,
  size = 56,
}: ReviewVideoThumbProps) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ width: size, height: size }}
        className="relative overflow-hidden rounded-xl bg-brand-selected active:opacity-90"
        accessibilityRole="button"
        accessibilityLabel="Play video">
        {!failed ? (
          <ResolvedRemoteVideo
            uri={uri}
            fileKey={fileKey}
            style={FILL}
            paused
            muted
            repeat={false}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <AppIcon name="film" size={18} color={ICON_COLOR_MUTED} />
          </View>
        )}
        <View className="absolute inset-0 items-center justify-center bg-black/25">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-black/55">
            <AppIcon name="play" size={14} color={ICON_COLOR_WHITE} />
          </View>
        </View>
        <View className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5">
          <Text className="text-center text-[8px] font-bold text-white">VIDEO</Text>
        </View>
      </Pressable>
      <ReviewVideoPlayerModal
        visible={open}
        uri={uri}
        fileKey={fileKey}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

type ReviewVideoSlideProps = {
  uri: string;
  fileKey?: string | null;
  width: number;
  height: number;
  /** 캐러셀에서 현재 보이는 슬라이드일 때 true */
  active: boolean;
  onError?: () => void;
};

/** 피드/상세 캐러셀 영상 슬라이드 — 활성 시 음소거 자동재생, 탭으로 일시정지 */
export function ReviewVideoSlide({
  uri,
  fileKey,
  width,
  height,
  active,
  onError,
}: ReviewVideoSlideProps) {
  const [paused, setPaused] = useState(!active);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPaused(!active);
  }, [active]);

  if (failed) {
    return (
      <View
        style={{ width, height }}
        className="items-center justify-center bg-brand-selected">
        <AppIcon name="film" size={32} color={ICON_COLOR_MUTED} />
        <Text className="mt-2 text-xs text-brand-muted">VIDEO</Text>
      </View>
    );
  }

  return (
    <View style={{ width, height }} className="bg-black">
      <ResolvedRemoteVideo
        uri={uri}
        fileKey={fileKey}
        style={FILL}
        paused={paused}
        muted={muted}
        repeat
        resizeMode="cover"
        onError={() => {
          setFailed(true);
          onError?.();
        }}
      />
      <Pressable
        style={FILL}
        onPress={() => setPaused(prev => !prev)}
        accessibilityRole="button"
        accessibilityLabel={paused ? 'Play' : 'Pause'}
      />
      {paused ? (
        <View pointerEvents="none" style={styles.centerPlay}>
          <View className="h-16 w-16 items-center justify-center rounded-full bg-black/50">
            <AppIcon name="play" size={32} color={ICON_COLOR_WHITE} />
          </View>
        </View>
      ) : null}
      <Pressable
        onPress={() => setMuted(prev => !prev)}
        style={styles.muteBtn}
        className="active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={muted ? 'Unmute' : 'Mute'}>
        <AppIcon
          name={muted ? 'volumeX' : 'volume2'}
          size={18}
          color={ICON_COLOR_WHITE}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centerPlay: {
    ...FILL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

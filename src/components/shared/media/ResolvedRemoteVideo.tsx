import { useEffect, useState, type RefObject } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Video, { type OnVideoErrorData, type VideoRef } from 'react-native-video';

import { selectReusableAccessToken, useAuthStore } from '../../../stores/useAuthStore';
import {
  refreshDisplayUri,
  useResolvedDisplayUri,
} from '../../../utils/media/useResolvedDisplayUri';

type ResolvedRemoteVideoProps = {
  uri: string;
  fileKey?: string | null;
  style?: StyleProp<ViewStyle>;
  paused?: boolean;
  muted?: boolean;
  repeat?: boolean;
  controls?: boolean;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'none';
  videoRef?: RefObject<VideoRef | null>;
  onError?: () => void;
  onEnd?: () => void;
};

function isLocalUri(uri: string): boolean {
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  );
}

/**
 * Presigned / 로컬 영상 URI 재생.
 * 서명 만료 시 fileKey 로 URL 을 한 번 재발급한다.
 */
export function ResolvedRemoteVideo({
  uri,
  fileKey,
  style,
  paused = false,
  muted = true,
  repeat = false,
  controls = false,
  resizeMode = 'cover',
  videoRef,
  onError,
  onEnd,
}: ResolvedRemoteVideoProps) {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const resolvedUri = useResolvedDisplayUri(uri, fileKey);
  const [displayUri, setDisplayUri] = useState(resolvedUri);
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    setDisplayUri(resolvedUri);
    setRetried(false);
  }, [resolvedUri]);

  const handleError = (_error: OnVideoErrorData) => {
    if (!retried && (uri.startsWith('http://') || uri.startsWith('https://'))) {
      setRetried(true);
      void (async () => {
        const next = await refreshDisplayUri(uri, { accessToken, fileKey });
        if (next && next !== displayUri) {
          setDisplayUri(next);
          return;
        }
        onError?.();
      })();
      return;
    }
    onError?.();
  };

  if (!displayUri) {
    return <View style={style} />;
  }

  return (
    <Video
      ref={videoRef}
      source={{
        uri: displayUri,
        isNetwork: !isLocalUri(displayUri),
      }}
      style={[styles.video, style]}
      paused={paused}
      muted={muted}
      repeat={repeat}
      controls={controls}
      resizeMode={resizeMode}
      ignoreSilentSwitch="ignore"
      playInBackground={false}
      playWhenInactive={false}
      onError={handleError}
      onEnd={onEnd}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    backgroundColor: '#000',
  },
});

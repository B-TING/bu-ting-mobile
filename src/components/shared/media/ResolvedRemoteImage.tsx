import { useEffect, useState } from 'react';
import {
  Image,
  type ImageErrorEventData,
  type ImageStyle,
  type NativeSyntheticEvent,
  type StyleProp,
} from 'react-native';

import { selectReusableAccessToken, useAuthStore } from '../../../stores/useAuthStore';
import { resolveDisplayMediaUrl } from '../../../utils/media/resolveMediaUrl';

type ResolvedRemoteImageProps = {
  uri: string;
  fileKey?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';
  onError?: (event: NativeSyntheticEvent<ImageErrorEventData>) => void;
};

/**
 * 서명 없는 S3 URL 은 fileKey 로 Presigned URL 을 받아 표시한다.
 */
export function ResolvedRemoteImage({
  uri,
  fileKey,
  style,
  resizeMode = 'cover',
  onError,
}: ResolvedRemoteImageProps) {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const [displayUri, setDisplayUri] = useState(uri);
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRetried(false);
    setDisplayUri(uri);

    void (async () => {
      const resolved = await resolveDisplayMediaUrl(uri, {
        accessToken,
        fileKey,
      });
      if (!cancelled && resolved) {
        setDisplayUri(resolved);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri, fileKey, accessToken]);

  return (
    <Image
      source={{ uri: displayUri }}
      style={style}
      resizeMode={resizeMode}
      onError={event => {
        if (!retried) {
          setRetried(true);
          void (async () => {
            const resolved = await resolveDisplayMediaUrl(uri, {
              accessToken,
              fileKey,
              forceRefresh: true,
            });
            if (resolved && resolved !== displayUri) {
              setDisplayUri(resolved);
              return;
            }
            onError?.(event);
          })();
          return;
        }
        onError?.(event);
      }}
    />
  );
}

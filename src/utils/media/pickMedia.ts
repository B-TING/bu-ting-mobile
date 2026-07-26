import { Alert, Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type CameraOptions,
  type ImageLibraryOptions,
} from 'react-native-image-picker';

import type { ReviewMediaType } from '../../types/travelReview';

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export type MediaPickAsset = {
  uri: string;
  type: ReviewMediaType;
  fileName: string;
  mimeType: string;
  fileSize?: number;
};

export type MediaPickResult =
  | { status: 'ok'; asset: MediaPickAsset }
  | { status: 'cancelled' }
  | { status: 'denied' }
  | { status: 'error'; message: string };

export type MediaSourceChoice = 'library' | 'camera';

type PickLabels = {
  title: string;
  chooseFromLibrary: string;
  takePhoto: string;
  takeVideo: string;
  cancel: string;
};

function isVideoMime(mime?: string | null): boolean {
  return Boolean(mime?.startsWith('video/'));
}

function defaultMime(type: ReviewMediaType, mime?: string | null): string {
  if (mime && mime.length > 0) {
    return mime;
  }
  return type === 'video' ? 'video/mp4' : 'image/jpeg';
}

function defaultFileName(type: ReviewMediaType, fileName?: string | null): string {
  if (fileName && fileName.length > 0) {
    return fileName;
  }
  const ext = type === 'video' ? 'mp4' : 'jpg';
  return `review-${Date.now()}.${ext}`;
}

function mapAsset(asset: Asset, preferredType: ReviewMediaType): MediaPickResult {
  if (!asset.uri) {
    return { status: 'error', message: 'Selected file has no URI' };
  }
  if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_FILE_BYTES) {
    return { status: 'error', message: 'File exceeds 50MB limit' };
  }

  const type: ReviewMediaType = isVideoMime(asset.type)
    ? 'video'
    : preferredType === 'video'
      ? 'video'
      : 'image';

  return {
    status: 'ok',
    asset: {
      uri: asset.uri,
      type,
      fileName: defaultFileName(type, asset.fileName),
      mimeType: defaultMime(type, asset.type),
      fileSize: asset.fileSize,
    },
  };
}

function mapPickerError(errorCode?: string, errorMessage?: string): MediaPickResult {
  if (errorCode === 'camera_unavailable') {
    return { status: 'error', message: errorMessage ?? 'Camera unavailable' };
  }
  if (errorCode === 'permission') {
    return { status: 'denied' };
  }
  return { status: 'error', message: errorMessage ?? 'Failed to pick media' };
}

async function openLibrary(mediaType: 'photo' | 'video'): Promise<MediaPickResult> {
  const options: ImageLibraryOptions = {
    mediaType,
    selectionLimit: 1,
    includeBase64: false,
  };
  const result = await launchImageLibrary(options);
  if (result.didCancel) {
    return { status: 'cancelled' };
  }
  if (result.errorCode) {
    return mapPickerError(result.errorCode, result.errorMessage);
  }
  const asset = result.assets?.[0];
  if (!asset) {
    return { status: 'cancelled' };
  }
  return mapAsset(asset, mediaType === 'video' ? 'video' : 'image');
}

async function openCamera(mediaType: 'photo' | 'video'): Promise<MediaPickResult> {
  const options: CameraOptions = {
    mediaType,
    cameraType: 'back',
    saveToPhotos: false,
    includeBase64: false,
    ...(mediaType === 'video' ? { durationLimit: 60 } : {}),
  };
  const result = await launchCamera(options);
  if (result.didCancel) {
    return { status: 'cancelled' };
  }
  if (result.errorCode) {
    return mapPickerError(result.errorCode, result.errorMessage);
  }
  const asset = result.assets?.[0];
  if (!asset) {
    return { status: 'cancelled' };
  }
  return mapAsset(asset, mediaType === 'video' ? 'video' : 'image');
}

/**
 * 갤러리/카메라 중 소스를 고른 뒤 사진 또는 영상을 하나 선택합니다.
 */
export function pickReviewMedia(options: {
  mediaType: ReviewMediaType;
  labels: PickLabels;
}): Promise<MediaPickResult> {
  const { mediaType, labels } = options;
  const libraryLabel = labels.chooseFromLibrary;
  const cameraLabel = mediaType === 'video' ? labels.takeVideo : labels.takePhoto;
  const pickerMediaType = mediaType === 'video' ? 'video' : 'photo';

  return new Promise(resolve => {
    Alert.alert(
      labels.title,
      undefined,
      [
        {
          text: libraryLabel,
          onPress: () => {
            void openLibrary(pickerMediaType).then(resolve);
          },
        },
        {
          text: cameraLabel,
          onPress: () => {
            void openCamera(pickerMediaType).then(resolve);
          },
        },
        {
          text: labels.cancel,
          style: 'cancel',
          onPress: () => resolve({ status: 'cancelled' }),
        },
      ],
      { cancelable: true, onDismiss: () => resolve({ status: 'cancelled' }) },
    );
  });
}

/** Android 에서 content:// URI 는 그대로 FormData 에 넣습니다. */
export function normalizeLocalUri(uri: string): string {
  if (Platform.OS === 'ios' && uri.startsWith('file://')) {
    return uri;
  }
  return uri;
}

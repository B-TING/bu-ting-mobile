import { Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type CameraOptions,
  type ImageLibraryOptions,
} from 'react-native-image-picker';

import type { ReviewMediaType } from '../../types/travelReview';

const MAX_FILE_BYTES = 50 * 1024 * 1024;

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

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

type PickLabels = {
  title: string;
  chooseFromLibrary: string;
  takePhoto: string;
  takeVideo: string;
  cancel: string;
  /** MP4/MOV 외 형식 안내 */
  unsupportedVideoFormat: string;
  unsupportedImageFormat: string;
  fileTooLarge: string;
};

function extensionOf(fileName?: string | null, uri?: string | null): string {
  const fromName = fileName?.match(/\.([a-z0-9]+)$/i)?.[1];
  if (fromName) {
    return fromName.toLowerCase();
  }
  const path = (uri ?? '').split('?')[0] ?? '';
  const fromUri = path.match(/\.([a-z0-9]+)$/i)?.[1];
  return (fromUri ?? '').toLowerCase();
}

function normalizeMime(
  preferredType: ReviewMediaType,
  rawMime?: string | null,
  fileName?: string | null,
  uri?: string | null,
): { mimeType: string; type: ReviewMediaType } | { error: string } {
  const ext = extensionOf(fileName, uri);
  const mime = (rawMime ?? '').toLowerCase().trim();
  const looksVideo =
    preferredType === 'video' ||
    mime.startsWith('video/') ||
    ['mp4', 'mov', 'm4v', 'qt', '3gp', '3gpp', 'webm', 'mkv'].includes(ext);

  if (looksVideo) {
    if (['3gp', '3gpp', 'webm', 'mkv', 'avi', 'wmv', 'flv', 'ts'].includes(ext)) {
      return { error: 'unsupported_video' };
    }
    if (
      ['video/3gpp', 'video/3gpp2', 'video/webm', 'video/x-matroska', 'video/avi'].includes(
        mime,
      )
    ) {
      return { error: 'unsupported_video' };
    }
    if (ext === 'mov' || mime === 'video/quicktime') {
      return { mimeType: 'video/quicktime', type: 'video' };
    }
    // mp4 / m4v / 모호한 video/* → 서버 허용 MIME 으로 정규화
    if (
      ['mp4', 'm4v', ''].includes(ext) ||
      mime === 'video/mp4' ||
      mime === 'video/x-m4v' ||
      mime === 'application/mp4' ||
      mime === 'video/*' ||
      mime === '' ||
      mime.startsWith('video/')
    ) {
      return { mimeType: 'video/mp4', type: 'video' };
    }
    return { error: 'unsupported_video' };
  }

  if (['heic', 'heif', 'gif', 'bmp', 'tif', 'tiff'].includes(ext)) {
    return { error: 'unsupported_image' };
  }
  if (ext === 'png' || mime === 'image/png') {
    return { mimeType: 'image/png', type: 'image' };
  }
  if (ext === 'webp' || mime === 'image/webp') {
    return { mimeType: 'image/webp', type: 'image' };
  }
  if (
    ['jpg', 'jpeg', ''].includes(ext) ||
    ALLOWED_IMAGE_MIME.has(mime) ||
    mime === 'image/*' ||
    mime.startsWith('image/') ||
    mime === ''
  ) {
    return { mimeType: 'image/jpeg', type: 'image' };
  }

  return preferredType === 'video'
    ? { error: 'unsupported_video' }
    : { error: 'unsupported_image' };
}

function ensureFileName(
  type: ReviewMediaType,
  mimeType: string,
  fileName?: string | null,
): string {
  const ext =
    mimeType === 'video/quicktime'
      ? 'mov'
      : mimeType === 'video/mp4'
        ? 'mp4'
        : mimeType === 'image/png'
          ? 'png'
          : mimeType === 'image/webp'
            ? 'webp'
            : type === 'video'
              ? 'mp4'
              : 'jpg';

  const base =
    fileName && fileName.trim().length > 0
      ? fileName.replace(/\.[^/.]+$/, '')
      : `review-${Date.now()}`;
  return `${base}.${ext}`;
}

function mapAsset(
  asset: Asset,
  preferredType: ReviewMediaType,
  labels: PickLabels,
): MediaPickResult {
  if (!asset.uri) {
    return { status: 'error', message: 'Selected file has no URI' };
  }
  if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_FILE_BYTES) {
    return { status: 'error', message: labels.fileTooLarge };
  }

  const normalized = normalizeMime(
    preferredType,
    asset.type,
    asset.fileName,
    asset.uri,
  );
  if ('error' in normalized) {
    return {
      status: 'error',
      message:
        normalized.error === 'unsupported_video'
          ? labels.unsupportedVideoFormat
          : labels.unsupportedImageFormat,
    };
  }

  return {
    status: 'ok',
    asset: {
      uri: asset.uri,
      type: normalized.type,
      fileName: ensureFileName(normalized.type, normalized.mimeType, asset.fileName),
      mimeType: normalized.mimeType,
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

async function openLibrary(
  mediaType: 'photo' | 'video',
  labels: PickLabels,
): Promise<MediaPickResult> {
  const options: ImageLibraryOptions = {
    mediaType,
    selectionLimit: 1,
    includeBase64: false,
    ...(Platform.OS === 'ios' && mediaType === 'video'
      ? { formatAsMp4: true, assetRepresentationMode: 'compatible' as const }
      : {}),
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
  return mapAsset(asset, mediaType === 'video' ? 'video' : 'image', labels);
}

async function openCamera(
  mediaType: 'photo' | 'video',
  labels: PickLabels,
): Promise<MediaPickResult> {
  const options: CameraOptions = {
    mediaType,
    cameraType: 'back',
    saveToPhotos: false,
    includeBase64: false,
    ...(mediaType === 'video'
      ? {
          durationLimit: 60,
          ...(Platform.OS === 'ios'
            ? { formatAsMp4: true, assetRepresentationMode: 'compatible' as const }
            : {}),
        }
      : {}),
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
  return mapAsset(asset, mediaType === 'video' ? 'video' : 'image', labels);
}

/**
 * 사진 또는 영상을 하나 선택합니다.
 * 서버 허용: JPEG/PNG/WebP, MP4/MOV (≤50MB)
 *
 * UI(소스 선택·권한 안내)는 호출측 커스텀 모달에서 처리하고,
 * 여기서는 앨범/카메라 피커만 실행합니다.
 */
export async function pickReviewMedia(options: {
  mediaType: ReviewMediaType;
  labels: PickLabels;
  source: 'library' | 'camera';
}): Promise<MediaPickResult> {
  const { mediaType, labels, source } = options;
  const pickerMediaType = mediaType === 'video' ? 'video' : 'photo';
  return source === 'camera'
    ? openCamera(pickerMediaType, labels)
    : openLibrary(pickerMediaType, labels);
}

/** Android 에서 content:// URI 는 그대로 FormData 에 넣습니다. */
export function normalizeLocalUri(uri: string): string {
  if (Platform.OS === 'ios' && uri.startsWith('file://')) {
    return uri;
  }
  return uri;
}

/**
 * 후기 `mediaUrls` 저장용 URL.
 * 업로드 응답 Presigned GET URL 은 쿼리 포함 시 1000자(OpenAPI maxLength)를 넘기므로
 * 서명 쿼리를 제거한 객체 URL 만 보낸다.
 */
export function toStoredMediaUrl(uri: string): string {
  try {
    const parsed = new URL(uri);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    const withoutQuery = uri.split('?')[0] ?? uri;
    return withoutQuery.split('#')[0] ?? withoutQuery;
  }
}

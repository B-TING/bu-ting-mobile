import { API_BASE_URL, FILE_ENDPOINTS } from '../../constants/api/apiConfig';
import type { FileUploadResponse, LocalFileUploadInput } from '../../types/fileApi';
import {
  ApiClientError,
  parseApiErrorMessage,
  unwrapApiData,
} from '../api/apiClient';
import type { ApiEnvelope } from '../../types/auth';
import { normalizeLocalUri } from '../../utils/media/pickMedia';

function filesUrl(fileKey?: string): string {
  if (fileKey) {
    return `${API_BASE_URL}${FILE_ENDPOINTS.files}?fileKey=${encodeURIComponent(fileKey)}`;
  }
  return `${API_BASE_URL}${FILE_ENDPOINTS.files}`;
}

/**
 * `POST /api/v1/files` — multipart/form-data `file`
 * Content-Type 은 설정하지 않아 boundary 가 자동 설정됩니다.
 */
export async function uploadFile(
  accessToken: string,
  input: LocalFileUploadInput,
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: normalizeLocalUri(input.uri),
    type: input.type,
    name: input.name,
  } as unknown as Blob);

  let res: Response;
  let parsedBody: unknown = null;

  try {
    res = await fetch(filesUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      body: formData,
    });
    if (res.status !== 204) {
      parsedBody = await res.json().catch(() => null);
    }
  } catch (cause) {
    throw new ApiClientError('File upload: network error', {
      url: filesUrl(),
      cause,
    });
  }

  if (!res.ok) {
    throw new ApiClientError(
      parseApiErrorMessage(res, parsedBody, 'File upload failed'),
      {
        status: res.status,
        url: filesUrl(),
        responseBody: parsedBody,
      },
    );
  }

  const data =
    unwrapApiData<FileUploadResponse>(
      parsedBody as ApiEnvelope<FileUploadResponse> | FileUploadResponse,
    ) ?? (parsedBody as FileUploadResponse | null);

  if (!data?.url || !data.fileKey) {
    throw new ApiClientError('File upload failed: empty response', {
      status: res.status,
      url: filesUrl(),
      responseBody: parsedBody,
    });
  }

  return data;
}

/** `DELETE /api/v1/files?fileKey=` */
export async function deleteFile(
  accessToken: string,
  fileKey: string,
): Promise<void> {
  const url = filesUrl(fileKey);
  let res: Response;
  let parsedBody: unknown = null;

  try {
    res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
    if (res.status !== 204) {
      parsedBody = await res.json().catch(() => null);
    }
  } catch (cause) {
    throw new ApiClientError('File delete: network error', { url, cause });
  }

  if (!res.ok && res.status !== 204) {
    throw new ApiClientError(
      parseApiErrorMessage(res, parsedBody, 'File delete failed'),
      {
        status: res.status,
        url,
        responseBody: parsedBody,
      },
    );
  }
}

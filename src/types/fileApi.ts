/** OpenAPI `FileUploadResponse` */
export type FileUploadResponse = {
  fileKey: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  /** Presigned GET URL (기본 1시간) */
  url: string;
};

export type LocalFileUploadInput = {
  uri: string;
  /** multipart filename */
  name: string;
  /** MIME type e.g. image/jpeg, video/mp4 */
  type: string;
};

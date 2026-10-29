export interface DriveFile {
  id: string;
  name: string;
  size?: string;
  mimeType?: string;
  appProperties?: Record<string, string>;
  trashed?: boolean;
}

export interface DriveChange {
  fileId?: string;
  removed?: boolean;
  file?: DriveFile;
}

export interface DriveHttp {
  request(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface DriveClientOptions {
  accessToken: string;
  http?: DriveHttp;
  baseUrl?: string;
  uploadBaseUrl?: string;
}

export interface FileListResponse {
  files?: DriveFile[];
  nextPageToken?: string;
}

export interface ChangesResponse {
  changes?: DriveChange[];
  nextPageToken?: string;
  newStartPageToken?: string;
}

export interface ContentUpload {
  name: string;
  hash: string;
  body: Blob;
}

export const defaultHttp: DriveHttp = {
  request: (input, init) => fetch(input, init),
};

export class DriveApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function buildMultipartBlob(options: {
  name: string;
  body: Blob;
  parents?: string[];
  mimeType?: string;
  appProperties?: Record<string, string>;
}): { boundary: string; blob: Blob } {
  const boundary = `davinci-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({
    name: options.name,
    parents: options.parents,
    mimeType: options.mimeType,
    appProperties: options.appProperties,
  });
  const blob = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${options.mimeType || options.body.type || "application/octet-stream"}\r\n\r\n`,
    options.body,
    `\r\n--${boundary}--\r\n`,
  ]);
  return { boundary, blob };
}

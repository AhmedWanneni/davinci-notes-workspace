import {
  buildMultipartBlob,
  defaultHttp,
  DriveApiError,
  type ChangesResponse,
  type ContentUpload,
  type DriveChange,
  type DriveClientOptions,
  type DriveFile,
  type DriveHttp,
  type FileListResponse,
} from "./driveApiTypes";

import {
  uploadContentHelper,
  uploadContentBatchHelper,
} from "./driveContentUpload";

export {
  DriveApiError,
  type ContentUpload,
  type DriveChange,
  type DriveClientOptions,
  type DriveFile,
  type DriveHttp,
};

export class DriveClient {
  private readonly http: DriveHttp;
  private readonly baseUrl: string;
  private readonly uploadBaseUrl: string;

  constructor(private readonly options: DriveClientOptions) {
    this.http = options.http ?? defaultHttp;
    this.baseUrl = options.baseUrl ?? "https://www.googleapis.com/drive/v3";
    this.uploadBaseUrl =
      options.uploadBaseUrl ??
      (options.baseUrl
        ? `${options.baseUrl}/upload`
        : "https://www.googleapis.com/upload/drive/v3");
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    baseUrl: string = this.baseUrl,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.options.accessToken}`);
    const response = await this.http.request(`${baseUrl}${path}`, {
      ...init,
      headers,
    });
    if (!response.ok)
      throw new DriveApiError(response.status, await response.text());
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  }

  async listFiles(options: {
    query?: string;
    spaces?: string;
    fields?: string;
  } = {}): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken = "";
    do {
      const params = new URLSearchParams({
        fields:
          options.fields ??
          "nextPageToken,files(id,name,size,mimeType,appProperties,trashed)",
        q: options.query ?? "trashed = false",
      });
      if (options.spaces) params.set("spaces", options.spaces);
      if (pageToken) params.set("pageToken", pageToken);
      const page = await this.request<FileListResponse>(`/files?${params}`);
      files.push(...(page.files ?? []));
      pageToken = page.nextPageToken ?? "";
    } while (pageToken);
    return files;
  }

  async listAppDataFiles(query = "trashed = false"): Promise<DriveFile[]> {
    return this.listFiles({ query, spaces: "appDataFolder" });
  }

  async createFile(metadata: {
    name: string;
    mimeType?: string;
    parents?: string[];
    appProperties?: Record<string, string>;
  }): Promise<DriveFile> {
    return this.request<DriveFile>("/files", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(metadata),
    });
  }

  async uploadFileMultipart(options: {
    name: string;
    body: Blob;
    parents?: string[];
    mimeType?: string;
    appProperties?: Record<string, string>;
  }): Promise<DriveFile> {
    const { boundary, blob } = buildMultipartBlob(options);
    const params = new URLSearchParams({
      uploadType: "multipart",
      fields: "id,name,size,mimeType,appProperties",
    });
    return this.request<DriveFile>(
      `/files?${params}`,
      {
        method: "POST",
        headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
        body: blob,
      },
      this.uploadBaseUrl,
    );
  }

  async uploadFileMedia(
    fileId: string,
    body: Blob,
    appProperties?: Record<string, string>,
  ): Promise<DriveFile> {
    const params = new URLSearchParams({
      uploadType: "media",
      fields: "id,name,size,mimeType,appProperties",
    });
    const updated = await this.request<DriveFile>(
      `/files/${encodeURIComponent(fileId)}?${params}`,
      {
        method: "PATCH",
        headers: { "Content-Type": body.type || "application/octet-stream" },
        body,
      },
      this.uploadBaseUrl,
    );
    if (appProperties && Object.keys(appProperties).length > 0) {
      await this.request(`/files/${encodeURIComponent(fileId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ appProperties }),
      });
    }
    return updated;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.request(`/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
    });
  }

  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    const headers = new Headers({ Accept: "application/octet-stream" });
    headers.set("Authorization", `Bearer ${this.options.accessToken}`);
    const response = await this.http.request(
      `${this.baseUrl}/files/${encodeURIComponent(fileId)}?alt=media`,
      { headers },
    );
    if (!response.ok)
      throw new DriveApiError(response.status, await response.text());
    return response.arrayBuffer();
  }

  async getStartPageToken(): Promise<string> {
    const params = new URLSearchParams({ spaces: "appDataFolder" });
    const result = await this.request<{ startPageToken: string }>(
      `/changes/startPageToken?${params}`,
    );
    return result.startPageToken;
  }

  async listChanges(
    startPageToken: string,
  ): Promise<{ changes: DriveChange[]; nextPageToken: string }> {
    const changes: DriveChange[] = [];
    let pageToken = startPageToken;
    let newStartPageToken = startPageToken;
    do {
      const params = new URLSearchParams({
        pageToken,
        spaces: "appDataFolder",
        includeRemoved: "true",
        fields:
          "nextPageToken,newStartPageToken,changes(fileId,removed,file(id,name,size,mimeType,appProperties,trashed))",
      });
      const page = await this.request<ChangesResponse>(`/changes?${params}`);
      changes.push(...(page.changes ?? []));
      newStartPageToken = page.newStartPageToken ?? newStartPageToken;
      pageToken = page.nextPageToken ?? "";
    } while (pageToken);
    return { changes, nextPageToken: newStartPageToken };
  }

  async findByName(name: string): Promise<DriveFile | undefined> {
    const escaped = name.replaceAll("'", "\\'");
    return (
      await this.listAppDataFiles(`name = '${escaped}' and trashed = false`)
    )[0];
  }

  async findByContentHash(hash: string): Promise<DriveFile | undefined> {
    const escaped = hash.replaceAll("'", "\\'");
    return (
      await this.listAppDataFiles(
        `appProperties has { key = 'contentHash' and value = '${escaped}' } and trashed = false`,
      )
    )[0];
  }

  async uploadAppData(
    name: string,
    body: Blob,
    appProperties: Record<string, string> = {},
    fileId?: string,
  ): Promise<DriveFile> {
    if (fileId) {
      return this.uploadFileMedia(fileId, body, appProperties);
    }
    return this.uploadFileMultipart({
      name,
      body,
      parents: ["appDataFolder"],
      appProperties,
    });
  }

  async uploadContent(
    item: ContentUpload,
  ): Promise<{ file: DriveFile; uploaded: boolean }> {
    return uploadContentHelper(this, item);
  }

  async uploadContentBatch(
    items: readonly ContentUpload[],
    batchSize = 8,
  ): Promise<DriveFile[]> {
    return uploadContentBatchHelper(this, items, batchSize);
  }
}

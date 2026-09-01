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
}

interface FileListResponse {
  files?: DriveFile[];
  nextPageToken?: string;
}
interface ChangesResponse {
  changes?: DriveChange[];
  nextPageToken?: string;
  newStartPageToken?: string;
}
export interface ContentUpload {
  name: string;
  hash: string;
  body: Blob;
}

const defaultHttp: DriveHttp = { request: (input, init) => fetch(input, init) };

export class DriveApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export class DriveClient {
  private readonly http: DriveHttp;
  private readonly baseUrl: string;

  constructor(private readonly options: DriveClientOptions) {
    this.http = options.http ?? defaultHttp;
    this.baseUrl = options.baseUrl ?? "https://www.googleapis.com/drive/v3";
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.options.accessToken}`);
    const response = await this.http.request(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });
    if (!response.ok)
      throw new DriveApiError(response.status, await response.text());
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  }

  async listAppDataFiles(query = "trashed = false"): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken = "";
    do {
      const params = new URLSearchParams({
        spaces: "appDataFolder",
        fields:
          "nextPageToken,files(id,name,size,mimeType,appProperties,trashed)",
        q: query,
      });
      if (pageToken) params.set("pageToken", pageToken);
      const page = await this.request<FileListResponse>(`/files?${params}`);
      files.push(...(page.files ?? []));
      pageToken = page.nextPageToken ?? "";
    } while (pageToken);
    return files;
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
      const params = new URLSearchParams({
        uploadType: "media",
        fields: "id,name,size,mimeType,appProperties",
      });
      return this.request<DriveFile>(
        `/files/${encodeURIComponent(fileId)}?${params}`,
        {
          method: "PATCH",
          headers: { "Content-Type": body.type || "application/octet-stream" },
          body,
        },
      );
    }
    const boundary = `davinci-${crypto.randomUUID()}`;
    const metadata = JSON.stringify({
      name,
      parents: ["appDataFolder"],
      appProperties,
    });
    const multipart = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${body.type || "application/octet-stream"}\r\n\r\n`,
      body,
      `\r\n--${boundary}--`,
    ]);
    const params = new URLSearchParams({
      uploadType: "multipart",
      fields: "id,name,size,mimeType,appProperties",
    });
    return this.request<DriveFile>(`/files?${params}`, {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body: multipart,
    });
  }

  async uploadContent(
    item: ContentUpload,
  ): Promise<{ file: DriveFile; uploaded: boolean }> {
    const existing = await this.findByContentHash(item.hash);
    if (existing) return { file: existing, uploaded: false };
    return {
      file: await this.uploadAppData(`content/${item.hash}`, item.body, {
        contentHash: item.hash,
      }),
      uploaded: true,
    };
  }

  async uploadContentBatch(
    items: readonly ContentUpload[],
    batchSize = 8,
  ): Promise<DriveFile[]> {
    const uploaded: DriveFile[] = [];
    for (let index = 0; index < items.length; index += batchSize) {
      const batch = items.slice(index, index + batchSize);
      const results = await Promise.all(
        batch.map((item) => this.uploadContent(item)),
      );
      uploaded.push(...results.map((result) => result.file));
    }
    return uploaded;
  }
}

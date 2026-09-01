import type { ManifestSnapshot } from "./manifest";
import type { DriveClient, DriveFile } from "./driveApi";

const MANIFEST_PREFIX = "manifests/";

export class DriveManifestStore {
  private readonly name: string;

  constructor(
    private readonly drive: DriveClient,
    deviceId: string,
  ) {
    this.name = `${MANIFEST_PREFIX}${deviceId}.json`;
  }

  async load(): Promise<ManifestSnapshot | undefined> {
    const file = await this.drive.findByName(this.name);
    if (!file) return undefined;
    const body = await this.drive.downloadFile(file.id);
    return JSON.parse(new TextDecoder().decode(body)) as ManifestSnapshot;
  }

  async save(snapshot: ManifestSnapshot): Promise<DriveFile> {
    const existing = await this.drive.findByName(this.name);
    const body = new Blob([JSON.stringify(snapshot)], {
      type: "application/json",
    });
    return this.drive.uploadAppData(
      this.name,
      body,
      { kind: "manifest" },
      existing?.id,
    );
  }
}

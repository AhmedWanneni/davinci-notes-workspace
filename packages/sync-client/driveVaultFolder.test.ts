import { describe, expect, it, vi } from "vitest";
import { DriveClient } from "./driveApi";
import {
  ensureDriveFolderPath,
  ensureDriveVaultFolder,
  getDriveMimeType,
  listDriveVaultFiles,
  syncFileToDriveVault,
} from "./driveVaultFolder";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("driveVaultFolder", () => {
  it("determines correct MIME types for notes and attachments", () => {
    expect(getDriveMimeType("Note.md")).toBe("text/markdown");
    expect(getDriveMimeType("photo.png")).toBe("image/png");
    expect(getDriveMimeType("board.canvas")).toBe("application/json");
    expect(getDriveMimeType("doc.pdf")).toBe("application/pdf");
    expect(getDriveMimeType("unknown.xyz")).toBe("application/octet-stream");
  });

  it("finds or creates the root vault folder in Google Drive", async () => {
    let created = false;
    const client = new DriveClient({
      accessToken: "token",
      http: {
        request: async (input, init) => {
          const url = String(input);
          if (url.includes("/files?") && init?.method !== "POST") {
            // First search returns empty, so it triggers creation
            return created
              ? response({ files: [{ id: "vault-1", name: "MyVault" }] })
              : response({ files: [] });
          }
          if (url.endsWith("/files") && init?.method === "POST") {
            created = true;
            return response({ id: "vault-1", name: "MyVault" });
          }
          return response({});
        },
      },
    });

    const folder = await ensureDriveVaultFolder(client, "MyVault");
    expect(folder.id).toBe("vault-1");
    expect(folder.name).toBe("MyVault");
  });

  it("ensures nested folder paths in Google Drive", async () => {
    const createdFolders: string[] = [];
    const client = new DriveClient({
      accessToken: "token",
      http: {
        request: async (input, init) => {
          if (init?.method === "POST") {
            const body = JSON.parse(String(init.body)) as { name: string };
            createdFolders.push(body.name);
            return response({ id: `id-${body.name}`, name: body.name });
          }
          return response({ files: [] });
        },
      },
    });

    const leafId = await ensureDriveFolderPath(client, "attachments/2026", "root-id");
    expect(leafId).toBe("id-2026");
    expect(createdFolders).toEqual(["attachments", "2026"]);
  });

  it("syncs file with matching content hash without re-uploading", async () => {
    const client = new DriveClient({
      accessToken: "token",
      http: {
        request: async () =>
          response({
            files: [
              {
                id: "file-99",
                name: "Welcome.md",
                appProperties: { contentHash: "hash-123" },
              },
            ],
          }),
      },
    });

    const result = await syncFileToDriveVault(
      client,
      "vault-id",
      "Welcome.md",
      new Blob(["# Hello"]),
      "hash-123",
    );
    expect(result.id).toBe("file-99");
  });

  it("lists drive vault files and handles multipart upload for new files", async () => {
    let capturedQuery = "";
    let capturedBody: unknown = null;
    const client = new DriveClient({
      accessToken: "token",
      http: {
        request: async (input, init) => {
          const url = String(input);
          if (init?.method === "POST") {
            capturedBody = init.body;
            return response({ id: "new-file-id", name: "Doc2.md" });
          }
          if (url.includes("/files?")) {
            capturedQuery = url;
            if (url.includes("Doc2.md")) {
              return response({ files: [] });
            }
            return response({ files: [{ id: "f-1", name: "Doc.md" }] });
          }
          return response({});
        },
      },
    });

    const files = await listDriveVaultFiles(client, "vault-root-id");
    expect(capturedQuery).toContain("davinciVault");
    expect(files).toHaveLength(1);

    const uploaded = await syncFileToDriveVault(
      client,
      "vault-root-id",
      "Doc2.md",
      new Blob(["# New Note"]),
      "new-hash",
    );
    expect(uploaded.id).toBe("new-file-id");
    expect(capturedBody).toBeInstanceOf(Blob);
  });
});

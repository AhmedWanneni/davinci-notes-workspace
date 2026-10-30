import { describe, expect, it } from "vitest";
import { DriveClient } from "./driveApi";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Drive app-data API", () => {
  it("uses appDataFolder for manifest listing and changes", async () => {
    const urls: string[] = [];
    const client = new DriveClient({
      accessToken: "token",
      baseUrl: "https://drive.test",
      http: {
        request: async (input) => {
          urls.push(String(input));
          return urls.length === 1
            ? response({
                files: [{ id: "manifest", name: "manifests/device.json" }],
              })
            : response({ changes: [], newStartPageToken: "next" });
        },
      },
    });
    await client.listAppDataFiles();
    await client.listChanges("start");
    expect(urls[0]).toContain("spaces=appDataFolder");
    expect(urls[1]).toContain("spaces=appDataFolder");
    expect(urls[1]).toContain("pageToken=start");
  });

  it("routes multipart and media uploads to the Google Drive upload endpoint", async () => {
    const urls: string[] = [];
    const headersList: Headers[] = [];
    const client = new DriveClient({
      accessToken: "token",
      http: {
        request: async (input, init) => {
          urls.push(String(input));
          headersList.push(new Headers(init?.headers));
          return response({ id: "file-123", name: "test.json" });
        },
      },
    });

    await client.uploadAppData("test.json", new Blob(["hello"]));
    expect(urls[0]).toMatch(/^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\?uploadType=multipart/);
    expect(headersList[0].get("Content-Type")).toContain("multipart/related; boundary=davinci-");

    await client.uploadAppData("test.json", new Blob(["updated"]), {}, "file-123");
    expect(urls[1]).toMatch(/^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\/file-123\?uploadType=media/);
  });
});

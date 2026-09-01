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
});

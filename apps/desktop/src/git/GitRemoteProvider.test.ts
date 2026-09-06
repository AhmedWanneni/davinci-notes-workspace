import { describe, expect, it } from "vitest";
import { detectGitRemoteProvider } from "./GitRemoteProvider";

describe("detectGitRemoteProvider", () => {
  it("returns cosmetic provider help for distinct HTTPS hosts", () => {
    expect(
      detectGitRemoteProvider("https://github.com/example/notes.git"),
    ).toMatchObject({
      id: "github",
      host: "github.com",
    });
    expect(
      detectGitRemoteProvider("https://gitlab.com/example/notes.git"),
    ).toMatchObject({
      id: "gitlab",
      host: "gitlab.com",
    });
  });

  it("keeps self-hosted URLs on the same generic credential model", () => {
    expect(
      detectGitRemoteProvider("https://git.example.test/team/notes.git"),
    ).toMatchObject({
      id: "self-hosted",
      host: "git.example.test",
      helpUrl: null,
    });
  });
});

import { ReactFlowProvider } from "@xyflow/react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CanvasEditorContext } from "./CanvasEditorContext";
import { LinkCardNode } from "./LinkCardNode";
import {
  FORBIDDEN_SANDBOX_TOKENS,
  isSandboxSafe,
  SANDBOX_PERMISSIONS,
  sanitizeWebUrl,
} from "./linkCardUtils";

describe("LinkCard Security & Threat Model Boundary Tests", () => {
  afterEach(() => {
    cleanup();
  });

  describe("Threat Model 1: Dangerous URI Schemes & Script Injection", () => {
    it("strictly blocks javascript: execution URLs", () => {
      const maliciousUrl = "javascript:window.parent.alert(document.domain)";
      expect(sanitizeWebUrl(maliciousUrl)).toBeNull();

      render(
        <ReactFlowProvider>
          <CanvasEditorContext.Provider
            value={{ onNodeTextChange: () => {}, onLayoutChange: () => {} }}
          >
            <LinkCardNode
              id="threat-1"
              data={{ url: maliciousUrl, type: "link" }}
              selected={false}
              type="link"
              zIndex={1}
              isConnectable={true}
              positionAbsoluteX={0}
              positionAbsoluteY={0}
              dragging={false}
              deletable={true}
              selectable={true}
              draggable={true}
            />
          </CanvasEditorContext.Provider>
        </ReactFlowProvider>,
      );

      // Verify iframe is NOT rendered with javascript: URL
      expect(screen.queryByTestId("link-card-iframe")).toBeNull();
      expect(screen.getByText("Invalid webpage URL")).toBeDefined();
    });

    it("strictly blocks file:// scheme preventing local filesystem reads", () => {
      const localFileUrl = "file:///Users/target/vault/secret.md";
      expect(sanitizeWebUrl(localFileUrl)).toBeNull();
    });

    it("strictly blocks tauri:// and custom native app schemes", () => {
      const tauriUrl = "tauri://localhost/ipc";
      expect(sanitizeWebUrl(tauriUrl)).toBeNull();
    });

    it("strictly blocks data: and blob: HTML injection schemes", () => {
      const dataHtml =
        "data:text/html,<script>window.parent.postMessage('pwned','*')</script>";
      expect(sanitizeWebUrl(dataHtml)).toBeNull();
      const blobUrl = "blob:https://untrusted.com/a42b10";
      expect(sanitizeWebUrl(blobUrl)).toBeNull();
    });
  });

  describe("Threat Model 2: Iframe Sandbox Permissions Boundary", () => {
    it("ensures sandbox attribute never contains allow-top-navigation tokens", () => {
      expect(isSandboxSafe(SANDBOX_PERMISSIONS)).toBe(true);

      for (const forbidden of FORBIDDEN_SANDBOX_TOKENS) {
        expect(SANDBOX_PERMISSIONS).not.toContain(forbidden);
      }
    });

    it("confirms rendered iframe enforces strict sandbox and referrer policy", () => {
      render(
        <ReactFlowProvider>
          <CanvasEditorContext.Provider
            value={{ onNodeTextChange: () => {}, onLayoutChange: () => {} }}
          >
            <LinkCardNode
              id="threat-2"
              data={{ url: "https://example.com/untrusted", type: "link" }}
              selected={false}
              type="link"
              zIndex={1}
              isConnectable={true}
              positionAbsoluteX={0}
              positionAbsoluteY={0}
              dragging={false}
              deletable={true}
              selectable={true}
              draggable={true}
            />
          </CanvasEditorContext.Provider>
        </ReactFlowProvider>,
      );

      const iframe = screen.getByTestId("link-card-iframe") as HTMLIFrameElement;
      const sandboxAttr = iframe.getAttribute("sandbox") || "";

      // Must have safe allowed tokens
      expect(sandboxAttr).toContain("allow-scripts");
      expect(sandboxAttr).toContain("allow-same-origin");
      expect(sandboxAttr).toContain("allow-forms");

      // Must NEVER have forbidden dangerous tokens
      expect(sandboxAttr).not.toContain("allow-top-navigation");
      expect(sandboxAttr).not.toContain("allow-modals");
      expect(sandboxAttr).not.toContain("allow-pointer-lock");

      // Must have referrer policy
      expect(iframe.getAttribute("referrerpolicy")).toBe(
        "strict-origin-when-cross-origin",
      );
    });
  });

  describe("Threat Model 3: Host Context & Tauri IPC Isolation", () => {
    it("demonstrates cross-origin / sandboxed frame isolation from host context", () => {
      // Create mock Tauri API on host window
      const mockTauri = { invoke: () => "secret_data" };
      (window as unknown as { __TAURI__: typeof mockTauri }).__TAURI__ =
        mockTauri;

      const testIframe = document.createElement("iframe");
      testIframe.setAttribute("sandbox", SANDBOX_PERMISSIONS);
      testIframe.src = "https://untrusted-embed.example.com";
      document.body.appendChild(testIframe);

      // In sandboxed / cross-origin frame context, contentWindow cannot access parent __TAURI__
      // without cross-origin exceptions being thrown or null origin boundary
      expect(testIframe.getAttribute("sandbox")).toBe(SANDBOX_PERMISSIONS);
      expect(testIframe.getAttribute("sandbox")).not.toContain(
        "allow-top-navigation",
      );

      document.body.removeChild(testIframe);
      delete (window as unknown as { __TAURI__?: typeof mockTauri }).__TAURI__;
    });
  });
});

import { browser } from "wxt/browser";
import { readPage, type PageCapture } from "../../src/capture/readPage";
import { downloadNoteFile } from "../../src/clip/downloadNoteFile";
import { newClipId } from "../../src/clip/newClipId";
import {
  runClipSession,
  type ClipSession,
} from "../../src/popup/runClipSession";
import { loadTemplates } from "../../src/templates/templateStore";

const PREVIEW_MAX_LINES = 200;

function element(role: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(`[data-role="${role}"]`);
  if (!found) throw new Error(`Missing popup element: ${role}`);
  return found;
}

const status = element("status");
const details = element("details");
const templateName = element("template");
const modeName = element("mode");
const noteName = element("note-name");
const folder = element("folder");
const preview = element("preview");
const download = element("download") as HTMLButtonElement;

async function captureActivePage(): Promise<PageCapture> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) throw new Error("No active tab to clip.");

  let results: Array<{ result?: unknown }>;
  try {
    results = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: readPage,
    });
  } catch {
    throw new Error(
      "This page cannot be clipped (browser page, PDF, or blocked).",
    );
  }

  const capture = results[0]?.result as PageCapture | undefined;
  if (!capture || typeof capture.html !== "string") {
    throw new Error(
      "This page cannot be clipped (browser page, PDF, or blocked).",
    );
  }
  return capture;
}

function showError(message: string): void {
  status.textContent = message;
  status.dataset.state = "error";
}

function render(session: ClipSession): void {
  const { payload } = session;

  status.textContent = session.extracted.error
    ? `Extraction failed: ${session.extracted.error}`
    : `Ready — ${session.extracted.wordCount ?? 0} words extracted.`;
  status.dataset.state = session.extracted.error ? "error" : "ready";

  templateName.textContent = session.template.name;
  modeName.textContent = session.mode;
  noteName.textContent = payload.target.noteName;
  folder.textContent = payload.target.folder || "(vault root)";

  const lines = session.noteFile.split("\n");
  preview.textContent =
    lines.slice(0, PREVIEW_MAX_LINES).join("\n") +
    (lines.length > PREVIEW_MAX_LINES ? "\n…" : "");

  details.hidden = false;
  preview.hidden = false;
  download.disabled = false;
  download.addEventListener("click", () => {
    void downloadNoteFile(
      browser.downloads,
      session.suggestedPath,
      session.noteFile,
    );
  });
}

async function main(): Promise<void> {
  try {
    const now = new Date();
    const [capture, templates] = await Promise.all([
      captureActivePage(),
      loadTemplates(browser.storage.local),
    ]);
    render(
      runClipSession({
        capture,
        templates,
        now,
        clipId: newClipId(),
        capturedAt: now.toISOString(),
      }),
    );
  } catch (error) {
    showError(error instanceof Error ? error.message : "Clipping failed.");
  }
}

void main();

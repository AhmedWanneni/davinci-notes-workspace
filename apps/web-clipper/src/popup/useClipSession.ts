import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  composeNoteFile,
  suggestedFilePath,
  type ClipMode,
} from "@app/clipper-core";
import type { ClipPopupController, ClipStatus } from "../components/ClipPopup";
import { applyClipEdits } from "../clip/applyClipEdits";
import {
  buildClipDraft,
  EMPTY_CLIP_DRAFT,
  type ClipDraft,
} from "../clip/clipDraft";
import { prepareClipContext } from "../clip/prepareClipContext";
import { renderClipPayload } from "../clip/renderClipPayload";
import { fallbackTemplate } from "../templates/templateStore";
import {
  defaultClipSessionDeps,
  type ClipSessionDeps,
} from "./clipSessionDeps";
import {
  createHighlightRecord,
  loadClipPage,
  type LoadedClipPage,
} from "./loadClipPage";
import { useClipEdits } from "./useClipEdits";
import { useClipQueueSync } from "./useClipQueueSync";

/**
 * Drive one clip session for the popup.
 */
export function useClipSession(
  deps: ClipSessionDeps = defaultClipSessionDeps,
): ClipPopupController {
  const [status, setStatus] = useState<ClipStatus>("loading");
  const [error, setError] = useState<string>();
  const [page, setPage] = useState<LoadedClipPage>();
  const [mode, setMode] = useState<ClipMode>("full");
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [paired, setPaired] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [sentPath, setSentPath] = useState<string>();

  const depsRef = useRef(deps);
  depsRef.current = deps;

  const editsState = useClipEdits();
  const queueSync = useClipQueueSync(depsRef, setSaveError);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [initial, count] = await Promise.all([
          loadClipPage(depsRef.current),
          depsRef.current.loadQueueCount?.() ?? Promise.resolve(0),
        ]);
        if (cancelled) return;
        setPage(initial.page);
        setMode(initial.mode);
        setPaired(initial.paired);
        queueSync.setQueuedCount(count);
        setStatus("ready");
      } catch (cause) {
        if (cancelled) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "This page could not be read.",
        );
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const templateId =
    editsState.chosenTemplateId ??
    page?.matchedTemplateId ??
    page?.templates[0]?.id ??
    "";

  const context = useMemo(
    () =>
      page === undefined
        ? undefined
        : prepareClipContext({
            capture: page.capture,
            doc: page.doc,
            mode,
            now: page.now,
            highlights: page.highlights.map((h) => h.text),
          }),
    [page, mode],
  );

  const built = useMemo(() => {
    if (context === undefined || page === undefined) return undefined;
    const template =
      page.templates.find((c) => c.id === templateId) ?? fallbackTemplate();
    return renderClipPayload(context, template, {
      clipId: page.clipId,
      capturedAt: page.capturedAt,
    });
  }, [context, page, templateId]);

  const payload = useMemo(
    () =>
      built === undefined
        ? undefined
        : applyClipEdits(built.payload, editsState.edits),
    [built, editsState.edits],
  );

  const draft = useMemo<ClipDraft>(
    () =>
      built === undefined
        ? EMPTY_CLIP_DRAFT
        : buildClipDraft(built.payload, editsState.edits),
    [built, editsState.edits],
  );

  const disabledModes = useMemo<readonly ClipMode[]>(() => {
    const disabled: ClipMode[] = [];
    if (!page?.highlights.length) disabled.push("highlights");
    if (!(page?.capture.selection ?? "").trim()) disabled.push("selection");
    return disabled;
  }, [page]);

  const canHighlightSelection =
    (page?.capture.selection ?? "").trim().length > 0;

  const highlightSelection = useCallback(() => {
    if (!page || !canHighlightSelection) return;
    const text = (page.capture.selection ?? "").trim();
    const record = createHighlightRecord(
      page.capture.url,
      text,
      depsRef.current.newClipId,
      depsRef.current.now,
    );
    void (async () => {
      try {
        await depsRef.current.saveHighlight?.(record);
        await depsRef.current.notifyHighlightsUpdated?.(page.capture.url);
        setPage((curr) =>
          curr
            ? { ...curr, highlights: [...curr.highlights, record] }
            : undefined,
        );
      } catch {
        // best-effort from popup
      }
    })();
  }, [page, canHighlightSelection]);

  const download = useCallback(() => {
    if (payload === undefined) return;
    const path = suggestedFilePath(payload);
    const file = composeNoteFile(payload);
    setDownloading(true);
    setSaveError(undefined);
    void (async () => {
      try {
        await depsRef.current.saveNoteFile(path, file);
      } catch (cause) {
        setSaveError(
          cause instanceof Error
            ? cause.message
            : "The note could not be saved.",
        );
      } finally {
        setDownloading(false);
      }
    })();
  }, [payload]);

  const send = useCallback(() => {
    if (payload === undefined) return;
    const clip = payload;
    setSending(true);
    setSaveError(undefined);
    setSentPath(undefined);

    void (async () => {
      try {
        const delivery = await depsRef.current.sendClip(clip);
        if (delivery.delivered) {
          setSentPath(delivery.path ?? "");
        } else {
          await queueSync.handleDeliveryQueueing(clip, delivery.reason);
        }
      } catch (cause) {
        setSaveError(
          cause instanceof Error
            ? cause.message
            : "The clip could not be sent.",
        );
      } finally {
        setSending(false);
      }
    })();
  }, [payload, queueSync]);

  return {
    status,
    error: error ?? saveError,
    warning: built?.extracted.error
      ? "The article could not be extracted, so the note contains only the page metadata."
      : undefined,
    mode,
    templates: page?.templates ?? [],
    templateId,
    matchedTemplateId: page?.matchedTemplateId,
    disabledModes,
    payload,
    draft,
    paired,
    sending,
    downloading,
    sent: sentPath !== undefined,
    sentPath: sentPath === "" ? undefined : sentPath,
    queuedCount: queueSync.queuedCount,
    syncingQueue: queueSync.syncingQueue,
    syncQueue: queueSync.syncQueue,
    canHighlightSelection,
    highlightsCount: page?.highlights.length ?? 0,
    highlightSelection,
    setMode,
    setTemplateId: editsState.setTemplateId,
    setNoteName: editsState.setNoteName,
    setFolder: editsState.setFolder,
    setProperty: editsState.setProperty,
    send,
    download,
    openOptions: () => depsRef.current.openOptionsPage(),
  };
}

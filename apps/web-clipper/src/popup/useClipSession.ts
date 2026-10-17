import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  composeNoteFile,
  suggestedFilePath,
  type ClipMode,
} from "@app/clipper-core";
import type { ClipPopupController, ClipStatus } from "../components/ClipPopup";
import { applyClipEdits, type ClipEdits } from "../clip/applyClipEdits";
import {
  buildClipDraft,
  EMPTY_CLIP_DRAFT,
  type ClipDraft,
} from "../clip/clipDraft";
import { prepareClipContext } from "../clip/prepareClipContext";
import { renderClipPayload } from "../clip/renderClipPayload";
import { fallbackTemplate } from "../templates/templateStore";
import { describeDeliveryFailure } from "../transport/describeDeliveryFailure";
import {
  defaultClipSessionDeps,
  type ClipSessionDeps,
} from "./clipSessionDeps";
import {
  createHighlightRecord,
  loadClipPage,
  type LoadedClipPage,
} from "./loadClipPage";

/**
 * Drive one clip session for the popup.
 *
 * The page is read exactly once when the popup opens. Changing the mode re-prepares
 * the context, because the source content differs; changing the template or typing
 * in a field only re-renders.
 */
export function useClipSession(
  deps: ClipSessionDeps = defaultClipSessionDeps,
): ClipPopupController {
  const [status, setStatus] = useState<ClipStatus>("loading");
  const [error, setError] = useState<string>();
  const [page, setPage] = useState<LoadedClipPage>();
  const [mode, setMode] = useState<ClipMode>("full");
  const [chosenTemplateId, setChosenTemplateId] = useState<string>();
  const [edits, setEdits] = useState<ClipEdits>({});
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [paired, setPaired] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [sentPath, setSentPath] = useState<string>();

  const depsRef = useRef(deps);
  depsRef.current = deps;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const initial = await loadClipPage(depsRef.current);
        if (cancelled) return;
        setPage(initial.page);
        setMode(initial.mode);
        setPaired(initial.paired);
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
    chosenTemplateId ?? page?.matchedTemplateId ?? page?.templates[0]?.id ?? "";

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
      page.templates.find((candidate) => candidate.id === templateId) ??
      fallbackTemplate();
    return renderClipPayload(context, template, {
      clipId: page.clipId,
      capturedAt: page.capturedAt,
    });
  }, [context, page, templateId]);

  const payload = useMemo(
    () =>
      built === undefined ? undefined : applyClipEdits(built.payload, edits),
    [built, edits],
  );

  const draft = useMemo<ClipDraft>(
    () =>
      built === undefined
        ? EMPTY_CLIP_DRAFT
        : buildClipDraft(built.payload, edits),
    [built, edits],
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

  const setTemplateId = useCallback((id: string) => {
    setEdits({});
    setChosenTemplateId(id);
  }, []);

  const setNoteName = useCallback((noteName: string) => {
    setEdits((curr) => ({ ...curr, noteName }));
  }, []);

  const setFolder = useCallback((folder: string) => {
    setEdits((curr) => ({ ...curr, folder }));
  }, []);

  const setProperty = useCallback((name: string, value: string) => {
    setEdits((curr) => ({
      ...curr,
      properties: { ...curr.properties, [name]: value },
    }));
  }, []);

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
        if (delivery.delivered) setSentPath(delivery.path ?? "");
        else setSaveError(describeDeliveryFailure(delivery.reason));
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
  }, [payload]);

  const openOptions = useCallback(() => {
    depsRef.current.openOptionsPage();
  }, []);

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
    canHighlightSelection,
    highlightsCount: page?.highlights.length ?? 0,
    highlightSelection,
    setMode,
    setTemplateId,
    setNoteName,
    setFolder,
    setProperty,
    send,
    download,
    openOptions,
  };
}

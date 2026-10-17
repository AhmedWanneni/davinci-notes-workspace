import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  composeNoteFile,
  suggestedFilePath,
  type ClipMode,
  type ClipTemplate,
} from "@app/clipper-core";
import type { PageCapture } from "../capture/readPage";
import type { ClipPopupController, ClipStatus } from "../components/ClipPopup";
import { applyClipEdits, type ClipEdits } from "../clip/applyClipEdits";
import {
  buildClipDraft,
  EMPTY_CLIP_DRAFT,
  type ClipDraft,
} from "../clip/clipDraft";
import { defaultClipMode } from "../clip/defaultClipMode";
import { prepareClipContext } from "../clip/prepareClipContext";
import { renderClipPayload } from "../clip/renderClipPayload";
import { parsePageHtml } from "../page/parsePageHtml";
import { schemaTypesOf } from "../page/schemaTypes";
import { matchTemplate } from "../templates/matchTemplate";
import { fallbackTemplate } from "../templates/templateStore";
import {
  defaultClipSessionDeps,
  type ClipSessionDeps,
} from "./clipSessionDeps";

/** The page, read once, plus everything derived from it that is template-independent. */
interface LoadedPage {
  capture: PageCapture;
  doc: Document;
  templates: readonly ClipTemplate[];
  matchedTemplateId?: string;
  clipId: string;
  capturedAt: string;
  now: Date;
}

/**
 * Drive one clip session for the popup.
 *
 * The page is read exactly once when the popup opens (there is no content script
 * and no re-read). Changing the mode re-prepares the context, because the source
 * content differs; changing the template or typing in a field only re-renders,
 * which is why preparation and rendering are separate steps.
 */
export function useClipSession(
  deps: ClipSessionDeps = defaultClipSessionDeps,
): ClipPopupController {
  const [status, setStatus] = useState<ClipStatus>("loading");
  const [error, setError] = useState<string>();
  const [page, setPage] = useState<LoadedPage>();
  const [mode, setMode] = useState<ClipMode>("full");
  const [chosenTemplateId, setChosenTemplateId] = useState<string>();
  const [edits, setEdits] = useState<ClipEdits>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  // Read through a ref and run once: a re-created `deps` object must not trigger a
  // second page read, and the popup is a fresh document on every open.
  const depsRef = useRef(deps);
  depsRef.current = deps;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { loadTemplates, readCapture, newClipId, now } = depsRef.current;
        const [stored, capture] = await Promise.all([
          loadTemplates(),
          readCapture(),
        ]);
        if (cancelled) return;

        const templates = stored.length > 0 ? stored : [fallbackTemplate()];
        const doc = parsePageHtml(capture.html, capture.url);
        const matched = matchTemplate(templates, {
          url: capture.url,
          schemaTypes: schemaTypesOf(doc),
        });
        const moment = now();

        setPage({
          capture,
          doc,
          templates,
          matchedTemplateId: matched?.id,
          clipId: newClipId(),
          capturedAt: moment.toISOString(),
          now: moment,
        });
        setMode(defaultClipMode(capture));
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

  /** The fields show raw typing; `payload` above is what those edits sanitise to. */
  const draft = useMemo<ClipDraft>(
    () =>
      built === undefined
        ? EMPTY_CLIP_DRAFT
        : buildClipDraft(built.payload, edits),
    [built, edits],
  );

  const disabledModes = useMemo<readonly ClipMode[]>(() => {
    // There is no highlighter until the highlights phase, so that mode has no
    // source yet. It stays listed so the option is not silently missing.
    const disabled: ClipMode[] = ["highlights"];
    if ((page?.capture.selection ?? "").trim().length === 0) {
      disabled.push("selection");
    }
    return disabled;
  }, [page]);

  const setTemplateId = useCallback((id: string) => {
    // A hand-edited name or folder belongs to the template that produced it.
    setEdits({});
    setChosenTemplateId(id);
  }, []);

  const setNoteName = useCallback((noteName: string) => {
    setEdits((current) => ({ ...current, noteName }));
  }, []);

  const setFolder = useCallback((folder: string) => {
    setEdits((current) => ({ ...current, folder }));
  }, []);

  const setProperty = useCallback((name: string, value: string) => {
    setEdits((current) => ({
      ...current,
      properties: { ...current.properties, [name]: value },
    }));
  }, []);

  const download = useCallback(() => {
    if (payload === undefined) return;
    const path = suggestedFilePath(payload);
    const file = composeNoteFile(payload);

    setSaving(true);
    setSaveError(undefined);

    void (async () => {
      try {
        await depsRef.current.saveNote(path, file);
      } catch (cause) {
        setSaveError(
          cause instanceof Error
            ? cause.message
            : "The note could not be saved.",
        );
      } finally {
        setSaving(false);
      }
    })();
  }, [payload]);

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
    saving,
    setMode,
    setTemplateId,
    setNoteName,
    setFolder,
    setProperty,
    download,
  };
}

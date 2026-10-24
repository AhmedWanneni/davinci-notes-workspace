import { useCallback, useState } from "react";
import type { ClipEdits } from "../clip/applyClipEdits";

export interface ClipEditsState {
  chosenTemplateId: string | undefined;
  edits: ClipEdits;
  setTemplateId: (id: string) => void;
  setNoteName: (noteName: string) => void;
  setFolder: (folder: string) => void;
  setProperty: (name: string, value: string) => void;
}

/**
 * Manages user draft edits and template selection for a clip session.
 */
export function useClipEdits(): ClipEditsState {
  const [chosenTemplateId, setChosenTemplateId] = useState<string>();
  const [edits, setEdits] = useState<ClipEdits>({});

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

  return {
    chosenTemplateId,
    edits,
    setTemplateId,
    setNoteName,
    setFolder,
    setProperty,
  };
}

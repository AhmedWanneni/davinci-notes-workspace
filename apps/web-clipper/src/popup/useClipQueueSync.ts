import { useCallback, useState } from "react";
import type { MutableRefObject } from "react";
import type { ClipPayload } from "@app/clipper-core";
import { describeDeliveryFailure } from "../transport/describeDeliveryFailure";
import type { ClipSessionDeps } from "./clipSessionDeps";

export interface ClipQueueSyncState {
  queuedCount: number;
  syncingQueue: boolean;
  setQueuedCount: (count: number) => void;
  syncQueue: () => void;
  handleDeliveryQueueing: (
    payload: ClipPayload,
    reason: string,
  ) => Promise<void>;
}

export function useClipQueueSync(
  depsRef: MutableRefObject<ClipSessionDeps>,
  setSaveError: (error: string | undefined) => void,
): ClipQueueSyncState {
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [syncingQueue, setSyncingQueue] = useState(false);

  const handleDeliveryQueueing = useCallback(
    async (payload: ClipPayload, reason: string) => {
      if (
        reason === "unreachable" ||
        reason === "timeout" ||
        reason === "app-busy"
      ) {
        await depsRef.current.enqueueClip?.(payload);
        const count = (await depsRef.current.loadQueueCount?.()) ?? 1;
        setQueuedCount(count);
      }
      setSaveError(describeDeliveryFailure(reason));
    },
    [depsRef, setSaveError],
  );

  const syncQueue = useCallback(() => {
    setSyncingQueue(true);
    setSaveError(undefined);
    void (async () => {
      try {
        const summary = await depsRef.current.drainQueue?.();
        if (summary) {
          setQueuedCount(summary.remaining);
          if (summary.stoppedReason) {
            setSaveError(describeDeliveryFailure(summary.stoppedReason));
          }
        }
      } catch (cause) {
        setSaveError(
          cause instanceof Error
            ? cause.message
            : "The queue could not be synced.",
        );
      } finally {
        setSyncingQueue(false);
      }
    })();
  }, [depsRef, setSaveError]);

  return {
    queuedCount,
    syncingQueue,
    setQueuedCount,
    syncQueue,
    handleDeliveryQueueing,
  };
}

import type { ClipDeliveryFailure } from "./postClipToDesktop";

/**
 * The popup's one line for each way a clip can fail to reach the app.
 *
 * A total record, so adding a failure reason cannot leave the user with a blank
 * message. The wording says what happened and what to do; it never guesses.
 */
const MESSAGES: Record<ClipDeliveryFailure, string> = {
  "not-paired":
    "This extension is not paired with DaVinci Notes. Open its options and paste the pairing token.",
  unreachable:
    "DaVinci Notes is not running, or the Web Clipper is switched off in its settings. The clip was not sent.",
  timeout: "DaVinci Notes did not answer in time. The clip was not sent.",
  queued:
    "DaVinci Notes could not write the clip now. Saving clips while the app is busy arrives in a later step, so the clip was not sent.",
  unauthorized:
    "DaVinci Notes refused the pairing token. Copy the current token from its Web Clipper settings into the extension options.",
  "too-large": "The note is larger than the 2 MB DaVinci Notes accepts.",
  "invalid-path":
    "DaVinci Notes refused the note name or folder. Change them and try again.",
  "invalid-payload":
    "DaVinci Notes refused the clip. The app and the extension may be different versions.",
  "vault-not-open":
    "No vault is open in DaVinci Notes. Open a vault and clip again.",
  duplicate: "DaVinci Notes already saved this clip.",
  "app-busy": "DaVinci Notes could not write the clip just now. Try again.",
};

export function describeDeliveryFailure(reason: ClipDeliveryFailure): string {
  return MESSAGES[reason];
}

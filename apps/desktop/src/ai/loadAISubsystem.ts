/** Entry point for a future user-triggered AI feature. Keep this module out of App imports. */
export function loadAISubsystem() {
  return import("./AISubsystem");
}

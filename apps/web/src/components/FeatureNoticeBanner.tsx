export type DegradedWebFeature =
  | "local-git"
  | "syncthing"
  | "system-tray"
  | "global-hotkey"
  | "background-reminders";

export interface FeatureNoticeBannerProps {
  readonly feature: DegradedWebFeature;
  readonly onDismiss?: () => void;
}

const FEATURE_MESSAGES: Record<
  DegradedWebFeature,
  { title: string; description: string }
> = {
  "local-git": {
    title: "Local Git is available in the Desktop App",
    description:
      "Browser sandboxes cannot invoke native git binaries or SSH keys. Use Google Drive Sync or Vault Archive Export in the browser.",
  },
  syncthing: {
    title: "Syncthing LAN Sync requires the Desktop App",
    description:
      "Browsers cannot open raw LAN TCP/UDP sockets to a local Syncthing daemon. Use Google Drive Sync in the browser.",
  },
  "system-tray": {
    title: "System Tray is Desktop-only",
    description:
      "Install DaVinci Notes as a Progressive Web App (PWA) for standalone window support.",
  },
  "global-hotkey": {
    title: "OS-Wide Quick Capture requires the Desktop App",
    description:
      "Browser keyboard shortcuts work while this tab is focused.",
  },
  "background-reminders": {
    title: "Reminders fire while the browser tab is open",
    description:
      "Grant browser notification permissions to receive alerts while DaVinci Notes Web is open.",
  },
};

export function FeatureNoticeBanner({
  feature,
  onDismiss,
}: FeatureNoticeBannerProps) {
  const info = FEATURE_MESSAGES[feature];

  return (
    <aside
      className="web-feature-notice-banner"
      role="status"
      data-feature={feature}
    >
      <div className="web-feature-notice-content">
        <strong className="web-feature-notice-title">{info.title}</strong>
        <p className="web-feature-notice-description">{info.description}</p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="web-feature-notice-dismiss"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      ) : null}
    </aside>
  );
}

import type {
  AppNotificationOptions,
  NotificationAdapter,
} from "@app/platform-adapters";

export class TauriNotificationAdapter implements NotificationAdapter {
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.requestPermission();
    }
    return "denied";
  }

  showNotification(title: string, options?: AppNotificationOptions): void {
    void (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("send_desktop_notification_command", {
          title,
          body: options?.body ?? "",
        });
      } catch {
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification(title, {
            body: options?.body,
            tag: options?.tag,
            icon: options?.icon ?? "/logo/dark-logo.svg",
          });
        }
      }
    })();
  }
}

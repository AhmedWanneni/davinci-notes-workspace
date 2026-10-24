import type {
  AppNotificationOptions,
  NotificationAdapter,
} from "../NotificationAdapter";

export class WebNotificationAdapter implements NotificationAdapter {
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.requestPermission();
    }
    return "denied";
  }

  showNotification(title: string, options?: AppNotificationOptions): void {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(title, {
        body: options?.body,
        tag: options?.tag,
        icon: options?.icon,
      });
    }
  }
}

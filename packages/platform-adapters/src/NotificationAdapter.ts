export interface AppNotificationOptions {
  body?: string;
  tag?: string;
  icon?: string;
}

export interface NotificationAdapter {
  requestPermission(): Promise<NotificationPermission>;
  showNotification(title: string, options?: AppNotificationOptions): void;
}

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const existing = (await Notifications.getPermissionsAsync()) as unknown as {
      granted?: boolean;
      status?: string;
    };
    if (existing.granted || existing.status === "granted") return true;

    const requested = (await Notifications.requestPermissionsAsync()) as unknown as {
      granted?: boolean;
      status?: string;
    };
    return Boolean(requested.granted || requested.status === "granted");
  } catch {
    return false;
  }
}

export async function scheduleTodoReminder(
  taskTitle: string,
  reminderTime: string | Date,
  projectName?: string,
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    const targetDate = typeof reminderTime === "string" ? new Date(reminderTime) : reminderTime;
    if (isNaN(targetDate.getTime()) || targetDate.getTime() <= Date.now()) {
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: projectName ? `Reminder: ${projectName}` : "Task Reminder",
        body: taskTitle,
        sound: true,
        data: { taskTitle, projectName },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      },
    });

    return id;
  } catch (err) {
    console.warn("[todoNotifications] Failed to schedule notification:", err);
    return null;
  }
}

export async function cancelTodoReminder(notificationId: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore error
  }
}

const DEVICE_ID_KEY = "davinci_sync_device_id";

export function getDesktopDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `desktop-${crypto.randomUUID().slice(0, 12)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "desktop-default";
  }
}

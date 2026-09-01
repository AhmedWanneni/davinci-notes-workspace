export interface DeviceIdentityStorage {
  read(): Promise<string | undefined>;
  write(deviceId: string): Promise<void>;
}

export interface DeviceIdRandomSource {
  randomBytes(length: number): Uint8Array;
}

function encode(bytes: Uint8Array): string {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

export async function getOrCreateDeviceId(
  storage: DeviceIdentityStorage,
  random: DeviceIdRandomSource,
): Promise<string> {
  const existing = await storage.read();
  if (existing) return existing;
  const deviceId = `device-${encode(random.randomBytes(18))}`;
  await storage.write(deviceId);
  return deviceId;
}

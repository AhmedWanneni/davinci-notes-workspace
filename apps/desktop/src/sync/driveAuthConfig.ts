let dynamicClientId: string | null = null;
let dynamicClientSecret: string | null = null;

export function setDynamicDriveClientId(id: string | null) {
  dynamicClientId = id?.trim() || null;
}

export function setDynamicDriveClientSecret(secret: string | null) {
  dynamicClientSecret = secret?.trim() || null;
}

export function getDriveClientId(): string | null {
  return (
    dynamicClientId ||
    import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    null
  );
}

export function getDriveClientSecret(): string | null {
  return (
    dynamicClientSecret ||
    import.meta.env.VITE_GOOGLE_CLIENT_SECRET ||
    import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_SECRET ||
    null
  );
}

export function getDriveOAuthConfig(customClientId?: string) {
  const effectiveClientId = customClientId?.trim() || getDriveClientId();
  if (!effectiveClientId) {
    throw new Error(
      "Google Drive Client ID is not configured. Please configure VITE_GOOGLE_DRIVE_CLIENT_ID in apps/desktop/.env or Settings.",
    );
  }
  const clientSecret = getDriveClientSecret();
  return {
    clientId: effectiveClientId,
    clientSecret,
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
  } as const;
}


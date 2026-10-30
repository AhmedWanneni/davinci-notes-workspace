let dynamicClientId: string | null = null;
let dynamicClientSecret: string | null = null;

export function setDynamicCalendarClientId(id: string | null) {
  dynamicClientId = id?.trim() || null;
}

export function setDynamicCalendarClientSecret(secret: string | null) {
  dynamicClientSecret = secret?.trim() || null;
}

export function getCalendarClientId(): string | null {
  return (
    dynamicClientId ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID ||
    null
  );
}

export function getCalendarClientSecret(): string | null {
  return (
    dynamicClientSecret ||
    import.meta.env.VITE_GOOGLE_CLIENT_SECRET ||
    import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_SECRET ||
    null
  );
}

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
] as const;

export const CALENDAR_WRITE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
] as const;

export function getCalendarOAuthConfig(customClientId?: string, writeAccess = true) {
  const effectiveClientId = customClientId?.trim() || getCalendarClientId();
  if (!effectiveClientId) {
    throw new Error(
      "Google Client ID is not configured. Please enter your OAuth Client ID in Settings or configure VITE_GOOGLE_CLIENT_ID in apps/desktop/.env",
    );
  }
  const clientSecret = getCalendarClientSecret();
  return {
    clientId: effectiveClientId,
    clientSecret,
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
    scopes: writeAccess ? CALENDAR_WRITE_SCOPES : CALENDAR_SCOPES,
  } as const;
}

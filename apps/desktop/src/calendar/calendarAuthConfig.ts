let dynamicClientId: string | null = null;

export function setDynamicCalendarClientId(id: string | null) {
  dynamicClientId = id?.trim() || null;
}

export function getCalendarClientId(): string | null {
  return (
    dynamicClientId ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID ||
    null
  );
}

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
] as const;

export function getCalendarOAuthConfig(customClientId?: string) {
  const effectiveClientId = customClientId?.trim() || getCalendarClientId();
  if (!effectiveClientId) {
    throw new Error(
      "Google Client ID is not configured. Please enter your OAuth Client ID in Settings or configure VITE_GOOGLE_CLIENT_ID in apps/desktop/.env",
    );
  }
  return {
    clientId: effectiveClientId,
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
    scopes: CALENDAR_SCOPES,
  } as const;
}

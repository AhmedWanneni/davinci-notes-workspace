const clientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID;

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
] as const;

export function getCalendarOAuthConfig() {
  if (!clientId) {
    throw new Error(
      "VITE_GOOGLE_CLIENT_ID (or VITE_GOOGLE_DRIVE_CLIENT_ID) is not configured",
    );
  }
  return {
    clientId,
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
    scopes: CALENDAR_SCOPES,
  } as const;
}

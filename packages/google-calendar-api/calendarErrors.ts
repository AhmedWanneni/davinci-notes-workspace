export class GoogleAuthExpiredError extends Error {
  constructor(message = "Google authorization expired or invalid") {
    super(message);
    this.name = "GoogleAuthExpiredError";
  }
}

export class GoogleSyncTokenExpiredError extends Error {
  constructor(message = "Sync token expired or invalid; full sync required") {
    super(message);
    this.name = "GoogleSyncTokenExpiredError";
  }
}

export class GooglePreconditionFailedError extends Error {
  constructor(message = "Remote event was modified (ETag precondition failed)") {
    super(message);
    this.name = "GooglePreconditionFailedError";
  }
}

export class GoogleCalendarApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GoogleCalendarApiError";
  }
}

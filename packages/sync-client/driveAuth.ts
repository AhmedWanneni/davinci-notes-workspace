export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const DRIVE_APPDATA_SCOPE =
  "https://www.googleapis.com/auth/drive.appdata";

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope: string;
}

export interface TokenStore {
  load(): Promise<OAuthToken | null>;
  save(token: OAuthToken): Promise<void>;
  clear(): Promise<void>;
}

export interface OAuthTransport {
  exchangeCode(request: {
    code: string;
    verifier: string;
    redirectUri: string;
  }): Promise<OAuthToken>;
  refresh(refreshToken: string): Promise<OAuthToken>;
}

export class DriveReauthRequiredError extends Error {
  constructor() {
    super("drive-reauth-required");
  }
}

export interface PkceProvider {
  randomBytes(length: number): Uint8Array;
  sha256(value: string): Promise<Uint8Array>;
}

export interface LoginRequest {
  clientId: string;
  authorizationEndpoint: string;
  redirectUri: string;
  state: string;
}

export interface LoginStart {
  authorizationUrl: string;
  verifier: string;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

export async function startDriveLogin(
  request: LoginRequest,
  pkce: PkceProvider,
): Promise<LoginStart> {
  const verifier = base64Url(pkce.randomBytes(32));
  const challenge = base64Url(await pkce.sha256(verifier));
  const url = new URL(request.authorizationEndpoint);
  url.search = new URLSearchParams({
    client_id: request.clientId,
    redirect_uri: request.redirectUri,
    response_type: "code",
    scope: `${DRIVE_FILE_SCOPE} ${DRIVE_APPDATA_SCOPE}`,
    access_type: "offline",
    prompt: "consent",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: request.state,
  }).toString();
  return { authorizationUrl: url.toString(), verifier };
}

export class DriveTokenManager {
  constructor(
    private readonly store: TokenStore,
    private readonly transport: OAuthTransport,
    private readonly now = () => Date.now(),
  ) {}

  async getAccessToken(): Promise<string> {
    const token = await this.store.load();
    if (!token) throw new Error("drive-auth-required");
    if (token.expiresAt - this.now() > 60_000) return token.accessToken;
    if (!token.refreshToken) {
      await this.store.clear();
      throw new DriveReauthRequiredError();
    }
    try {
      const refreshed = await this.transport.refresh(token.refreshToken);
      await this.store.save({
        ...refreshed,
        refreshToken: refreshed.refreshToken ?? token.refreshToken,
      });
      return refreshed.accessToken;
    } catch (error) {
      if (error instanceof DriveReauthRequiredError) {
        await this.store.clear();
        throw error;
      }
      throw new Error("drive-refresh-failed", { cause: error });
    }
  }

  async finishLogin(code: string, verifier: string, redirectUri: string) {
    const token = await this.transport.exchangeCode({
      code,
      verifier,
      redirectUri,
    });
    await this.store.save(token);
    return token;
  }
}

export async function openAuthSessionAsync(
  _url: string,
  redirectUrl?: string,
): Promise<{ type: string; url?: string }> {
  return {
    type: "success",
    url: `${redirectUrl ?? "davinci://oauth/callback"}?code=test-auth-code&state=mock-state`,
  };
}

export async function dismissAuthSession(): Promise<void> {}

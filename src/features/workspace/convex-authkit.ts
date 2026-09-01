export const ACCESS_TOKEN_TIMEOUT_MS = 8_000;
export const WORKSPACE_AUTH_TIMEOUT_MS = 12_000;

export function convexAuthFromWorkos({
  authLoading,
  user,
}: {
  authLoading: boolean;
  user: unknown;
}) {
  return {
    isLoading: authLoading,
    isAuthenticated: Boolean(user),
  };
}

export async function fetchAccessTokenWithTimeout(
  run: () => Promise<string | null | undefined>,
  timeoutMs = ACCESS_TOKEN_TIMEOUT_MS,
): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      run().then((token) => token ?? null),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

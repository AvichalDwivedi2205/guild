import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('WorkOS Convex auth configuration', () => {
  it('accepts the environment default-application issuer for a multi-application AuthKit setup', async () => {
    vi.stubEnv('WORKOS_CLIENT_ID', 'client_current_application');
    vi.stubEnv(
      'WORKOS_JWT_ISSUER',
      'https://api.workos.com/user_management/client_default_application',
    );
    vi.resetModules();

    const { default: config } = await import('../../convex/auth.config');

    expect(config.providers).toEqual(
      expect.arrayContaining([
        {
          type: 'customJwt',
          issuer: 'https://api.workos.com/user_management/client_default_application',
          algorithm: 'RS256',
          jwks: 'https://api.workos.com/sso/jwks/client_current_application',
        },
      ]),
    );
  });

  it('defaults to the current application issuer for single-application environments', async () => {
    vi.stubEnv('WORKOS_CLIENT_ID', 'client_current_application');
    vi.stubEnv('WORKOS_JWT_ISSUER', '');
    vi.resetModules();

    const { default: config } = await import('../../convex/auth.config');

    expect(config.providers).toContainEqual({
      type: 'customJwt',
      issuer: 'https://api.workos.com/user_management/client_current_application',
      algorithm: 'RS256',
      jwks: 'https://api.workos.com/sso/jwks/client_current_application',
    });
  });

  it('rejects an issuer outside the WorkOS API origin', async () => {
    vi.stubEnv('WORKOS_CLIENT_ID', 'client_current_application');
    vi.stubEnv('WORKOS_JWT_ISSUER', 'https://example.com/user_management/client_other');
    vi.resetModules();

    await expect(import('../../convex/auth.config')).rejects.toThrow(
      'WORKOS_JWT_ISSUER must match https://api.workos.com/user_management/<application-id>',
    );
  });

  it('rejects issuer query strings and malformed WorkOS paths', async () => {
    vi.stubEnv('WORKOS_CLIENT_ID', 'client_current_application');
    vi.stubEnv(
      'WORKOS_JWT_ISSUER',
      'https://api.workos.com/user_management/client_other?unexpected=true',
    );
    vi.resetModules();

    await expect(import('../../convex/auth.config')).rejects.toThrow(
      'WORKOS_JWT_ISSUER must match https://api.workos.com/user_management/<application-id>',
    );
  });
});

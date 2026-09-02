const clientId = process.env.WORKOS_CLIENT_ID;

if (!clientId) {
  throw new Error('WORKOS_CLIENT_ID must be configured on this Convex deployment');
}

const jwks = `https://api.workos.com/sso/jwks/${clientId}`;
const jwtIssuer =
  process.env.WORKOS_JWT_ISSUER?.trim() || `https://api.workos.com/user_management/${clientId}`;

const parsedJwtIssuer = new URL(jwtIssuer);
const issuerPath = parsedJwtIssuer.pathname.split('/').filter(Boolean);

if (
  parsedJwtIssuer.origin !== 'https://api.workos.com' ||
  parsedJwtIssuer.username ||
  parsedJwtIssuer.password ||
  parsedJwtIssuer.search ||
  parsedJwtIssuer.hash ||
  issuerPath.length !== 2 ||
  issuerPath[0] !== 'user_management' ||
  !issuerPath[1]
) {
  throw new Error(
    'WORKOS_JWT_ISSUER must match https://api.workos.com/user_management/<application-id>',
  );
}

const authConfig = {
  providers: [
    {
      type: 'customJwt' as const,
      issuer: 'https://api.workos.com/',
      algorithm: 'RS256' as const,
      jwks,
      applicationID: clientId,
    },
    {
      type: 'customJwt' as const,
      issuer: jwtIssuer,
      algorithm: 'RS256' as const,
      jwks,
    },
  ],
};

export default authConfig;

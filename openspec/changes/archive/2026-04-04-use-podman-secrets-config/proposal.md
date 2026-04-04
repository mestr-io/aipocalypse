## Why

The current hosting setup relies on a user-managed `.env` file for sensitive values such as the GitHub OAuth client secret, admin password, and hash pepper. For production deployments on a single VPS with rootless Podman, Podman secrets provide a cleaner and less error-prone mechanism for delivering sensitive configuration into the container.

## What Changes

- Update the application configuration loading so sensitive values can be read from Podman secret files mounted at runtime.
- Keep environment variable support for local development and tests, while adding file-based fallback for production secrets.
- Update deployment artifacts and hosting documentation to use Podman secrets for sensitive settings and regular environment variables only for non-sensitive settings.
- Remove the need to store production secrets in a persistent `.env` file on the server.

## Capabilities

### New Capabilities
- `podman-secrets-config`: Support reading production secrets from Podman-mounted secret files while preserving environment-variable configuration for development.

### Modified Capabilities
- `hosting-guide`: Update deployment guidance to provision Podman secrets and wire them into the Quadlet unit instead of storing sensitive values in `.env`.
- `quadlet-unit`: Update the example Quadlet unit to mount Podman secrets and keep only non-sensitive configuration inline.

## Impact

- Affected code: configuration loading for GitHub OAuth, admin auth, and hash identity/pepper handling; deployment Quadlet file; hosting documentation.
- No new runtime dependencies are expected.
- Existing local development and test workflows should continue to work with environment variables.
- Production deployment setup changes by requiring `podman secret create ...` before starting the service.

## Context

AIPocalypse currently reads sensitive configuration directly from environment variables in multiple places: GitHub OAuth routes and session signing, admin authentication, and hash identity derivation. The production hosting workflow has also been documented around a server-side `.env` file. In the target deployment model, the application runs as a rootless Podman container managed by Quadlet, and Podman secrets are already available as mounted files under `/run/secrets`.

This change crosses application code, deployment configuration, and hosting documentation. It also affects security-sensitive startup behavior, so it benefits from an explicit design.

## Goals / Non-Goals

**Goals:**
- Allow sensitive production configuration to be provided via Podman secret files.
- Preserve existing environment-variable behavior for local development and tests.
- Centralize secret/config loading so the app stops duplicating direct `process.env` access for sensitive values.
- Update the Quadlet unit and hosting guide to reflect the secrets-based deployment model.

**Non-Goals:**
- Replace all environment variable usage in the app.
- Introduce a new secret manager outside Podman.
- Encrypt application configuration at rest beyond what Podman secrets already provide.
- Change the database path or non-sensitive configuration model.

## Decisions

### 1. Add a shared configuration helper for env-first, file-fallback lookup
Sensitive settings will be loaded through a shared helper that first checks `process.env`, then falls back to a known secret file path under `/run/secrets`.

Rationale:
- Keeps local development and tests unchanged.
- Avoids shell glue in `entrypoint.sh`.
- Makes secret handling explicit and reusable.

Alternatives considered:
- Export secrets from `entrypoint.sh` into environment variables: rejected because it hides config behavior in shell startup logic and duplicates mapping knowledge outside TypeScript.
- Read secret files ad hoc in each module: rejected because it scatters security-sensitive file access logic.

### 2. Only sensitive values move to Podman secrets
The app will continue to read non-sensitive values like `GITHUB_CLIENT_ID` and `DATABASE_PATH` from normal environment configuration. Podman secrets will be used for `GITHUB_CLIENT_SECRET`, `ADMIN_PASSWORD`, and `HASH_PEPPER`.

Rationale:
- Keeps operational setup simple.
- Avoids unnecessary secret indirection for values that are safe to keep inline.
- Matches the real sensitivity boundary in the application.

Alternatives considered:
- Move every config value to secrets: rejected because it adds ceremony without meaningful security benefit.

### 3. Use explicit secret names tied to the app
The deployment model will standardize on these secret names:
- `aipocalypse_github_client_secret`
- `aipocalypse_admin_password`
- `aipocalypse_hash_pepper`

Rationale:
- Prevents naming collisions on a host running multiple services.
- Keeps Quadlet and documentation unambiguous.

Alternatives considered:
- Generic names like `admin_password`: rejected because they are too easy to collide with other workloads.

### 4. Quadlet will mount secrets directly instead of using EnvironmentFile for secrets
The example Quadlet unit will mount the three Podman secrets and keep only non-sensitive configuration inline.

Rationale:
- Removes the need for a production `.env` file containing secrets.
- Aligns the unit file with the new app configuration model.

Alternatives considered:
- Keep `.env` for everything and merely document secrets as optional: rejected because it does not achieve the main security/usability goal.

## Risks / Trade-offs

- [Secret file missing or misnamed] → Fail fast with clear error messages that mention the expected env var or secret path.
- [Different secret loading paths across modules] → Centralize lookup in one helper and reuse it everywhere sensitive config is read.
- [Docs drift from actual deployment unit] → Update both `deploy/aipocalypse.container` and `docs/hosting.md` in the same change.
- [Tests accidentally depend on Podman secret files] → Keep env vars as first priority so existing tests remain isolated and deterministic.

## Migration Plan

1. Add the shared config/secret lookup helper.
2. Update admin auth, OAuth/session secret loading, and hash pepper loading to use the helper.
3. Update the Quadlet unit to mount the three Podman secrets and remove secret-bearing env file usage.
4. Update the hosting guide with secret creation, Quadlet wiring, and deployment verification steps.
5. On production hosts, create the three Podman secrets before starting or restarting the service.

Rollback strategy:
- Revert the code and deployment unit to the env-only model.
- Because env lookup remains supported, rollback is low risk if the old `.env` file is still available.

## Open Questions

- Whether to keep a minimal `.env` file for non-sensitive settings in production or switch the Quadlet to inline `Environment=` entries only.
- Whether to add dedicated tests for file-based secret lookup in addition to preserving current env-based tests.

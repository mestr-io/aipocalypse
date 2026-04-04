## 1. Application secret loading

- [x] 1.1 Add a shared config helper that reads sensitive values from environment variables first and falls back to `/run/secrets/*` files.
- [x] 1.2 Update GitHub OAuth and session signing code to use the shared helper for `GITHUB_CLIENT_SECRET`.
- [x] 1.3 Update admin authentication to use the shared helper for `ADMIN_PASSWORD`.
- [x] 1.4 Update hash pepper loading to use the shared helper for `HASH_PEPPER`.
- [x] 1.5 Add or update tests covering env precedence and missing-secret failure behavior.

## 2. Deployment artifacts

- [x] 2.1 Update `deploy/aipocalypse.container` to use a pinned GHCR image and mount the three `aipocalypse_*` Podman secrets.
- [x] 2.2 Remove reliance on a production secret-bearing `EnvironmentFile` while keeping non-sensitive configuration available to the container.

## 3. Hosting documentation

- [x] 3.1 Update `docs/hosting.md` to document Podman secret creation for GitHub client secret, admin password, and hash pepper.
- [x] 3.2 Update the hosting guide to describe the version-pinned GHCR deployment flow without `latest` tags or `podman auto-update`.
- [x] 3.3 Update troubleshooting guidance to cover missing secrets and GHCR authentication problems.

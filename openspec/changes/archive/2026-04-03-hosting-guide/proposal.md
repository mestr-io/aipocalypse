## Why

The application needs a production hosting guide for deploying to a Hetzner ARM VPS using Podman with Quadlet-based systemd integration. The Containerfile exists but there is no documentation on how to set up the host, run the container as a managed service, or handle updates. Without this, deployment is ad-hoc and not reproducible.

## What Changes

- Add a comprehensive hosting guide (`docs/hosting.md`) covering Podman installation, rootless container setup, Quadlet systemd units, nginx reverse proxy configuration, TLS with certbot, and deployment workflows.
- Add a ready-to-use Podman Quadlet unit file (`deploy/aipocalypse.container`) that can be copied directly to the VPS.
- No application code changes. No Containerfile changes. Documentation and deployment config only.

## Capabilities

### New Capabilities
- `hosting-guide`: Step-by-step documentation for deploying AIPocalypse on a Hetzner ARM VPS with rootless Podman, Quadlet systemd units, nginx reverse proxy, and TLS via certbot.
- `quadlet-unit`: A Podman Quadlet `.container` file for systemd service management, including auto-update labels and volume/env configuration.

### Modified Capabilities
<!-- No existing capabilities are modified. This change is purely additive documentation and deployment config. -->

## Impact

- New files: `docs/hosting.md`, `deploy/aipocalypse.container`
- No code changes, no dependency changes, no API changes
- Existing `nginx/aipocalypse.conf` and `Containerfile` are referenced but not modified

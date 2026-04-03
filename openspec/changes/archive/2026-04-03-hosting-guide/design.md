## Context

AIPocalypse is a Bun/Hono server-side rendered app with an SQLite database. It already has a working multi-stage Containerfile (`oven/bun:1-alpine`), an entrypoint.sh that runs migrations then starts the server, and an nginx location-block config for reverse proxying at `/labs/aipocalypse/`.

The target environment is a shared Hetzner CAX (ARM64) VPS running Ubuntu, where nginx already serves other apps under the mestr.io domain with TLS via certbot.

## Goals / Non-Goals

**Goals:**
- Provide a reproducible, step-by-step guide for deploying the app on a Hetzner ARM VPS
- Use rootless Podman with Quadlet for systemd-native container management
- Cover the full lifecycle: build, push, pull, run, update, operate, troubleshoot
- Include a ready-to-use Quadlet `.container` file in the repository
- Document both manual and auto-update deployment strategies

**Non-Goals:**
- VPS initial provisioning (SSH hardening, user creation, firewall setup — assumed done)
- CI/CD pipeline setup (GitHub Actions) — may be added later
- Multi-node / HA deployment
- Monitoring/alerting infrastructure
- Changes to application code or the Containerfile

## Decisions

### 1. Rootless Podman over rootful

**Decision**: Run containers as a non-root `deploy` user with rootless Podman.

**Rationale**: Port 5555 is above 1024, so no privileged binding needed. Nginx (root-level) handles TLS and public-facing ports. Rootless provides better security isolation on a shared server.

**Alternatives considered**:
- Rootful Podman: simpler (system-level systemd, `/etc/containers/systemd/`), but unnecessary privilege escalation on a shared host.
- Docker: Podman is the stated requirement. Podman is also daemonless and more systemd-native.

### 2. Quadlet `.container` files over `podman generate systemd`

**Decision**: Use Podman Quadlet unit files (`.container` format) placed in `~/.config/containers/systemd/`.

**Rationale**: Quadlet is the modern, recommended approach (Podman 4.4+). It generates systemd units from declarative container definitions. Cleaner than `podman generate systemd` which is deprecated and produces verbose, hard-to-maintain unit files.

**Alternatives considered**:
- `podman generate systemd`: deprecated since Podman 4.4, generates opaque unit files.
- Plain systemd unit with `ExecStart=podman run ...`: works but loses Quadlet's declarative benefits (auto-update integration, cleaner syntax).

### 3. Docker Hub as container registry

**Decision**: Push images to `docker.io`.

**Rationale**: User preference. Universal support, no extra auth configuration needed on most systems.

**Alternatives considered**:
- ghcr.io: natural fit with GitHub repos, free for public images, but adds a login step on the VPS.

### 4. Local cross-compilation for ARM images

**Decision**: Build ARM64 images on the dev machine using `podman build --platform linux/arm64`.

**Rationale**: Simple, no CI infrastructure needed. QEMU user-static handles cross-arch builds transparently.

**Alternatives considered**:
- Build on the VPS itself: avoids cross-compilation but requires build tools on production.
- GitHub Actions with ARM runners: good for automation but out of scope for now.

### 5. Host volume at `~/aipocalypse/data` for SQLite persistence

**Decision**: Bind-mount `~/aipocalypse/data` into the container at `/app/data`.

**Rationale**: SQLite is a single file. A bind mount makes backups trivial (`cp`), is visible on the host filesystem, and survives container rebuilds. The `:Z` SELinux label is included for compatibility.

### 6. Environment file for secrets

**Decision**: Store secrets in `~/aipocalypse/.env`, referenced by `EnvironmentFile=` in the Quadlet unit.

**Rationale**: Keeps secrets out of the container image and Quadlet file. Simple to manage. File permissions (`chmod 600`) provide basic protection.

## Risks / Trade-offs

- **[Podman version on Ubuntu 22.04]** Ubuntu 22.04 ships Podman 3.x which lacks Quadlet support. → Mitigation: Document the minimum version requirement (4.4+) and note that Ubuntu 24.04+ ships a compatible version. Include PPA instructions if needed.

- **[Rootless UID mapping with volumes]** Rootless Podman maps container UIDs into a subordinate range. The `bun` user (UID 1000) inside the container may not map to the host user's UID 1000. → Mitigation: The `:Z` volume flag handles SELinux. For UID issues, document `podman unshare chown` as the fix.

- **[Cross-compilation build time]** QEMU-based cross-compilation is slower than native builds. → Mitigation: The Containerfile is minimal (install deps + copy source), so build times are acceptable. Document as a known trade-off.

- **[Single point of failure for SQLite]** No replication, no automated backups. → Mitigation: Document a manual backup procedure. Automated backups are a future enhancement.

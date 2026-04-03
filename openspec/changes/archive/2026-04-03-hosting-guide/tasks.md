## 1. Quadlet Unit File

- [x] 1.1 Create `deploy/aipocalypse.container` Quadlet file with all directives: Image, PublishPort (127.0.0.1:5555:5555), Volume (%h/aipocalypse/data:/app/data:Z), EnvironmentFile (%h/aipocalypse/.env), Restart=always, AutoUpdate=registry label, and proper [Unit]/[Install] sections

## 2. Hosting Guide

- [x] 2.1 Create `docs/hosting.md` with overview section: architecture diagram (ASCII), stack summary, and prerequisites
- [x] 2.2 Write Podman installation section: apt install, version verification (>= 4.4), ARM-specific notes
- [x] 2.3 Write rootless Podman setup section: create deploy user, loginctl enable-linger, verify rootless operation
- [x] 2.4 Write build & push section: podman build --platform linux/arm64, podman login, podman push to Docker Hub, tagging strategy
- [x] 2.5 Write VPS app configuration section: create directories, .env file from template, pull image, verify permissions
- [x] 2.6 Write Quadlet systemd section: copy .container file, daemon-reload, start/enable service, verification commands
- [x] 2.7 Write nginx reverse proxy section: integrate location block into existing server config, test and reload, verify end-to-end
- [x] 2.8 Write TLS/certbot section: install certbot, run with nginx plugin, verify auto-renewal, note for shared servers
- [x] 2.9 Write deployment section: Option A (manual pull + restart), Option B (podman auto-update timer), post-deploy verification
- [x] 2.10 Write operations section: logs (journalctl), DB backup (cp), container shell (podman exec), restart, rollback
- [x] 2.11 Write troubleshooting section: container won't start, port conflicts, permission errors, image pull failures

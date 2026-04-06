# Hosting Guide — Hetzner ARM VPS with Podman

This guide walks through deploying AIPocalypse on a Hetzner CAX (ARM64) VPS using rootless Podman, Quadlet systemd integration, and nginx as a reverse proxy.

## Overview

```
┌──────────────────────────── Hetzner CAX ARM VPS ──────────────────────────┐
│                                                                            │
│  System-level (root)                                                       │
│  └── nginx.service ─── TLS (certbot) ── /aipocalypse/ → :5555             │
│                                                                            │
│  User-level ("deploy" user, rootless Podman)                               │
│  ├── loginctl enable-linger                                                │
│  ├── ~/.config/containers/systemd/aipocalypse.container  (Quadlet)         │
│  │   └── podman container                                                  │
│  │       ├── Image: ghcr.io/<user>/aipocalypse:v0.1.0                      │
│  │       ├── Port: 127.0.0.1:5555:5555                                    │
│  │       ├── Volume: ~/aipocalypse/data:/app/data:Z                        │
│  │       ├── Environment: GITHUB_CLIENT_ID, DATABASE_PATH, APP_BASE_PATH   │
│  │       ├── Secrets: aipocalypse_github_client_secret,                    │
│  │       │            aipocalypse_session_secret,                          │
│  │       │            aipocalypse_admin_password,                          │
│  │       │            aipocalypse_admin_session_secret,                    │
│  │       │            aipocalypse_hash_pepper                              │
│  │       └── Restart: always                                               │
│  │                                                                         │
│  └── ~/aipocalypse/                                                        │
│      └── data/aipocalypse.db                                               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Stack**: Podman (rootless) · Quadlet · systemd · nginx · certbot

**Prerequisites**:
- Hetzner CAX ARM VPS running Debian 13 (trixie)
- SSH access with a sudo-capable user
- nginx already installed and serving other sites on the domain
- A GitHub account for pushing images to GHCR (GitHub Container Registry)
- The domain (`labs.mestr.io`) with DNS pointing to the VPS

---

## 1. Install Podman

SSH into the VPS as your sudo-capable user.

```bash
sudo apt update
sudo apt install -y podman
```

Verify the installation and check the version. **Quadlet requires Podman >= 4.4.**
Debian 13 (trixie) ships Podman 5.x, so this is satisfied out of the box.

```bash
podman --version
# podman version 5.x.x
```

Verify that Podman works:

```bash
podman info --format '{{.Host.OS}} {{.Host.Arch}}'
# linux arm64
```

---

## 2. Set Up Rootless Podman

Create a dedicated `deploy` user (or use an existing non-root user):

```bash
sudo adduser deploy
```

Enable lingering so the user's systemd services run without an active login session:

```bash
sudo loginctl enable-linger deploy
```

Switch to the deploy user:

```bash
sudo su - deploy
```

Verify rootless Podman works:

```bash
podman ps
# CONTAINER ID  IMAGE  COMMAND  CREATED  STATUS  PORTS  NAMES
# (empty is fine — it means Podman is working)

systemctl --user status
# Should show the user's systemd instance running
```

> **All remaining steps in sections 3–6 are run as the `deploy` user**
> unless noted otherwise. Sections 7–8 require root.

---

## 3. Build & Push the Image (on your dev machine)

> This section runs on your **local dev machine**, not the VPS.

Build and push a versioned multi-arch image using the Makefile target:

```bash
make image-release TAG=v0.1.0
```

This publishes:

```text
ghcr.io/<your-github-user>/aipocalypse:v0.1.0
```

> **Cross-compilation note**: This uses QEMU user-static emulation under the
> hood. The first build may be slower than native. If QEMU isn't installed:
>
> ```bash
> # On Fedora/RHEL
> sudo dnf install qemu-user-static
>
> # On Ubuntu/Debian
> sudo apt install qemu-user-static
> ```

Before the first push, log in to GHCR:

```bash
podman login ghcr.io -u <your-github-user>
```

Use a GitHub Personal Access Token (classic) with at least `write:packages`.

### Tagging strategy

For production deployments, use immutable version tags only (no `latest`).
For example:

```bash
make image-release TAG=v0.1.0
make image-release TAG=v0.1.1
```

Then pin the exact version in the Quadlet file. This makes deployments
reproducible and rollbacks explicit.

---

## 4. Configure the App on the VPS

> Run these as the **`deploy` user** on the VPS.

Create the application directory and data volume:

```bash
mkdir -p ~/aipocalypse/data
```

Create the required Podman secrets:

```bash
printf '%s' 'your_github_client_secret' | podman secret create aipocalypse_github_client_secret -
openssl rand -hex 32 | podman secret create aipocalypse_session_secret -
printf '%s' 'your_admin_password' | podman secret create aipocalypse_admin_password -
openssl rand -hex 32 | podman secret create aipocalypse_admin_session_secret -
openssl rand -hex 32 | podman secret create aipocalypse_hash_pepper -
```

List secrets to confirm they exist:

```bash
podman secret ls
```

Pull the container image:

```bash
podman pull ghcr.io/<your-github-user>/aipocalypse:v0.1.0
```

Verify the image is available:

```bash
podman images | grep aipocalypse
```

---

## 5. Set Up the Quadlet systemd Service

> Run these as the **`deploy` user** on the VPS.

The repository includes a ready-to-use Quadlet file at `deploy/aipocalypse.container`.
Copy it to the user-level Quadlet directory:

```bash
mkdir -p ~/.config/containers/systemd
```

Copy the file from the repo (or create it manually — see `deploy/aipocalypse.container`
in the repository for the full contents):

```bash
cp deploy/aipocalypse.container ~/.config/containers/systemd/
```

> This assumes the repository has been cloned onto the VPS. If not, either
> clone it first or copy just this file over with `scp`.
>
> **Important**: Edit the `Image=` line to replace `CHANGEME` and the version
> tag with your actual GitHub username and release version:
>
> ```bash
> sed -i 's|ghcr.io/CHANGEME/aipocalypse:v0.1.0|ghcr.io/<your-github-user>/aipocalypse:v0.1.0|' ~/.config/containers/systemd/aipocalypse.container
> ```

If needed, edit the non-sensitive `Environment=` lines in the Quadlet file to set
`GITHUB_CLIENT_ID`, `DATABASE_PATH`, and `APP_BASE_PATH=/aipocalypse` for your deployment.

Reload systemd to pick up the new Quadlet file:

```bash
systemctl --user daemon-reload
```

Start the service:

```bash
systemctl --user start aipocalypse
```

Enable it to start on boot:

```bash
systemctl --user enable aipocalypse
```

Verify it's running:

```bash
# Check systemd status
systemctl --user status aipocalypse

# Check the container is running
podman ps

# Test the app responds
curl -s http://localhost:5555 | head -20
```

> **Quadlet naming**: Quadlet generates a systemd unit from the `.container`
> file. The service name matches the filename: `aipocalypse.container` becomes
> `aipocalypse.service`. The container itself is named `systemd-aipocalypse`.

---

## 6. Configure nginx Reverse Proxy

> Run these as **root** (or with sudo) on the VPS.

The repository includes an nginx location block at `nginx/aipocalypse.conf`.
For path-prefixed hosting on `https://labs.mestr.io/aipocalypse/`, use a
`location /aipocalypse/` block inside your existing `server {}` block.

Add the location block to your nginx config. For example, if your server block
is at `/etc/nginx/sites-enabled/labs.mestr.io`:

```bash
# Option A: Include the file
# Add this line inside your server { } block:
#   include /path/to/repo/nginx/aipocalypse.conf;

# Option B: Copy the contents directly into your server block
sudo nano /etc/nginx/sites-enabled/mestr.io
```

Use this location block:

```nginx
location /aipocalypse/ {
    proxy_pass http://127.0.0.1:5555/;
    proxy_http_version 1.1;

    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_connect_timeout 10s;
    proxy_read_timeout    60s;
    proxy_send_timeout    60s;
}
```

Also set:

```ini
Environment=APP_BASE_PATH=/aipocalypse
```

in the Quadlet file so generated links, form actions, and redirects resolve
under the prefixed URL.

Test the configuration and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Verify end-to-end:

```bash
curl -s https://labs.mestr.io/aipocalypse/ | head -20
```

---

## 7. TLS with Certbot

> Run these as **root** (or with sudo) on the VPS.

If your domain already has TLS configured (likely on a shared server), you can
skip this section. The AIPocalypse location block inherits the TLS configuration
from the server block it's placed in.

If TLS is not yet set up, install certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain a certificate:

```bash
sudo certbot --nginx -d labs.mestr.io
```

Certbot will modify your nginx config to add the SSL directives and set up
automatic renewal.

Verify the renewal timer is active:

```bash
sudo systemctl status certbot.timer
```

Test renewal:

```bash
sudo certbot renew --dry-run
```

---

## 8. Deployment

### Manual deployment

When you want to release a new version from your dev machine:

```bash
# On your dev machine
make image-release TAG=v0.1.1
```

Then on the VPS (as the `deploy` user), update the pinned version in the
Quadlet file, pull the new image, and restart:

```bash
sed -i 's|aipocalypse:v0.1.0|aipocalypse:v0.1.1|' ~/.config/containers/systemd/aipocalypse.container
podman pull ghcr.io/<user>/aipocalypse:v0.1.1
systemctl --user daemon-reload
systemctl --user restart aipocalypse
```

Verify:

```bash
systemctl --user status aipocalypse
curl -s http://localhost:5555 | head -5
curl -s https://labs.mestr.io/aipocalypse/ | head -5
```

### Post-deploy verification

After any deployment method, verify:

```bash
# Service is running
systemctl --user status aipocalypse

# Container is healthy
podman ps

# App responds locally
curl -s http://localhost:5555 | head -5

# App responds via nginx path prefix
curl -s https://labs.mestr.io/aipocalypse/ | head -5

# Check for migration output in logs
journalctl --user -u aipocalypse --since "5 minutes ago" | head -20
```

---

## 9. Operations

### View logs

```bash
# Recent logs
journalctl --user -u aipocalypse -n 50

# Follow logs in real-time
journalctl --user -u aipocalypse -f

# Logs since last boot
journalctl --user -u aipocalypse -b
```

### Back up the database

The SQLite database lives at `~/aipocalypse/data/aipocalypse.db` on the host.

```bash
# Simple file copy (safe while the app handles writes atomically)
cp ~/aipocalypse/data/aipocalypse.db ~/backups/aipocalypse-$(date +%Y%m%d-%H%M%S).db
```

For a consistent backup while the app is running, stop the service briefly,
copy the database, then start it again:

```bash
systemctl --user stop aipocalypse
cp ~/aipocalypse/data/aipocalypse.db ~/backups/aipocalypse-$(date +%Y%m%d-%H%M%S).db
systemctl --user start aipocalypse
```

### Access a container shell

```bash
podman exec -it systemd-aipocalypse sh
```

### Restart the service

```bash
systemctl --user restart aipocalypse
```

### Stop the service

```bash
systemctl --user stop aipocalypse
```

### Rollback to a previous image

If you tagged releases (e.g., `v1.0.0`, `v1.1.0`):

```bash
# Edit the Quadlet file to pin the previous known-good tag
sed -i 's|aipocalypse:v1.1.0|aipocalypse:v1.0.0|' ~/.config/containers/systemd/aipocalypse.container

# Pull, reload, and restart
podman pull ghcr.io/<user>/aipocalypse:v1.0.0
systemctl --user daemon-reload
systemctl --user restart aipocalypse
```

---

## 10. Troubleshooting

### Container won't start

```bash
# Check systemd logs for the service
journalctl --user -u aipocalypse -n 100 --no-pager

# Check if the container exists but failed
podman ps -a | grep aipocalypse

# Verify the data directory exists
ls -la ~/aipocalypse/data/

# Verify the required secrets exist
podman secret ls
podman secret inspect aipocalypse_github_client_secret
podman secret inspect aipocalypse_session_secret
podman secret inspect aipocalypse_admin_password
podman secret inspect aipocalypse_admin_session_secret
podman secret inspect aipocalypse_hash_pepper

# Try running the container manually to see errors
podman run --rm \
  --userns=keep-id \
  -p 127.0.0.1:5555:5555 \
  -v ~/aipocalypse/data:/app/data:Z \
  --secret aipocalypse_github_client_secret \
  --secret aipocalypse_session_secret \
  --secret aipocalypse_admin_password \
  --secret aipocalypse_admin_session_secret \
  --secret aipocalypse_hash_pepper \
  -e GITHUB_CLIENT_ID=your_github_client_id \
  -e DATABASE_PATH=data/aipocalypse.db \
  -e APP_BASE_PATH=/aipocalypse \
  ghcr.io/<user>/aipocalypse:v0.1.0
```

### Port conflict

```bash
# Check what's using port 5555
ss -tlnp | grep 5555
```

### Permission denied on data directory

Rootless Podman maps UIDs into a subordinate range. The image runs as the
`bun` user (UID 1000). This works cleanly when the host deploy user is also
UID 1000. If your deploy user has a different UID/GID, you may need to rebuild
the image with matching IDs or adjust the runtime user configuration. If you
still hit problems:

```bash
# Verify the data directory is owned by the deploy user
ls -la ~/aipocalypse/data/

# It should be owned by the deploy user, NOT by a numeric UID like 100999
# If ownership is wrong, fix it:
chown -R $(id -u):$(id -g) ~/aipocalypse/data/
```

### Image pull fails

```bash
# Check authentication
podman login ghcr.io -u <your-github-user>

# Try pulling manually
podman pull ghcr.io/<user>/aipocalypse:v0.1.0
```

If the package is private, make sure you are logged in as the same user that
runs the Quadlet service.

### Base path issues

If the app loads but links, assets, or OAuth redirects point to `/` instead of
`/aipocalypse/`, verify that the Quadlet file includes:

```ini
Environment=APP_BASE_PATH=/aipocalypse
```

and that nginx is proxying `location /aipocalypse/` with a trailing slash on
`proxy_pass`.

### Secret missing or misnamed

```bash
# List available secrets
podman secret ls

# Inspect secret metadata
podman secret inspect aipocalypse_github_client_secret
podman secret inspect aipocalypse_session_secret
podman secret inspect aipocalypse_admin_password
podman secret inspect aipocalypse_admin_session_secret
podman secret inspect aipocalypse_hash_pepper

# Recreate a missing secret if needed
printf '%s' 'your_github_client_secret' | podman secret create aipocalypse_github_client_secret -
```

### Quadlet file not recognized

```bash
# Verify the file is in the right directory
ls -la ~/.config/containers/systemd/

# Check for syntax errors — Quadlet generates a unit at reload time
systemctl --user daemon-reload 2>&1

# List generated units
systemctl --user list-unit-files | grep aipocalypse
```

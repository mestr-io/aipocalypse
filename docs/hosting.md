# Hosting Guide — Hetzner ARM VPS with Podman

This guide walks through deploying AIPocalypse on a Hetzner CAX (ARM64) VPS using rootless Podman, Quadlet systemd integration, and nginx as a reverse proxy.

## Overview

```
┌──────────────────────────── Hetzner CAX ARM VPS ──────────────────────────┐
│                                                                            │
│  System-level (root)                                                       │
│  └── nginx.service ─── TLS (certbot) ── /labs/aipocalypse/ → :5555        │
│                                                                            │
│  User-level ("deploy" user, rootless Podman)                               │
│  ├── loginctl enable-linger                                                │
│  ├── ~/.config/containers/systemd/aipocalypse.container  (Quadlet)         │
│  │   └── podman container                                                  │
│  │       ├── Image: docker.io/<user>/aipocalypse:latest                    │
│  │       ├── Port: 127.0.0.1:5555:5555                                    │
│  │       ├── Volume: ~/aipocalypse/data:/app/data:Z                        │
│  │       ├── EnvironmentFile: ~/aipocalypse/.env                           │
│  │       └── Restart: always                                               │
│  │                                                                         │
│  └── ~/aipocalypse/                                                        │
│      ├── .env                                                              │
│      └── data/aipocalypse.db                                               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Stack**: Podman (rootless) · Quadlet · systemd · nginx · certbot

**Prerequisites**:
- Hetzner CAX ARM VPS running Debian 13 (trixie)
- SSH access with a sudo-capable user
- nginx already installed and serving other sites on the domain
- A Docker Hub account for pushing images
- The domain (`mestr.io`) with DNS pointing to the VPS

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

Build the ARM64 image using the existing Dockerfile:

```bash
podman build --platform linux/arm64 -t docker.io/<your-dockerhub-user>/aipocalypse:latest .
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

Log in to Docker Hub:

```bash
podman login docker.io
```

Push the image:

```bash
podman push docker.io/<your-dockerhub-user>/aipocalypse:latest
```

### Tagging strategy

For production deployments, tag with both `latest` and a specific version:

```bash
podman tag docker.io/<user>/aipocalypse:latest docker.io/<user>/aipocalypse:v1.0.0
podman push docker.io/<user>/aipocalypse:v1.0.0
```

This lets you pin a specific version for rollbacks while `latest` always points
to the most recent release.

---

## 4. Configure the App on the VPS

> Run these as the **`deploy` user** on the VPS.

Create the application directory and data volume:

```bash
mkdir -p ~/aipocalypse/data
```

Create the environment file from the template:

```bash
cat > ~/aipocalypse/.env << 'EOF'
# GitHub OAuth App credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Admin panel password
ADMIN_PASSWORD=your_admin_password

# SQLite database path (inside container)
DATABASE_PATH=data/aipocalypse.db
EOF
```

Lock down the env file (it contains secrets):

```bash
chmod 600 ~/aipocalypse/.env
```

Pull the container image:

```bash
podman pull docker.io/<your-dockerhub-user>/aipocalypse:latest
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

> **Important**: Edit the `Image=` line to replace `CHANGEME` with your actual
> Docker Hub username:
>
> ```bash
> sed -i 's/CHANGEME/<your-dockerhub-user>/' ~/.config/containers/systemd/aipocalypse.container
> ```

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
This is a `location` block, not a full server block — it needs to go inside
your existing `server {}` block for the domain.

Add the location block to your nginx config. For example, if your server block
is at `/etc/nginx/sites-enabled/mestr.io`:

```bash
# Option A: Include the file
# Add this line inside your server { } block:
#   include /path/to/repo/nginx/aipocalypse.conf;

# Option B: Copy the contents directly into your server block
sudo nano /etc/nginx/sites-enabled/mestr.io
```

The location block contents (from `nginx/aipocalypse.conf`):

```nginx
location /labs/aipocalypse/ {
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

Test the configuration and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Verify end-to-end:

```bash
curl -s https://mestr.io/labs/aipocalypse/ | head -20
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
sudo certbot --nginx -d mestr.io
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

### Option A: Manual deployment

When you push a new image from your dev machine:

```bash
# On your dev machine
podman build --platform linux/arm64 -t docker.io/<user>/aipocalypse:latest .
podman push docker.io/<user>/aipocalypse:latest
```

Then on the VPS (as the `deploy` user):

```bash
podman pull docker.io/<user>/aipocalypse:latest
systemctl --user restart aipocalypse
```

Verify:

```bash
systemctl --user status aipocalypse
curl -s http://localhost:5555 | head -5
```

### Option B: Automatic deployment with podman auto-update

The Quadlet file already includes the `io.containers.autoupdate=registry` label.
Enable the auto-update timer to check for new images periodically:

```bash
systemctl --user enable --now podman-auto-update.timer
```

Check the timer schedule:

```bash
systemctl --user list-timers podman-auto-update.timer
```

By default, `podman-auto-update` runs daily. To check manually:

```bash
# Dry run — see what would be updated
podman auto-update --dry-run

# Actually update
podman auto-update
```

How it works:
1. The timer triggers `podman auto-update`
2. Podman checks Docker Hub for a newer digest of the `latest` tag
3. If the image changed, Podman pulls the new image and restarts the container
4. systemd handles the restart via the Quadlet service

### Post-deploy verification

After any deployment method, verify:

```bash
# Service is running
systemctl --user status aipocalypse

# Container is healthy
podman ps

# App responds
curl -s http://localhost:5555 | head -5

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

For a consistent backup while the app is running, use SQLite's `.backup` command:

```bash
podman exec systemd-aipocalypse bun -e "
  const db = new (require('bun:sqlite').Database)('data/aipocalypse.db');
  db.exec('VACUUM INTO \"/app/data/backup.db\"');
  db.close();
"
cp ~/aipocalypse/data/backup.db ~/backups/aipocalypse-$(date +%Y%m%d-%H%M%S).db
rm ~/aipocalypse/data/backup.db
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
# Edit the Quadlet file to pin a specific tag
sed -i 's|aipocalypse:latest|aipocalypse:v1.0.0|' ~/.config/containers/systemd/aipocalypse.container

# Reload and restart
systemctl --user daemon-reload
systemctl --user restart aipocalypse
```

Remember to change the tag back to `latest` (or the desired version) after the
issue is resolved.

---

## 10. Troubleshooting

### Container won't start

```bash
# Check systemd logs for the service
journalctl --user -u aipocalypse -n 100 --no-pager

# Check if the container exists but failed
podman ps -a | grep aipocalypse

# Verify the env file exists and is readable
ls -la ~/aipocalypse/.env

# Verify the data directory exists
ls -la ~/aipocalypse/data/

# Try running the container manually to see errors
podman run --rm \
  -p 127.0.0.1:5555:5555 \
  -v ~/aipocalypse/data:/app/data:Z \
  --env-file ~/aipocalypse/.env \
  docker.io/<user>/aipocalypse:latest
```

### Port conflict

```bash
# Check what's using port 5555
ss -tlnp | grep 5555
```

### Permission denied on data directory

Rootless Podman maps UIDs into a subordinate range. The container's `bun` user
(UID 1000) may not map to the host's UID 1000.

```bash
# Fix ownership using podman unshare
podman unshare chown -R 1000:1000 ~/aipocalypse/data/
```

### Image pull fails

```bash
# Check authentication
podman login docker.io

# Try pulling manually
podman pull docker.io/<user>/aipocalypse:latest

# Check network connectivity
curl -s https://registry-1.docker.io/v2/ | head -5
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

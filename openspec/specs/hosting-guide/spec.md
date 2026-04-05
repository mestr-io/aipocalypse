## Purpose

Define the deployment and operations guidance for hosting AIPocalypse with Podman, Quadlet, nginx, and related production infrastructure.

## Requirements

### Requirement: Hosting guide covers Podman installation
The guide SHALL include instructions for installing Podman on the VPS and verifying that the installed version supports Quadlet (>= 4.4).

#### Scenario: User installs Podman on Ubuntu 24.04
- **WHEN** the user follows the Podman installation section
- **THEN** Podman is installed and `podman --version` reports a version >= 4.4

### Requirement: Hosting guide covers rootless Podman setup
The guide SHALL include instructions for creating a deploy user, enabling lingering, and configuring rootless Podman for that user.

#### Scenario: User sets up rootless Podman
- **WHEN** the user follows the rootless setup section
- **THEN** a non-root user can run `podman ps` and `systemctl --user status` successfully
- **THEN** the user's services persist after logout via `loginctl enable-linger`

### Requirement: Hosting guide covers building and pushing ARM images
The guide SHALL document how to build an ARM64 container image from the existing Containerfile on a dev machine and push it to Docker Hub.

#### Scenario: User builds and pushes an ARM image
- **WHEN** the user runs the build command on their dev machine
- **THEN** a `linux/arm64` image is created and pushed to Docker Hub

### Requirement: Hosting guide covers app configuration on VPS
The guide SHALL document how to create the data directory, create required Podman secrets for sensitive values, provide non-sensitive configuration, and pull the container image on the VPS.

#### Scenario: User configures the app
- **WHEN** the user follows the configuration section
- **THEN** `~/aipocalypse/data/` exists with correct permissions
- **THEN** the Podman secrets for GitHub client secret, admin password, and hash pepper are created
- **THEN** non-sensitive configuration values required by the container are documented
- **THEN** the container image is pulled and available locally

### Requirement: Hosting guide covers Quadlet systemd setup
The guide SHALL document how to install the Quadlet `.container` file, reload systemd, and start/enable the service.

#### Scenario: User sets up the Quadlet service
- **WHEN** the user copies the Quadlet file and reloads systemd
- **THEN** `systemctl --user start aipocalypse` launches the container
- **THEN** `systemctl --user enable aipocalypse` ensures it starts on boot
- **THEN** `curl localhost:5555` returns a response from the app

### Requirement: Hosting guide covers nginx reverse proxy
The guide SHALL document how to integrate the existing `nginx/aipocalypse.conf` location block into the host's nginx configuration.

#### Scenario: User configures nginx
- **WHEN** the user adds the location block to their nginx server config and reloads
- **THEN** requests to `https://mestr.io/labs/aipocalypse/` are proxied to the container on port 5555

### Requirement: Hosting guide covers TLS with certbot
The guide SHALL document how to set up TLS via certbot with the nginx plugin, noting that this may already be configured for a shared server.

#### Scenario: User sets up TLS
- **WHEN** the user runs certbot for the domain
- **THEN** HTTPS is enabled and auto-renewal is configured

### Requirement: Hosting guide covers deployment workflows
The guide SHALL document manual deployment for version-pinned GHCR images and SHALL NOT require `latest` tags or `podman auto-update`.

#### Scenario: User deploys manually
- **WHEN** a new versioned image is pushed to the registry
- **THEN** the user can update the pinned image tag, pull it, and restart the service to deploy

### Requirement: Hosting guide covers operations
The guide SHALL include a section on common operational tasks: viewing logs, backing up the database, accessing a container shell, restarting the service, and rolling back.

#### Scenario: User views container logs
- **WHEN** the user runs the documented log command
- **THEN** container stdout/stderr is displayed via journalctl

#### Scenario: User backs up the database
- **WHEN** the user follows the backup procedure
- **THEN** a copy of the SQLite database file is saved outside the container volume

### Requirement: Hosting guide covers troubleshooting
The guide SHALL include troubleshooting steps for missing Podman secrets and registry authentication in addition to container startup and permission issues.

#### Scenario: User troubleshoots a failed container
- **WHEN** the container fails to start because a required secret is missing or the image cannot be pulled
- **THEN** the guide provides diagnostic steps to inspect service logs, verify secret creation, and confirm registry authentication

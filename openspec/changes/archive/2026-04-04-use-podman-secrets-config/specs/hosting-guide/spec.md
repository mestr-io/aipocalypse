## MODIFIED Requirements

### Requirement: Hosting guide covers app configuration on VPS
The guide SHALL document how to create the data directory, create required Podman secrets for sensitive values, provide non-sensitive configuration, and pull the container image on the VPS.

#### Scenario: User configures the app
- **WHEN** the user follows the configuration section
- **THEN** `~/aipocalypse/data/` exists with correct permissions
- **THEN** the Podman secrets for GitHub client secret, admin password, and hash pepper are created
- **THEN** non-sensitive configuration values required by the container are documented
- **THEN** the container image is pulled and available locally

### Requirement: Hosting guide covers deployment workflows
The guide SHALL document manual deployment for version-pinned GHCR images and SHALL NOT require `latest` tags or `podman auto-update`.

#### Scenario: User deploys manually
- **WHEN** a new versioned image is pushed to the registry
- **THEN** the user can update the pinned image tag, pull it, and restart the service to deploy

### Requirement: Hosting guide covers troubleshooting
The guide SHALL include troubleshooting steps for missing Podman secrets and registry authentication in addition to container startup and permission issues.

#### Scenario: User troubleshoots a failed container
- **WHEN** the container fails to start because a required secret is missing or the image cannot be pulled
- **THEN** the guide provides diagnostic steps to inspect service logs, verify secret creation, and confirm registry authentication

## MODIFIED Requirements

### Requirement: Quadlet file defines the container image
The Quadlet `.container` file SHALL specify a fully qualified GHCR image reference pinned to an explicit version tag.

#### Scenario: Image reference is resolvable
- **WHEN** systemd processes the Quadlet file
- **THEN** Podman can pull the image specified in the `Image=` directive from GHCR

### Requirement: Quadlet file loads sensitive configuration from Podman secrets
The Quadlet file SHALL mount Podman secrets for `GITHUB_CLIENT_SECRET`, `ADMIN_PASSWORD`, and `HASH_PEPPER`, and SHALL NOT require an environment file containing sensitive values.

#### Scenario: Secret files are mounted for the container
- **WHEN** the container starts through the Quadlet unit
- **THEN** `/run/secrets/aipocalypse_github_client_secret` is available in the container
- **THEN** `/run/secrets/aipocalypse_admin_password` is available in the container
- **THEN** `/run/secrets/aipocalypse_hash_pepper` is available in the container

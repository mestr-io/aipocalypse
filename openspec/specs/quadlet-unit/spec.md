## ADDED Requirements

### Requirement: Quadlet file defines the container image
The Quadlet `.container` file SHALL specify a fully qualified GHCR image reference pinned to an explicit version tag.

#### Scenario: Image reference is resolvable
- **WHEN** systemd processes the Quadlet file
- **THEN** Podman can pull the image specified in the `Image=` directive from GHCR

### Requirement: Quadlet file binds port 5555 to localhost only
The Quadlet file SHALL publish port 5555 bound to 127.0.0.1 only, not to all interfaces.

#### Scenario: Port is bound to localhost
- **WHEN** the container is running
- **THEN** port 5555 is listening on 127.0.0.1 only
- **THEN** the port is NOT accessible from external interfaces

### Requirement: Quadlet file mounts the data volume
The Quadlet file SHALL mount the host data directory into the container at `/app/data` with the `:Z` SELinux relabel flag.

#### Scenario: SQLite database is persisted
- **WHEN** the container writes to `/app/data/aipocalypse.db`
- **THEN** the data is persisted on the host at `~/aipocalypse/data/aipocalypse.db`
- **THEN** the data survives container recreation

### Requirement: Quadlet file loads sensitive configuration from Podman secrets
The Quadlet file SHALL mount Podman secrets for `GITHUB_CLIENT_SECRET`, `ADMIN_PASSWORD`, and `HASH_PEPPER`, and SHALL NOT require an environment file containing sensitive values.

#### Scenario: Secret files are mounted for the container
- **WHEN** the container starts through the Quadlet unit
- **THEN** `/run/secrets/aipocalypse_github_client_secret` is available in the container
- **THEN** `/run/secrets/aipocalypse_admin_password` is available in the container
- **THEN** `/run/secrets/aipocalypse_hash_pepper` is available in the container

### Requirement: Quadlet file configures automatic restart
The Quadlet file SHALL configure systemd to restart the container on failure.

#### Scenario: Container restarts after crash
- **WHEN** the container process exits unexpectedly
- **THEN** systemd restarts the container automatically

### Requirement: Quadlet file uses home-relative paths
The Quadlet file SHALL use `%h` (systemd home directory specifier) for all host paths to work with any deploy user's home directory.

#### Scenario: Paths resolve for any user
- **WHEN** the Quadlet file is used by a user named `deploy` with home `/home/deploy`
- **THEN** `%h/aipocalypse/data` resolves to `/home/deploy/aipocalypse/data`

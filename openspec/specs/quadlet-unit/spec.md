## ADDED Requirements

### Requirement: Quadlet file defines the container image
The Quadlet `.container` file SHALL specify the container image from Docker Hub using a fully qualified image reference.

#### Scenario: Image reference is resolvable
- **WHEN** systemd processes the Quadlet file
- **THEN** Podman can pull the image specified in the `Image=` directive

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

### Requirement: Quadlet file loads environment from file
The Quadlet file SHALL use `EnvironmentFile=` to load environment variables from the host `.env` file.

#### Scenario: Environment variables are available
- **WHEN** the container starts
- **THEN** `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ADMIN_PASSWORD`, and `DATABASE_PATH` are set from the env file

### Requirement: Quadlet file configures automatic restart
The Quadlet file SHALL configure systemd to restart the container on failure.

#### Scenario: Container restarts after crash
- **WHEN** the container process exits unexpectedly
- **THEN** systemd restarts the container automatically

### Requirement: Quadlet file supports auto-update
The Quadlet file SHALL include the `io.containers.autoupdate=registry` label so that `podman auto-update` can detect and pull new images.

#### Scenario: Auto-update detects new image
- **WHEN** `podman auto-update --dry-run` is executed after a new image is pushed
- **THEN** it reports the container as having an available update

### Requirement: Quadlet file uses home-relative paths
The Quadlet file SHALL use `%h` (systemd home directory specifier) for all host paths to work with any deploy user's home directory.

#### Scenario: Paths resolve for any user
- **WHEN** the Quadlet file is used by a user named `deploy` with home `/home/deploy`
- **THEN** `%h/aipocalypse/data` resolves to `/home/deploy/aipocalypse/data`

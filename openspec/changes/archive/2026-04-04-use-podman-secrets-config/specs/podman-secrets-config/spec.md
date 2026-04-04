## ADDED Requirements

### Requirement: Sensitive configuration supports Podman secret files
The system SHALL support loading sensitive configuration values from mounted secret files when the corresponding environment variable is not set.

#### Scenario: Secret file is used as fallback
- **WHEN** `GITHUB_CLIENT_SECRET`, `ADMIN_PASSWORD`, or `HASH_PEPPER` is unset in the environment
- **THEN** the system loads the value from its configured file under `/run/secrets`

#### Scenario: Environment variable takes precedence
- **WHEN** a sensitive configuration value is set in both the environment and the corresponding secret file
- **THEN** the system uses the environment variable value

### Requirement: Missing sensitive configuration fails clearly
The system SHALL fail with a clear error when a required sensitive configuration value is available in neither the environment nor its configured secret file.

#### Scenario: GitHub client secret missing
- **WHEN** `GITHUB_CLIENT_SECRET` is unset and `/run/secrets/aipocalypse_github_client_secret` is unavailable or empty
- **THEN** the system throws an error that identifies `GITHUB_CLIENT_SECRET` as missing

#### Scenario: Admin password missing
- **WHEN** `ADMIN_PASSWORD` is unset and `/run/secrets/aipocalypse_admin_password` is unavailable or empty
- **THEN** the system throws an error that identifies `ADMIN_PASSWORD` as missing

#### Scenario: Hash pepper missing
- **WHEN** `HASH_PEPPER` is unset and `/run/secrets/aipocalypse_hash_pepper` is unavailable or empty
- **THEN** the system throws an error that identifies `HASH_PEPPER` as missing

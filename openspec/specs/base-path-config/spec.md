## Purpose

Define how the application derives and uses a configurable external base path for generated URLs.

## Requirements

### Requirement: Application supports configurable base path
The system SHALL support an `APP_BASE_PATH` configuration value that prefixes all application-generated URLs. When `APP_BASE_PATH` is unset or empty, the system SHALL behave as if the app is mounted at `/`.

#### Scenario: Root deployment remains default
- **WHEN** `APP_BASE_PATH` is unset or empty
- **THEN** generated URLs continue to resolve from the site root without an added prefix

#### Scenario: Path-prefixed deployment uses configured prefix
- **WHEN** `APP_BASE_PATH` is set to `/aipocalypse`
- **THEN** application-generated URLs resolve under `/aipocalypse`

### Requirement: Base path values are normalized
The system SHALL normalize `APP_BASE_PATH` so equivalent values produce the same generated URLs.

#### Scenario: Missing leading slash is normalized
- **WHEN** `APP_BASE_PATH` is set to `aipocalypse`
- **THEN** generated URLs use `/aipocalypse` as the prefix

#### Scenario: Trailing slash is normalized
- **WHEN** `APP_BASE_PATH` is set to `/aipocalypse/`
- **THEN** generated URLs use `/aipocalypse` as the prefix

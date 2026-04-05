## ADDED Requirements

### Requirement: Public pages generate base-path-aware URLs
Public-facing pages SHALL generate navigation links, poll links, form actions, and static asset URLs using the configured application base path.

#### Scenario: Home page links honor base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and a visitor views the home page
- **THEN** the stylesheet URL, site-title link, privacy link, login link, and poll detail links all resolve under `/aipocalypse`

#### Scenario: Poll detail actions honor base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and a visitor views a poll detail page
- **THEN** the back link, login link, and vote form action all resolve under `/aipocalypse`

#### Scenario: Root deployment remains unchanged
- **WHEN** `APP_BASE_PATH` is unset or empty
- **THEN** public page links continue to use root-relative URLs with no added prefix

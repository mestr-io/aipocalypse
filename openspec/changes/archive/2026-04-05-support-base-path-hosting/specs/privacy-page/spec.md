## ADDED Requirements

### Requirement: Privacy page links honor base path
Privacy page navigation, footer links, and login transparency notice links SHALL use the configured application base path.

#### Scenario: Privacy links honor base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and a visitor views the privacy page
- **THEN** the site-title link, footer privacy link, and login notice link resolve under `/aipocalypse`

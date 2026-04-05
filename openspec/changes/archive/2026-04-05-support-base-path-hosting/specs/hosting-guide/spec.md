## ADDED Requirements

### Requirement: Hosting guide covers path-prefixed deployment
The guide SHALL document how to deploy the app under a path prefix such as `https://labs.mestr.io/aipocalypse/`, including nginx proxy configuration and required application configuration.

#### Scenario: User configures prefixed hosting
- **WHEN** the user follows the path-prefixed hosting guidance
- **THEN** nginx proxies `/aipocalypse/` to the app
- **THEN** the app is configured with `APP_BASE_PATH=/aipocalypse`
- **THEN** generated links and OAuth callbacks resolve correctly under the prefixed URL

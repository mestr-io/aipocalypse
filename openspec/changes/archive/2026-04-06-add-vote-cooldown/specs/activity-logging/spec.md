## ADDED Requirements

### Requirement: Vote cooldown rejections are logged
The system SHALL log vote requests rejected by the vote cooldown policy as structured JSON lines. The log entry SHALL use action `user.vote.rejected.cooldown` and include the poll ID and the user's hashed ID.

#### Scenario: Cooldown rejection is logged
- **WHEN** an authenticated user's vote request is rejected because fewer than 5 seconds have elapsed since their last vote write on that poll
- **THEN** a log entry is written with action `user.vote.rejected.cooldown`
- **AND** the metadata includes `pollId` and `userId`

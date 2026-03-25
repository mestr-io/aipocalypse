## Context

Pure copy change — replacing static strings in template files. No logic, no data model, no API changes. All modifications are in `src/views/` template literals and the seed script.

## Goals / Non-Goals

**Goals:**
- Fix the one typo (seed date `2925` → `2025`)
- Replace generic placeholder copy with punchy, thematic text that matches the AoC terminal personality
- Keep copy consistent across pages (e.g., "predictions" not "polls" in public-facing text)

**Non-Goals:**
- No admin panel copy changes (intentionally functional/plain)
- No i18n or copy externalization
- No changes to error messages or technical strings

## Decisions

### 1. "Predictions" vocabulary in public UI

**Choice:** Shift public-facing language from "polls/votes" toward "predictions/bets" where it enhances personality. Keep "vote"/"votes" for factual count labels since they're accurate.

**Rationale:** The site is about predicting the future — "predictions" is more evocative than "polls". But the count labels ("42 votes") are factual and don't benefit from renaming.

### 2. Seed data fix is included

**Choice:** Fix the `2925-04-15` date in the seed script even though it's not production data.

**Rationale:** Seed data shows up in dev/demo environments. A date 900 years in the future undermines credibility during demos.

## Risks / Trade-offs

- **[Tone may not land with all users]** → The copy leans playful ("placing bets", "mass-produce mediocre code"). This matches the AoC homage spirit. Can always soften later.
- **[Existing screenshots/docs may reference old copy]** → Low risk, no external docs reference specific strings.

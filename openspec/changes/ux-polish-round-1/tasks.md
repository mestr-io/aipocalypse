## 1. Remove links from poll list cards

- [x] 1.1 Remove `renderLinks` import and call from `renderCard()` in `src/views/poll-list.ts`
- [x] 1.2 Remove `links`-related test cases from `src/views/poll-list.test.ts` (poll card link rendering scenarios)
- [x] 1.3 Verify remaining poll-list tests pass with `bun test src/views/poll-list.test.ts`

## 2. Restyle poll detail context links

- [x] 2.1 Add `.poll-links a` CSS rule to `src/public/style.css` — color `#5e8c61`, hover `#00cc00`
- [x] 2.2 Add `.poll-links-section` CSS rule for spacing (margin-top)
- [x] 2.3 Update poll-detail link rendering tests to verify dimmed link class is present
- [x] 2.4 Verify poll-detail tests pass with `bun test src/views/poll-detail.test.ts`

## 3. Bulk voted polls query

- [x] 3.1 Add `getUserVotedPollIds(userId: number): number[]` to `src/db/queries/votes.ts` — `SELECT DISTINCT pollId FROM votes WHERE userId = ?`
- [x] 3.2 Write tests for `getUserVotedPollIds` in `src/db/queries/votes.test.ts` — user with votes, user with no votes, multiple polls
- [x] 3.3 Verify votes query tests pass with `bun test src/db/queries/votes.test.ts`

## 4. Voted badge on poll list cards

- [x] 4.1 Update `pollListPage()` signature in `src/views/poll-list.ts` to accept optional `votedPollIds: Set<number>`
- [x] 4.2 Update `renderCard()` to accept optional `voted?: boolean` parameter and render `<span class="voted-badge">[voted]</span>` on the meta row when true
- [x] 4.3 Update `GET /` route in `src/index.ts` — call `getUserVotedPollIds` for authenticated users, pass resulting `Set<number>` to `pollListPage()`
- [x] 4.4 Add `.voted-badge` CSS rule to `src/public/style.css` — color `#5e8c61`, font-size `0.9em`
- [x] 4.5 Write tests for voted badge rendering in `src/views/poll-list.test.ts` — badge shown when voted, no badge when not voted, no badge when no votedPollIds passed
- [x] 4.6 Verify poll-list tests pass with `bun test src/views/poll-list.test.ts`

## 5. Account page section spacing

- [ ] 5.1 Add CSS rule for account page `.section-heading` margin — `margin-top: 2rem` in `src/public/style.css`
- [ ] 5.2 Verify account page renders correctly (visual check or existing tests)

## 6. Delete slide-reveal

- [ ] 6.1 Add `.delete-slide`, `.delete-slide-track`, `#delete-toggle`, and `.btn-danger` CSS rules to `src/public/style.css`
- [ ] 6.2 Replace the `confirm()` form in `src/views/account.ts` with the checkbox slide-reveal HTML structure
- [ ] 6.3 Update `src/views/account.test.ts` — test that slide-reveal elements are present, confirm dialog `onsubmit` is removed, form action is preserved
- [ ] 6.4 Verify account tests pass with `bun test src/views/account.test.ts`

## 7. Full test suite

- [ ] 7.1 Run `bun test` and verify all tests pass

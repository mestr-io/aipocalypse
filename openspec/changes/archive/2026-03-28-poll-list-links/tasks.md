## 1. Database Layer

- [x] 1.1 Add `links: string` to the `ActivePollRow` interface in `src/db/queries/polls.ts`
- [x] 1.2 Add `p.links` to the SELECT clause in `listPublicPolls()`
- [x] 1.3 Add `p.links` to the SELECT clause in `listActivePolls()`

## 2. Poll List View

- [x] 2.1 Import `renderLinks` from `src/views/poll-detail.ts` in `src/views/poll-list.ts`
- [x] 2.2 Add `renderLinks(p.links)` call in `renderCard()` between the body preview and the meta row

## 3. Tests

- [x] 3.1 Add tests for `listPublicPolls()` returning the `links` field
- [x] 3.2 Add tests for `renderCard()` rendering with and without links
- [x] 3.3 Run full test suite (`bun test`) and fix any failures

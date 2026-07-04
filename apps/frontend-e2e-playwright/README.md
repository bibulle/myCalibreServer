# frontend-e2e-playwright

A **read-only** e2e suite using Playwright instead of Cypress, covering flows
that don't require a user account and therefore don't need a running
MongoDB instance:

- Application loading, page title, responsive viewports
- API health/version checks
- Protected routes correctly rejecting unauthenticated requests

## Why a second e2e suite?

The existing Cypress suite (`apps/frontend-e2e`) already requires a running
local MongoDB (`run-e2e-tests.sh` checks for `mongod` and asks you to start
it) for its authenticated flows (login, books/series/authors/tags browsing,
ratings, downloads — see `authentication.spec.ts`, `books.spec.ts`,
`series-authors.spec.ts`). Those are **not** duplicated here.

This suite exists for environments where MongoDB isn't available at all
(e.g. sandboxed CI runners), so the non-authenticated flows can still be
verified. It is a complement to the Cypress suite, not a replacement -
run both where MongoDB is available.

## Running

```bash
npm run e2e:playwright
```

This starts the API (pointed at the repo's test Calibre database,
`test/data/calibre`) and the frontend dev server automatically, then runs
the tests against them.

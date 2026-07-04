# frontend-e2e-playwright

The e2e suite for this workspace, using Playwright. It runs against the real
API and frontend dev servers and covers:

- Application loading, page title, responsive viewports
- API health/version checks
- Authentication (login, admin role, protected routes, invalid tokens)
- Books, series, authors, and tags browsing, search, filtering, sorting
- Book ratings

## No MongoDB required, anywhere

The API's `mongodb` driver is swapped for a small in-memory stub (see
`mongo-stub/`) via a Node `--require` hook, so this suite needs no running
MongoDB instance - locally or in CI. The stub pre-seeds a `users` collection
with two fixture accounts (`testuser` / `adminuser`, password `password123`
for both - see `mongo-stub/fixtures.js`) and implements just enough of the
driver's query surface (`find().sort().toArray()`, `findOne`, `replaceOne`,
`deleteOne`) for `MyCalibreDbService` to work against it exactly as it would
against a real MongoDB: login, rating a book, and download-history tracking
all persist for the lifetime of the test run.

This only works because `mongodb` is excluded from the API's webpack bundle
(see `apps/api/webpack.config.js`'s `externals`), so it stays a real runtime
`require()` that the hook can intercept - it is not wired into the app or
its production build by any other means.

Real MongoDB integration (actual driver behavior, not the stub) is instead
covered by `apps/api/src/app/database/my-calibre-db.service.spec.ts`, a unit
test that auto-detects a local MongoDB and skips itself if none is
available. CI runs it against a real `mongo:7` service container.

## Running

```bash
npm run e2e:playwright
```

This starts the API (pointed at the repo's test Calibre database,
`test/data/calibre`) and the frontend dev server automatically, then runs
the tests against them.

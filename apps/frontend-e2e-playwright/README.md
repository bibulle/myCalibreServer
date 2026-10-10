# frontend-e2e-playwright

The e2e suite for this workspace, using Playwright. It runs against the real
API and frontend dev servers and covers:

- Application loading, page title, responsive viewports
- API health/version checks
- Authentication (login, admin role, protected routes, invalid tokens)
- Books, series, authors, and tags browsing, search, filtering, sorting
- Book ratings

Most of the above (`app.spec.ts`, `authentication.spec.ts`, `books.spec.ts`,
`series-authors-tags.spec.ts`, `api-readonly.spec.ts`) drive the API directly
over HTTP rather than through the browser UI. The `ui-*.spec.ts` files
complement that with real, browser-driven interaction through the rendered
"Reliure" UI:

- `ui-auth.spec.ts` - login/signup/logout through the actual forms
- `ui-navigation.spec.ts` - header nav tabs, search box, theme toggle, sort menu
- `ui-book-detail.spec.ts` - opening a book, rating it, author/tag pill links,
  and the download/Kindle affordances for a PDF-only book, a multi-format book
  and the Kindle dialog
- `ui-library-lists.spec.ts` - series volumes, author accordion, tag filtering
- `ui-profile.spec.ts` - identity banner, admin-only button, linked-accounts
  buttons, password field validation states
- `ui-admin.spec.ts` - access control, sorting, the expandable read-only
  summary row, merge selection toggle, and a dedicated `deletableuser`
  fixture's full lifecycle (profile edit, Kindle address, password change,
  admin toggle, delete)
- `ui-news-home.spec.ts` - grouped news/home sections and opening a book from
  a row

The `ui-admin.spec.ts` lifecycle test intentionally does not click the admin
"Reset password" button (it emails via a real, unconfigured SMTP dependency)
or the OAuth "Connect" buttons (they open a real external popup with no
configured OAuth credentials in this environment) - only their presence is
checked. It also doesn't complete a real user merge, only the select/unselect
toggle. It types the firstname field but doesn't assert that the debounced
autosave commits: `UserService` polls `checkAuthent()` every 3 seconds for the
lifetime of the page and unconditionally rebuilds the in-memory user object
from the JWT, which can race the 500ms autosave debounce and drop an in-flight
edit before it reaches the backend - a pre-existing timing issue in the app,
out of scope for this test-coverage change.

## Two independent sets of book fixtures

The book **detail** page reads the real Calibre database at
`test/data/calibre/metadata.db`, while the **list** pages are served from the
pre-built cache files in `test/data/my-calibre/cache/`. Those two fixtures hold
different books on purpose - the cache carries a couple of synthetic
`Test Book` entries, the database the real sample library - so a test has to
know which one it exercises: `page.goto('/book/<id>')` uses the database,
clicking through the library list uses the cache.

`CacheService` rebuilds a cache file when `metadata.db` is *newer* than it
(`cache.service.ts`, `getCachePath`). A fresh checkout gives both roughly the
same mtime, so nothing is rebuilt in CI; but editing `metadata.db` locally does
trigger a rebuild, which overwrites the committed cache files with the database
content and breaks the list-based tests. If that happens, restore them with
`git checkout -- test/data/my-calibre/cache/` and `touch` them so they are
newer than the database again.

Book `99001` ("Manuel PDF seulement") exists in `metadata.db` with a PDF and no
other format, as the fixture for issue #255.

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

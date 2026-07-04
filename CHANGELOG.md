# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.12.13](https://github.com/bibulle/myCalibreServer/compare/v0.12.12...v0.12.13) (2026-07-04)

### 0.12.12 (2026-07-04)


### Features

* **e2e:** Complete E2E test infrastructure with 76/88 passing tests ([722dea4](https://github.com/bibulle/myCalibreServer/commit/722dea42f3c528e3e4a5e7adf85cd1a69e5c1293))
* improve local start ([9af63ed](https://github.com/bibulle/myCalibreServer/commit/9af63eda858683bd2ccf5218a817c5e608b8a26d))
* migrate calibre isbn field to identifiers table ([913c1c2](https://github.com/bibulle/myCalibreServer/commit/913c1c2641ef2e05a1fe204e79f780f7523978f1))
* standardize error handling across backend and frontend ([#133](https://github.com/bibulle/myCalibreServer/issues/133)) ([73b54c9](https://github.com/bibulle/myCalibreServer/commit/73b54c98b84773b77067622249094f675380e854))


### Bug Fixes

* include series name in downloaded file title ([#36](https://github.com/bibulle/myCalibreServer/issues/36)) ([dcb0f22](https://github.com/bibulle/myCalibreServer/commit/dcb0f22ba87f0074bec98d80215aee8ec6d6c64d))
* limit DockerHub push and DevOps config editing to master branch ([#150](https://github.com/bibulle/myCalibreServer/issues/150)) ([9bfd064](https://github.com/bibulle/myCalibreServer/commit/9bfd0648607b734f32d5ad780fdccb38fbdf35c7))
* migrate Sass [@import](https://github.com/import) to @use/[@forward](https://github.com/forward) to remove deprecation warnings ([#149](https://github.com/bibulle/myCalibreServer/issues/149)) ([c571085](https://github.com/bibulle/myCalibreServer/commit/c571085b5bd9bde70f50adfa31ea414a13829325))
* prevent sharp composite crash on stale/oversized series thumbnails ([#188](https://github.com/bibulle/myCalibreServer/issues/188)) ([ae4d557](https://github.com/bibulle/myCalibreServer/commit/ae4d55738f1615d410877d9b54ecd77d4319b699))
* reload user from DB before save in addRatingBook and updateLastConnection ([ffca081](https://github.com/bibulle/myCalibreServer/commit/ffca08116c2e630b2af115f7c3bd238321efd8e6)), closes [#139](https://github.com/bibulle/myCalibreServer/issues/139)
* resolve all npm security vulnerabilities and remove unused dependencies ([4f018a1](https://github.com/bibulle/myCalibreServer/commit/4f018a1af5bee1c6e13933a3332f67c2e075ccf3))
* suppress webpack warnings for optional dependencies ([3791b18](https://github.com/bibulle/myCalibreServer/commit/3791b18002cd818d6eedebe932b12256fa20cfa8))
* switch GitHub MCP server to official Docker-based server ([#186](https://github.com/bibulle/myCalibreServer/issues/186)) ([4d2fa62](https://github.com/bibulle/myCalibreServer/commit/4d2fa624292ac68dd3efd3e9cfc231c70a5b05ff))
* update HTTP 304 response handling for NestJS compatibility ([070fc94](https://github.com/bibulle/myCalibreServer/commit/070fc94b32da61a1e9a1877a5e5f0cee0ab91faa))


### Code Refactoring

* **api:** convert Promise constructor to async/await in mail.service.ts ([a3f23a3](https://github.com/bibulle/myCalibreServer/commit/a3f23a34217bfadb825fe22c1ee917da535bba10)), closes [#130](https://github.com/bibulle/myCalibreServer/issues/130)
* **api:** convert Promise constructors to async/await in authentication.controller.ts ([ddbe62e](https://github.com/bibulle/myCalibreServer/commit/ddbe62e497ff8a32e5d1b20a8d9e51c593be6add)), closes [#130](https://github.com/bibulle/myCalibreServer/issues/130)
* **api:** convert Promise constructors to async/await in books and series services ([0eafd19](https://github.com/bibulle/myCalibreServer/commit/0eafd19733c9857b8af429bd9cde03c7ebe8bb44)), closes [#130](https://github.com/bibulle/myCalibreServer/issues/130)
* **api:** convert Promise constructors to async/await in books.controller.ts ([6dfcd3f](https://github.com/bibulle/myCalibreServer/commit/6dfcd3f1f821475286df9b914e961000e8169177)), closes [#130](https://github.com/bibulle/myCalibreServer/issues/130)
* **api:** convert Promise constructors to async/await in books.service.ts ([5d2e92b](https://github.com/bibulle/myCalibreServer/commit/5d2e92ba3f85e7e3bfa9a3f3a751dda23e86ed25)), closes [#130](https://github.com/bibulle/myCalibreServer/issues/130)
* **api:** convert Promise constructors to async/await in controllers ([8184af0](https://github.com/bibulle/myCalibreServer/commit/8184af0c97b26ccd1d4eb4a514fab96415367aac)), closes [#130](https://github.com/bibulle/myCalibreServer/issues/130)
* **api:** convert Promise constructors to async/await in users.controller.ts ([45fec6c](https://github.com/bibulle/myCalibreServer/commit/45fec6c12c3e49e7bfa27ae23e984c62acd6d997)), closes [#130](https://github.com/bibulle/myCalibreServer/issues/130)
* **api:** convert Promise constructors to async/await in users.service.ts ([4ab62a6](https://github.com/bibulle/myCalibreServer/commit/4ab62a6a3ad74f85438a75bd5b3ce7652d9b9789)), closes [#130](https://github.com/bibulle/myCalibreServer/issues/130)
* upgrade to Angular 21, NestJS 11, Nx 22 and Node.js 24 LTS ([47e4ed5](https://github.com/bibulle/myCalibreServer/commit/47e4ed59b1bf0fb58c04c9a9b5553aaa74edea4b))


### Tests

* Add all controller tests - 87 tests total (all passing) ([46aa95d](https://github.com/bibulle/myCalibreServer/commit/46aa95d50d76066a51098adcdefefb22f62462d5))
* Add AuthorsController tests - all 4 tests passing ([579c1e8](https://github.com/bibulle/myCalibreServer/commit/579c1e8a6929807caaf8326adcb28198e5e99cfe))
* Add comprehensive AppComponent tests - all 28 tests passing ([aee3007](https://github.com/bibulle/myCalibreServer/commit/aee30077a394099d214e3c3c0cbb7df272c4b851))
* Add comprehensive FilterBarComponent tests ([68d4f30](https://github.com/bibulle/myCalibreServer/commit/68d4f30507d69262b6144142b8418f1bb56f5896))
* Add comprehensive FilterService tests ([a888936](https://github.com/bibulle/myCalibreServer/commit/a888936174c5d51ee88601b00e15ebbd2d70326f))
* Add comprehensive HomeComponent tests ([0da3f6d](https://github.com/bibulle/myCalibreServer/commit/0da3f6d2fd68571d5c2b1dd07caa686c2f22b3e1))
* Add comprehensive ImageSpritesComponent tests ([41f9b5a](https://github.com/bibulle/myCalibreServer/commit/41f9b5a0b0158edd7a39e190c2bdca769af7019e))
* Add comprehensive MatRatingComponent tests ([00a2017](https://github.com/bibulle/myCalibreServer/commit/00a2017b6c5db99a24d4d4fc509d84031a757ed4))
* Add comprehensive NotificationService tests ([33db9fc](https://github.com/bibulle/myCalibreServer/commit/33db9fcf64a37244466ea831b97321106bf889ce))
* Add comprehensive tests for BooksController ([71e2c45](https://github.com/bibulle/myCalibreServer/commit/71e2c4580dc9f08d9a8348cc51ca51d4b03dfb6a)), closes [#129](https://github.com/bibulle/myCalibreServer/issues/129)
* Add comprehensive TitleService tests ([0621589](https://github.com/bibulle/myCalibreServer/commit/0621589c1bde445df5fe81908dbb4fe72d69e246))
* Add comprehensive unit tests for BooksService ([#129](https://github.com/bibulle/myCalibreServer/issues/129)) ([f3c7ae6](https://github.com/bibulle/myCalibreServer/commit/f3c7ae6d9c4af1167f2e1588e5e430db15740784))
* Add comprehensive unit tests for CalibreDb1Service with real SQLite test database ([126d321](https://github.com/bibulle/myCalibreServer/commit/126d321f96056a498a8a0208a8e0b5007f3b2d9e)), closes [#129](https://github.com/bibulle/myCalibreServer/issues/129)
* Add comprehensive unit tests for UsersService ([#129](https://github.com/bibulle/myCalibreServer/issues/129)) ([404b2ed](https://github.com/bibulle/myCalibreServer/commit/404b2edc8b5962e09d3541aa540ec2d31da3acca))
* Add comprehensive UserService tests ([4bce344](https://github.com/bibulle/myCalibreServer/commit/4bce34422e512eae3c186fcf977db1aea66032af))
* Add FooterComponent tests ([0f0a37c](https://github.com/bibulle/myCalibreServer/commit/0f0a37ceee0fdd11095f9142e60861ccb22cb0aa))
* Add MatContentDirective tests ([36ee0c7](https://github.com/bibulle/myCalibreServer/commit/36ee0c745e5bfc430eaa3a7521b9fd9af5ada347))
* Add MongoDB test database infrastructure for MyCalibreDbService ([ecd4ead](https://github.com/bibulle/myCalibreServer/commit/ecd4ead55522d0c8e1d9593620dcefc51ed58ef8)), closes [#129](https://github.com/bibulle/myCalibreServer/issues/129)
* Add NotFoundComponent tests ([9764130](https://github.com/bibulle/myCalibreServer/commit/9764130566810fd23e00bbac48d0079b8444a467))
* add read-only Playwright e2e suite for MongoDB-less environments ([#195](https://github.com/bibulle/myCalibreServer/issues/195)) ([bc8db97](https://github.com/bibulle/myCalibreServer/commit/bc8db9765289dbb16ab142cb0523e24f6a508112))
* Add SeriesController tests - all 10 tests passing ([599773b](https://github.com/bibulle/myCalibreServer/commit/599773b12be1afb9bd0912bbfaf60bbef7d814e5))
* Add TagsController tests - all 4 tests passing ([a99a934](https://github.com/bibulle/myCalibreServer/commit/a99a934c8c0b79338cabcd8521334da1860f9ac3))
* Add unit tests for VersionService and SeriesService ([#129](https://github.com/bibulle/myCalibreServer/issues/129)) ([6f5d0d1](https://github.com/bibulle/myCalibreServer/commit/6f5d0d199aab72880f0f8caf1a7d5b8938a6c90c))
* Add UsersController tests - all 20 tests passing ([08ce759](https://github.com/bibulle/myCalibreServer/commit/08ce75949aa7c73378fe305b0826276bea29c483))
* Complete BooksController tests - all 25 tests passing ([01e8453](https://github.com/bibulle/myCalibreServer/commit/01e8453f3fa3b418a14dd5044729c0c481ec494d)), closes [#129](https://github.com/bibulle/myCalibreServer/issues/129)
* Fix NavigationService TypeScript errors and enhance tests ([174c9fb](https://github.com/bibulle/myCalibreServer/commit/174c9fb1e958377171c1cd5eed781917abb3ec2e))
* make the mongo-stub real and remove Cypress in favor of Playwright ([#197](https://github.com/bibulle/myCalibreServer/issues/197)) ([95d4561](https://github.com/bibulle/myCalibreServer/commit/95d4561b9cef28cdc655dacb5a746de047986430))
* raise frontend/backend coverage and fix tooling gaps ([#194](https://github.com/bibulle/myCalibreServer/issues/194)) ([7182ac9](https://github.com/bibulle/myCalibreServer/commit/7182ac97fb7614e787ea2c822336ecb2d9ab3c97))

### [0.12.11](https://github.com/bibulle/myCalibreServer/compare/v0.12.9...v0.12.11) (2026-07-04)


### Tests

* make the mongo-stub real and remove Cypress in favor of Playwright ([5e1742f](https://github.com/bibulle/myCalibreServer/commit/5e1742f006c0f53a1508338b07c7480df96d2297))

### [0.12.10](https://github.com/bibulle/myCalibreServer/compare/v0.12.9...v0.12.10) (2026-07-04)


### Bug Fixes

* provide dummy OAuth env vars for CI Playwright e2e webServer ([a0f0b7b](https://github.com/bibulle/myCalibreServer/commit/a0f0b7ba29b5a4fe7372d1e28fbe6f24b8f8b0f4))


### Tests

* skip all MyCalibreDbService integration tests when MongoDB is unavailable ([68d4f93](https://github.com/bibulle/myCalibreServer/commit/68d4f931b890d919bfba663378444c735533f1f2))

### [0.12.9](https://github.com/bibulle/myCalibreServer/compare/v0.12.8...v0.12.9) (2026-07-04)


### Bug Fixes

* don't hardcode the sandbox Chromium path for local Playwright runs ([520987b](https://github.com/bibulle/myCalibreServer/commit/520987bb03dacda10adb3ac938d3e7b0ac8e2919))


### Tests

* add read-only Playwright e2e suite for MongoDB-less environments ([7e61e90](https://github.com/bibulle/myCalibreServer/commit/7e61e90a5c57ad14beead4dac3b6b86963c5c155))

### [0.12.8](https://github.com/bibulle/myCalibreServer/compare/v0.12.7...v0.12.8) (2026-07-04)


### Tests

* raise frontend/backend coverage and fix tooling gaps ([8020511](https://github.com/bibulle/myCalibreServer/commit/80205117cb8e4c1d846d17a5292ba7f2b2d7d8fb))

### [0.12.7](https://github.com/bibulle/myCalibreServer/compare/v0.12.6...v0.12.7) (2026-07-04)


### Bug Fixes

* prevent sharp composite crash on stale/oversized series thumbnails ([#188](https://github.com/bibulle/myCalibreServer/issues/188)) ([ae4d557](https://github.com/bibulle/myCalibreServer/commit/ae4d55738f1615d410877d9b54ecd77d4319b699))
* switch GitHub MCP server to official Docker-based server ([#186](https://github.com/bibulle/myCalibreServer/issues/186)) ([4d2fa62](https://github.com/bibulle/myCalibreServer/commit/4d2fa624292ac68dd3efd3e9cfc231c70a5b05ff))

### [0.12.6](https://github.com/bibulle/myCalibreServer/compare/v0.12.5...v0.12.6) (2026-03-06)


### Bug Fixes

* limit DockerHub push and DevOps config editing to master branch ([#150](https://github.com/bibulle/myCalibreServer/issues/150)) ([9bfd064](https://github.com/bibulle/myCalibreServer/commit/9bfd0648607b734f32d5ad780fdccb38fbdf35c7))

### [0.12.5](https://github.com/bibulle/myCalibreServer/compare/v0.12.4...v0.12.5) (2026-03-06)


### Bug Fixes

* migrate Sass [@import](https://github.com/import) to @use/[@forward](https://github.com/forward) to remove deprecation warnings ([#149](https://github.com/bibulle/myCalibreServer/issues/149)) ([c571085](https://github.com/bibulle/myCalibreServer/commit/c571085b5bd9bde70f50adfa31ea414a13829325))

### [0.12.4](https://github.com/bibulle/myCalibreServer/compare/v0.12.3...v0.12.4) (2026-03-06)


### Features

* standardize error handling across backend and frontend ([#133](https://github.com/bibulle/myCalibreServer/issues/133)) ([73b54c9](https://github.com/bibulle/myCalibreServer/commit/73b54c98b84773b77067622249094f675380e854))

### [0.12.3](https://github.com/bibulle/myCalibreServer/compare/v0.12.2...v0.12.3) (2026-03-05)


### Bug Fixes

* include series name in downloaded file title ([#36](https://github.com/bibulle/myCalibreServer/issues/36)) ([dcb0f22](https://github.com/bibulle/myCalibreServer/commit/dcb0f22ba87f0074bec98d80215aee8ec6d6c64d))
* reload user from DB before save in addRatingBook and updateLastConnection ([ffca081](https://github.com/bibulle/myCalibreServer/commit/ffca08116c2e630b2af115f7c3bd238321efd8e6)), closes [#139](https://github.com/bibulle/myCalibreServer/issues/139)

### [0.12.2](https://github.com/bibulle/myCalibreServer/compare/v0.12.1...v0.12.2) (2026-03-05)


### Bug Fixes

* resolve all npm security vulnerabilities and remove unused dependencies ([4f018a1](https://github.com/bibulle/myCalibreServer/commit/4f018a1af5bee1c6e13933a3332f67c2e075ccf3))

### [0.12.1](https://github.com/bibulle/myCalibreServer/compare/v0.12.0...v0.12.1) (2026-03-04)


### Features

* migrate calibre isbn field to identifiers table ([913c1c2](https://github.com/bibulle/myCalibreServer/commit/913c1c2641ef2e05a1fe204e79f780f7523978f1))

## [0.12.0](https://github.com/bibulle/myCalibreServer/compare/v0.11.1...v0.12.0) (2026-03-04)


### Features

* improve local start ([9af63ed](https://github.com/bibulle/myCalibreServer/commit/9af63eda858683bd2ccf5218a817c5e608b8a26d))


### Code Refactoring

* upgrade to Angular 21, NestJS 11, Nx 22 and Node.js 24 LTS ([47e4ed5](https://github.com/bibulle/myCalibreServer/commit/47e4ed59b1bf0fb58c04c9a9b5553aaa74edea4b))

### [0.11.1](https://github.com/bibulle/myCalibreServer/compare/v0.11.0...v0.11.1) (2025-11-01)


### Bug Fixes

* suppress webpack warnings for optional dependencies ([3791b18](https://github.com/bibulle/myCalibreServer/commit/3791b18002cd818d6eedebe932b12256fa20cfa8))
* update HTTP 304 response handling for NestJS compatibility ([070fc94](https://github.com/bibulle/myCalibreServer/commit/070fc94b32da61a1e9a1877a5e5f0cee0ab91faa))

## [0.11.0](https://github.com/bibulle/myCalibreServer/compare/v0.10.4...v0.11.0) (2025-11-01)


### Features

* **e2e:** Complete E2E test infrastructure with 76/88 passing tests ([722dea4](https://github.com/bibulle/myCalibreServer/commit/722dea42f3c528e3e4a5e7adf85cd1a69e5c1293))


### Bug Fixes

* **health:** optimize health check performance and reliability ([f8b1b21](https://github.com/bibulle/myCalibreServer/commit/f8b1b21784fcfb93842a88798c929b75eaa78693)), closes [#138](https://github.com/bibulle/myCalibreServer/issues/138)


### Code Refactoring

* **api:** convert Promise constructors to async/await pattern ([#130](https://github.com/bibulle/myCalibreServer/issues/130))
  * Refactored ~28 methods across services and controllers
  * Improved code readability and maintainability
  * All 231 tests passing

### [0.10.4](https://github.com/bibulle/myCalibreServer/compare/v0.10.3...v0.10.4) (2025-08-19)


### Bug Fixes

* Add cache for books count ([3567d18](https://github.com/bibulle/myCalibreServer/commit/3567d18253e40de799774b5b9fade485afd3e6d3))

### [0.10.3](https://github.com/bibulle/myCalibreServer/compare/v0.10.2...v0.10.3) (2025-08-19)

### [0.10.2](https://github.com/bibulle/myCalibreServer/compare/v0.10.1...v0.10.2) (2025-08-19)

### [0.10.1](https://github.com/bibulle/myCalibreServer/compare/v0.10.0...v0.10.1) (2025-08-19)

## [0.10.0](https://github.com/bibulle/myCalibreServer/compare/v0.9.7...v0.10.0) (2023-10-31)


### Bug Fixes

* npm audit ([38651bc](https://github.com/bibulle/myCalibreServer/commit/38651bc8bfe11e33327fc3bf8ee290fb84220a0e))
* try to not cache the APIs in the worker ([6ff4906](https://github.com/bibulle/myCalibreServer/commit/6ff490658fbce732e48054a72c5a24d009c0c9ea))
* try to remove ngsw for some api ([80d2a2d](https://github.com/bibulle/myCalibreServer/commit/80d2a2d7327b3be9a6738b5c4d1529dbb9b47085))

### [0.9.7](https://github.com/bibulle/myCalibreServer/compare/v0.9.6...v0.9.7) (2023-05-10)


### Features

* add auto complete on login form ([27eff34](https://github.com/bibulle/myCalibreServer/commit/27eff34cd7a5306cba08a66d6e149bb3b3a0051f))


### Bug Fixes

* downloaded book list cannot be undefined ([6c00718](https://github.com/bibulle/myCalibreServer/commit/6c00718cea1822825cf5229487b8df8c3742b018))
* reenable worker ([39362c9](https://github.com/bibulle/myCalibreServer/commit/39362c91322809e8e52c638a8de170a88a2ed26f))

### [0.9.6](https://github.com/bibulle/myCalibreServer/compare/v0.9.5...v0.9.6) (2023-05-10)


### Bug Fixes

* try to disable service worker (create issue with authentication) ([5b08113](https://github.com/bibulle/myCalibreServer/commit/5b081132b184f86625759f4a74355fd998df7d63))

### [0.9.5](https://github.com/bibulle/myCalibreServer/compare/v0.9.4...v0.9.5) (2023-05-03)


### Bug Fixes

* correct some warnings ([8bddd28](https://github.com/bibulle/myCalibreServer/commit/8bddd2878a19b0be00d00266ea79969fb8d21e9e))
* pwa disabled for authentification ([8c47705](https://github.com/bibulle/myCalibreServer/commit/8c47705d50ed89bb0b428031f47a2990d1c5039c))

### [0.9.4](https://github.com/bibulle/myCalibreServer/compare/v0.9.3...v0.9.4) (2023-03-23)


### Features

* add service worker ([f84ba6f](https://github.com/bibulle/myCalibreServer/commit/f84ba6f712f0cabd8d3be8a35bb6f1953efc729f))


### Bug Fixes

* rechange favicon ([9aa2b7d](https://github.com/bibulle/myCalibreServer/commit/9aa2b7def99d1b1922ecba3d5a6bbaf609ddddca))
* try another manifest ([273dd0e](https://github.com/bibulle/myCalibreServer/commit/273dd0efaf828c6b19ed4b735fb3446439a36865))

### [0.9.3](https://github.com/bibulle/myCalibreServer/compare/v0.9.2...v0.9.3) (2023-03-23)


### Features

* change bib icon ([c6c4425](https://github.com/bibulle/myCalibreServer/commit/c6c442514cc961adbc7708871e008cbd625d48c4))

### [0.9.2](https://github.com/bibulle/myCalibreServer/compare/v0.9.1...v0.9.2) (2023-03-22)


### Bug Fixes

* change icon background color ([e63e803](https://github.com/bibulle/myCalibreServer/commit/e63e8039e43b590db35ed0dd859f52d19210151b))

### [0.9.1](https://github.com/bibulle/myCalibreServer/compare/v0.8.0...v0.9.1) (2023-01-28)


### Features

* add controller to get sprites (fixes [#104](https://github.com/bibulle/myCalibreServer/issues/104)) ([8f01644](https://github.com/bibulle/myCalibreServer/commit/8f01644cd4893cf60ce12c52f550d57a771a8844))
* add sprites to series ([6a934bc](https://github.com/bibulle/myCalibreServer/commit/6a934bc68a088d02fad10ed9c4a251b6a8e2ff3e))
* replace thumbnail image with sprite in frontend ([4f66c83](https://github.com/bibulle/myCalibreServer/commit/4f66c835218539e1e2afebe46b87dd8afbdabded))


### Bug Fixes

* add some new vocabulary ([7f7596d](https://github.com/bibulle/myCalibreServer/commit/7f7596d10366dc252c20d150140059d9ce7396ea))
* create sprites only if needed ([f0254ea](https://github.com/bibulle/myCalibreServer/commit/f0254ea3ce30bd0e78ec340d3c39071e5a810063))

## [0.9.0](https://github.com/bibulle/myCalibreServer/compare/v0.8.0...v0.9.0) (2023-01-24)


### Features

* add controller to get sprites (fixes [#104](https://github.com/bibulle/myCalibreServer/issues/104)) ([8f01644](https://github.com/bibulle/myCalibreServer/commit/8f01644cd4893cf60ce12c52f550d57a771a8844))
* replace thumbnail image with sprite in frontend ([4f66c83](https://github.com/bibulle/myCalibreServer/commit/4f66c835218539e1e2afebe46b87dd8afbdabded))


### Bug Fixes

* add some new vocabulary ([7f7596d](https://github.com/bibulle/myCalibreServer/commit/7f7596d10366dc252c20d150140059d9ce7396ea))
* create sprites only if needed ([f0254ea](https://github.com/bibulle/myCalibreServer/commit/f0254ea3ce30bd0e78ec340d3c39071e5a810063))

## [0.8.0](https://github.com/bibulle/myCalibreServer/compare/v0.7.3...v0.8.0) (2023-01-19)


### Features

* automate CI/CD (Fixes [#100](https://github.com/bibulle/myCalibreServer/issues/100)) ([42bdfc8](https://github.com/bibulle/myCalibreServer/commit/42bdfc83a1d7371eb7cb360047137bd5ae72aad3)), closes [#101](https://github.com/bibulle/myCalibreServer/issues/101)


### Bug Fixes

* build everything at once to not have memory problem ([79d3684](https://github.com/bibulle/myCalibreServer/commit/79d36849c617c79cab4e243f6885fad74830a64a))

### [0.7.3](https://github.com/bibulle/myCalibreServer/compare/v0.5.0...v0.7.3) (2023-01-17)


### Features

* add change password interface ([2c05c38](https://github.com/bibulle/myCalibreServer/commit/2c05c387c79c5b7352a80c798177408fe8b3b9bf))
* add focker management ([1fa6b9d](https://github.com/bibulle/myCalibreServer/commit/1fa6b9d35628fb49b4385a7a2e4e1c9e9c4a8a28))
* add format choice when sent to kindle ([a6b0808](https://github.com/bibulle/myCalibreServer/commit/a6b0808c0092fed8f9631d22e96c5df79e58c290))
* add google authent by id-token ([296a35a](https://github.com/bibulle/myCalibreServer/commit/296a35abac944843233fc944c4001b685a86508d))
* add health endpoint ([a528e4d](https://github.com/bibulle/myCalibreServer/commit/a528e4d00f0575ac35d0397869d4d8c59cf80536))
* add health endpoint ([f87dac0](https://github.com/bibulle/myCalibreServer/commit/f87dac030d6bbcd03023a3f49697787f067ceb6b))
* add login from android app ([658846e](https://github.com/bibulle/myCalibreServer/commit/658846ece29158e134240a2d6d3fb47a2dd08d36))
* add reset pasword feature (with temporary token) ([8a4bcd8](https://github.com/bibulle/myCalibreServer/commit/8a4bcd8673e2a060f75f5963b8a5b38d4ddd750e))
* downloaded and rated book are now clickable ([2ffcf3b](https://github.com/bibulle/myCalibreServer/commit/2ffcf3bb0712f2ff46fbb5d692927d4d2b1729c0))
* info from amazon should be less strict ([78feee2](https://github.com/bibulle/myCalibreServer/commit/78feee2f1fe908f8976250d744e760cf0b8ecffb))


### Bug Fixes

* change thumbnails and covers cache control times ([06b6f58](https://github.com/bibulle/myCalibreServer/commit/06b6f58138edb117c6b5ad2995e0086a480bca6f))
* fix vulnerabilities ([e37edf3](https://github.com/bibulle/myCalibreServer/commit/e37edf31780b67130cef57cb2d4fa5a38d0cbfb5))
* input should be a matInput in angular 8 ([d683bf5](https://github.com/bibulle/myCalibreServer/commit/d683bf5b510d906b20a4e2550ffa2b7606b39253))
* password should be kept on user edition ([464df06](https://github.com/bibulle/myCalibreServer/commit/464df062ce948507413673a606896d64055f0286))
* remove warnings ([ef272fd](https://github.com/bibulle/myCalibreServer/commit/ef272fd96a74decd262fcf2c30273b8683420658))
* sharp deprecations ([78440c6](https://github.com/bibulle/myCalibreServer/commit/78440c6a51fa20c349d1c75fd6345e11e3935dbe))
* we need libs to install version dynamically ([9df97e0](https://github.com/bibulle/myCalibreServer/commit/9df97e0398140c9a6f456a8321e29b52727fc2ee))
* wrong title in pssword change ([d1d0b90](https://github.com/bibulle/myCalibreServer/commit/d1d0b90b7e83969302d774465738e09fe0866780))

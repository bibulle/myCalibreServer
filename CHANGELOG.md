# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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

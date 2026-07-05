<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors


<!-- nx configuration end-->

## Stack technique actuelle

| Outil | Version |
|-------|---------|
| Node.js | 24 LTS (`.nvmrc`) |
| Nx | 23.0.1 |
| Angular | 21.2.17 |
| Angular Material / CDK | 21.2.14 |
| NestJS | 11.1.27 |
| TypeScript | 5.9.3 |
| Jest | 30.4.2 |
| Playwright | 1.61.x (e2e — no MongoDB required) |
| ESLint | 10.6.0 (flat config, `eslint.config.mjs`) |

> Angular 22 et TypeScript 6 sont disponibles en amont mais volontairement non
> adoptés ici : ce sont des montées de version majeures qui impliquent
> potentiellement du code fonctionnel et sont traitées comme des chantiers
> séparés nécessitant un accord explicite préalable.
>
> **Angular 22 est bloqué en amont** : `@nx/angular@23.0.1` (dernière version **stable**)
> plafonne son peer dependency `@angular-devkit/build-angular` (et `@angular/build`) à
> `< 22.0.0`. Le support d'Angular 22 existe déjà côté Nx sous forme de builds **canary**
> (`@nx/angular@23.1.0-canary.*`, dont le peer range monte à `< 23.0.0`), mais aucune
> release stable `23.1.0` n'est publiée à ce jour (vérifié le 2026-07-05) — décision prise
> de ne pas dépendre d'un canary en production. La montée de version ne sera retentée
> qu'une fois une release stable `@nx/angular` compatible publiée.
>
> **TypeScript 6 est couplé à Angular 22, pas un chantier séparé** : `@angular-devkit/build-angular@22.x`
> (dernière version) exige désormais `typescript >=6.0 <6.1` (le peer `< 6.0` de la 21.x est devenu un
> plancher `>= 6.0` en 22.x) — impossible de monter TypeScript 6 sans monter Angular 22 en même temps,
> ni l'inverse. Les deux montées sont donc bloquées ensemble par le même verrou `@nx/angular`.

## Notes importantes

- **Nx 23 / `@nx/webpack`** : `webpack`, `webpack-cli` et `webpack-dev-server` sont
  désormais des `peerDependencies` explicites de `@nx/webpack` (ajoutés en
  devDependencies par `nx migrate`). L'exécuteur `@nx/webpack:webpack` (utilisé
  par le projet `api`) est marqué déprécié et sera retiré en Nx 24, au profit des
  "inferred targets" (`nx g @nx/webpack:convert-to-inferred`) — migration à
  prévoir lors du passage à Nx 24, pas nécessaire pour l'instant.
- **ESLint 10 / flat config** : migré via `nx g @nx/eslint:convert-to-flat-config`, puis les configs générées (qui transcrivaient fidèlement l'ancien plugin cassé `@nrwl/nx`, absent de `node_modules` — le lint était donc silencieusement cassé depuis un moment) ont été réécrites à la main pour utiliser les configs modernes exposées par `@nx/eslint-plugin` (`nx.configs['flat/base']`, `flat/typescript`, `flat/javascript`, `flat/angular`, `flat/angular-template`) et les packages unifiés `angular-eslint` / `typescript-eslint` (remplaçant les paquets scindés `@angular-eslint/*` et `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser`). Le lint tournant enfin réellement pour la première fois, il a révélé une dette pré-existante (238 problèmes frontend, 114 API) : les règles nouvellement bloquantes (`@angular-eslint/prefer-inject`, les règles a11y de template `interactive-supports-focus`/`click-events-have-key-events`/`elements-content`/`alt-text`, `no-useless-catch`, `no-wrapper-object-types`, `no-empty-function`, `no-useless-assignment`, les conventions de sélecteur) ont été repassées en `warn` dans les `eslint.config.mjs` de chaque projet (marquées `TODO(eslint-10-upgrade)`) pour livrer l'upgrade sans toucher au code fonctionnel ; leur résolution est un chantier séparé, à la demande.
- **`@nx/eslint:lint` déprécié** : l'exécuteur est marqué déprécié et sera retiré en Nx 24, au profit des "inferred targets" (`nx g @nx/eslint:convert-to-inferred`) — migration à prévoir lors du passage à Nx 24, pas nécessaire pour l'instant.
- **Angular Material / CDK** : les migration scripts v20/v21 (`updateToVxx`) échouent sur Node < 24 due à un conflit ESM/CJS (`ora`). Les migrations sont retirées ; les packages sont à jour.
- **MatCommonModule** : supprimé dans Angular Material v21. Retirer les imports `MatCommonModule` de tous les `NgModule`.
- **cron / `@nestjs/schedule`** : montés ensemble en `cron@4.x` / `@nestjs/schedule@6.x` (`@nestjs/schedule@6` dépend directement de `cron@4.4.0`, donc les deux doivent être alignés). Aucun changement de code nécessaire : `new CronJob(expression, callback)` et `SchedulerRegistry.addCronJob()` (utilisés dans `CacheService` et `BooksService`) sont restés compatibles.
- **npm install** : utiliser `--legacy-peer-deps` lors des migrations majeures Angular/Nx.
- **@ngx-translate v18** : `TranslateModule` (et la classe NgModule) a été supprimée du package — remplacée par des providers (`provideTranslateService()`, `provideTranslateHttpLoader()`, etc.). Dans un `NgModule` classique (non standalone), il faut donc : (1) `provideTranslateService({ loader: provideTranslateHttpLoader(), ... })` dans les `providers` du module racine (plus besoin de fournir `TRANSLATE_HTTP_LOADER_CONFIG` à la main — `provideTranslateHttpLoader()` s'en charge, avec `/assets/i18n/` par défaut), et (2) `TranslatePipe` (standalone) ajouté directement dans `imports: []` de chaque `NgModule` dont un composant déclaré utilise le pipe `| translate` dans son template. `TranslateService` est aussi passé aux signals : `currentLang`/`fallbackLang` sont maintenant des `Signal<string | null>` (utiliser `getCurrentLang()` pour un snapshot non réactif) ; `setDefaultLang`/`getDefaultLang` ont été supprimés — utiliser directement `use(lang)` avec le fallback souhaité (ex. `use(getBrowserLang() ?? 'en')`).
- **@HostListener TypeScript 5.9** : les méthodes décorées avec `@HostListener` doivent déclarer explicitement `['$event']` si elles reçoivent l'événement en argument — ex. `@HostListener('mousedown', ['$event'])`.
- **mongodb driver v7** : le support des callbacks a été supprimé (déjà déprécié depuis plusieurs versions majeures) — seule l'API Promise reste. Un seul appel du code applicatif utilisait encore le style callback (`MyCalibreDbService.getAllUsers()` : `.toArray((err, rows) => ...)`), converti en `.toArray().then(...).catch(...)`. Le stub Mongo utilisé par la suite e2e Playwright (`apps/frontend-e2e-playwright/mongo-stub/mongodb-stub.js`) implémentait aussi `toArray` en callback — mis à jour pour retourner une Promise, sinon l'API plante silencieusement dès qu'un test appelle `getAllUsers()` (ex. le login, qui liste les utilisateurs).
- **sqlite3 v6** : aucun changement de code nécessaire. L'API callback de `Database#all`/`#get` (utilisée dans `CalibreDbService` et `CalibreDb1Service`) est restée identique ; seul le binding natif a été reconstruit (paquets de build natifs différents, mêmes fichiers prebuilt via `prebuild-install`).
- **`sqlite3` v6 / GLIBC — incident production (v0.12.21)** : le binaire prébuilt téléchargé par `prebuild-install` pour `sqlite3@6.0.1` requiert `GLIBC_2.38`, absent de `node:24` (== `node:24-bookworm`, Debian 12, glibc 2.36) — le binaire `sharp`, lui, ne requiert que `GLIBC_2.17`, donc sans rapport. `docker build` réussit sans erreur (`prebuild-install` télécharge et copie le binaire sans jamais le charger), le crash (`ERR_DLOPEN_FAILED`) n'apparaît qu'au **démarrage réel du conteneur** — ce que le CI (`docker-build-push.yml`) ne teste jamais (il build et push l'image sans jamais la lancer). `Dockerfile` mis à jour vers `node:24-trixie` (Debian 13, glibc ≥ 2.38) dans les deux stages. Vérifié : digest de `node:24` == digest de `node:24-bookworm` sur Docker Hub, confirmant que le tag `node:24` seul n'inclut plus (ou pas encore) glibc 2.38 au moment de cet incident. **Point de vigilance permanent** : ce mécanisme (prebuild-install télécharge un binaire dont la baseline glibc dépend de l'infra de build de sqlite3, indépendamment de nos versions figées) peut se reproduire à toute future montée de version de `sqlite3` (ou même sans montée de version si sqlite3 republie un prebuilt pour le même tag sur une image plus récente) — recommandé d'ajouter un smoke-test CI qui démarre réellement l'image buildée avant de la pousser (non fait dans ce correctif, cf. discussion avec l'utilisateur).
- **nodemailer v9** : aucun changement de code nécessaire. Seul breaking change de la v9.0.0 (validation TLS par défaut des certificats lors de la récupération de contenu distant — pièces jointes via URL, endpoints OAuth2, proxy HTTP/HTTPS CONNECT) : sans effet ici, `MailService.sendMail()` (`apps/api/src/app/utils/mail.service.ts`) n'utilise que des pièces jointes en chemin de fichier local (`path`), jamais d'URL distante. L'API callback de `transporter.sendMail()` reste inchangée.
- **commitlint / `@commitlint/config-conventional` v21** : aucun changement de code nécessaire — `commitlint` n'est actuellement câblé à aucun hook (`husky`) ni job CI dans ce dépôt, c'est un simple devDependency non exécuté automatiquement. Nécessite Node >= 22.12.0 (déjà couvert par le `.nvmrc` en 24).
- **Nettoyage warnings CI** : `actions/checkout@v4` et `actions/setup-node@v4` (workflow `docker-build-push.yml`) embarquent un runtime Node 20 que GitHub force à tourner sur Node 24, d'où le warning `Node.js 20 is deprecated` — réglé en passant les deux actions en `v5`. Le même warning réapparaissait ensuite pour le job de build Docker via `docker/setup-buildx-action@v3`, `docker/login-action@v3` et `docker/build-push-action@v6` (repéré dans les logs CI) — réglé en passant ces trois actions en `v4`, `v4` et `v7` respectivement (première version majeure de chacune avec "Node 24 as default runtime"). Côté `npm ci`, le warning `npm warn allow-scripts` (paquets avec install scripts non couverts par `allowScripts`) a été supprimé en committant les approbations (`npm approve-scripts --all`, écrit la map `allowScripts` dans `package.json`) pour les 8 paquets natifs concernés (`@parcel/watcher`, `esbuild`, `lmdb`, `msgpackr-extract`, `nx`, `sharp`, `sqlite3`, `unrs-resolver`) — **à re-approuver après toute montée de version de l'un de ces paquets** (l'approbation est pinnée `pkg@version`). `@angular/platform-browser-dynamic` (déprécié, fusionné dans `@angular/platform-browser` depuis qu'Ivy a supprimé la distinction JIT/AOT) a été retiré : `main.ts` utilise désormais `platformBrowser()` (signature identique) et la dépendance associée a été supprimée de `package.json`.
- **`@angular/animations` déprécié (non traité)** : `npm ci` affiche encore `@angular/animations is deprecated. Use animate.enter and animate.leave instead.` C'est un chantier bien plus large que le point ci-dessus (migration de la syntaxe de template, et Angular Material dépend encore de `BrowserAnimationsModule` en interne pour ses propres transitions) — pas traité ici, à faire à la demande.
- **`standard-version` remplacé par `release-please`** : `standard-version` est abandonné en amont depuis 2022 et sa chaîne de dépendances (`conventional-changelog@3.1.25` et ses presets `conventional-changelog-*`) générait à elle seule ~9 des ~16 lignes de `npm warn deprecated` de ce dépôt (`stringify-package`, `git-semver-tags`, `git-raw-commits`, `q`...). Le fork officiellement recommandé (`commit-and-tag-version`, même config/CLI) a été testé et **rejeté** : sa dépendance `conventional-changelog@4.0.0` embarque tous les presets historiques comme dépendances directes, dont plusieurs ont depuis été dépréciés individuellement — résultat mesuré : 20 lignes de warning au lieu de 16, en pire. `release-please` (`googleapis/release-please-action@v4`, workflow `.github/workflows/release-please.yml`) tourne uniquement en CI (aucun paquet npm dans les devDependencies du projet), ce qui élimine intégralement cette classe de warnings (16 → 9 lignes mesurées, toutes désormais dans des outils qu'on ne contrôle pas — cf. point ci-dessus sur le nettoyage CI).
  - Config : `release-please-config.json` (`release-type: node`, mêmes sections de changelog que l'ancien `standard-version.types`) + `.release-please-manifest.json`. `release-type: node` gère nativement `package.json` **et** `package-lock.json` (pas de plugin requis) ; un `extra-files` en `jsonpath` (`$.version`) gère en plus `libs/api-interfaces/src/lib/version.json`.
  - **Limite connue** : contrairement à l'ancien script `postbump` (`npm run replace:version`), `release-please` ne met à jour que le champ `version` de `version.json` — pas `github_url`/`name` (statiques, sans impact) ni `copyright` (l'année n'est plus rafraîchie automatiquement à chaque release). Le script `replace:version` est conservé pour un rafraîchissement manuel ponctuel (une fois par an suffit).
  - **Changement de workflow** : il n'y a plus de commande locale `npm run release-patch`/`-minor`/`-major` — `release-please` ouvre/actualise automatiquement une *Release PR* sur `master` après chaque merge, qu'il suffit de merger quand une nouvelle version doit être publiée (cf. `CLAUDE.md`, section "Processus de livraison").
  - **Piège au premier run — tags historiques incompatibles** : par défaut `release-please` préfixe ses tags Git du nom du package (`package.json.name`, ici `my-calibre-server` → tags `my-calibre-server-v0.12.21`). Ce dépôt a un historique de tags **sans** ce préfixe (`v0.12.20`, posés par `standard-version`). Sans `"include-component-in-tag": false` dans `release-please-config.json`, `release-please` ne retrouve aucun tag correspondant à son format attendu, en déduit qu'aucune release n'a jamais eu lieu, et recalcule une version à partir de **tout l'historique de commits du dépôt** (repéré via une Release PR proposant `0.13.0` avec le changelog complet depuis la création du projet — fermée sans merger). Avec `include-component-in-tag: false`, les tags restent au format `vX.Y.Z` existant et seuls les commits postérieurs au dernier tag réel sont pris en compte. Le titre/nom de branche de la Release PR (`chore(master): release my-calibre-server X.Y.Z`, branche `release-please--branches--master--components--my-calibre-server`) continuent en revanche d'inclure le nom du package — cosmétique, non corrigé.

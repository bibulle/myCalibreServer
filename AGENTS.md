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
> **Angular 22 est bloqué en amont** : `@nx/angular@23.0.1` plafonne son peer
> dependency `@angular-devkit/build-angular` (et `@angular/build`) à `< 22.0.0`.
> Nx n'a donc pas encore ajouté le support d'Angular 22 ; la montée de version
> ne pourra être tentée qu'une fois une release `@nx/angular` compatible publiée.
>
> **TypeScript 6 est bloqué pour la même raison** : `@angular-devkit/build-angular@21.2.18`
> plafonne son peer dependency `typescript` à `< 6.0` (alors que `@angular/compiler-cli`
> seul autoriserait `< 6.1`). Bloqué tant qu'Angular 22 (et son outillage de build) n'est pas disponible.

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
- **cron** : le projet utilise `cron@3.x` (avec générics TypeScript) pour la compatibilité avec `@nestjs/schedule@5`.
- **npm install** : utiliser `--legacy-peer-deps` lors des migrations majeures Angular/Nx.
- **@ngx-translate v18** : `TranslateModule` (et la classe NgModule) a été supprimée du package — remplacée par des providers (`provideTranslateService()`, `provideTranslateHttpLoader()`, etc.). Dans un `NgModule` classique (non standalone), il faut donc : (1) `provideTranslateService({ loader: provideTranslateHttpLoader(), ... })` dans les `providers` du module racine (plus besoin de fournir `TRANSLATE_HTTP_LOADER_CONFIG` à la main — `provideTranslateHttpLoader()` s'en charge, avec `/assets/i18n/` par défaut), et (2) `TranslatePipe` (standalone) ajouté directement dans `imports: []` de chaque `NgModule` dont un composant déclaré utilise le pipe `| translate` dans son template. `TranslateService` est aussi passé aux signals : `currentLang`/`fallbackLang` sont maintenant des `Signal<string | null>` (utiliser `getCurrentLang()` pour un snapshot non réactif) ; `setDefaultLang`/`getDefaultLang` ont été supprimés — utiliser directement `use(lang)` avec le fallback souhaité (ex. `use(getBrowserLang() ?? 'en')`).
- **@HostListener TypeScript 5.9** : les méthodes décorées avec `@HostListener` doivent déclarer explicitement `['$event']` si elles reçoivent l'événement en argument — ex. `@HostListener('mousedown', ['$event'])`.

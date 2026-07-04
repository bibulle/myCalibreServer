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
| ESLint | 9.x (format `.eslintrc.json` — pas encore migré en flat config) |

> Angular 22, TypeScript 6 et ESLint 10 sont disponibles en amont mais
> volontairement non adoptés ici : ce sont des montées de version majeures qui
> impliquent potentiellement du code fonctionnel et sont traitées comme des
> chantiers séparés nécessitant un accord explicite préalable.
>
> **Angular 22 est bloqué en amont** : `@nx/angular@23.0.1` plafonne son peer
> dependency `@angular-devkit/build-angular` (et `@angular/build`) à `< 22.0.0`.
> Nx n'a donc pas encore ajouté le support d'Angular 22 ; la montée de version
> ne pourra être tentée qu'une fois une release `@nx/angular` compatible publiée.

## Notes importantes

- **Nx 23 / `@nx/webpack`** : `webpack`, `webpack-cli` et `webpack-dev-server` sont
  désormais des `peerDependencies` explicites de `@nx/webpack` (ajoutés en
  devDependencies par `nx migrate`). L'exécuteur `@nx/webpack:webpack` (utilisé
  par le projet `api`) est marqué déprécié et sera retiré en Nx 24, au profit des
  "inferred targets" (`nx g @nx/webpack:convert-to-inferred`) — migration à
  prévoir lors du passage à Nx 24, pas nécessaire pour l'instant.
- **ESLint** : le projet utilise encore le format legacy `.eslintrc.json`. Les migrations Nx qui génèrent `eslint.config.js` sont retirées manuellement de `migrations.json`.
- **Angular Material / CDK** : les migration scripts v20/v21 (`updateToVxx`) échouent sur Node < 24 due à un conflit ESM/CJS (`ora`). Les migrations sont retirées ; les packages sont à jour.
- **MatCommonModule** : supprimé dans Angular Material v21. Retirer les imports `MatCommonModule` de tous les `NgModule`.
- **cron** : le projet utilise `cron@3.x` (avec générics TypeScript) pour la compatibilité avec `@nestjs/schedule@5`.
- **npm install** : utiliser `--legacy-peer-deps` lors des migrations majeures Angular/Nx.
- **@ngx-translate/http-loader v17** : le constructeur `TranslateHttpLoader` utilise `inject(TRANSLATE_HTTP_LOADER_CONFIG)` en interne. Dans un NgModule, il faut : (1) `useClass: TranslateHttpLoader` dans `TranslateModule.forRoot`, **et** (2) `{ provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: {} }` dans les `providers` du module racine.
- **@HostListener TypeScript 5.9** : les méthodes décorées avec `@HostListener` doivent déclarer explicitement `['$event']` si elles reçoivent l'événement en argument — ex. `@HostListener('mousedown', ['$event'])`.

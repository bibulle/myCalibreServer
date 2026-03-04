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
| Nx | 22.5.3 |
| Angular | 21.1.6 |
| Angular Material / CDK | 21.1.6 |
| NestJS | 11.x |
| TypeScript | 5.9.3 |
| Jest | 30.2.0 |
| Cypress | 15.9.0 |
| ESLint | 9.x (format `.eslintrc.json` — pas encore migré en flat config) |

## Notes importantes

- **ESLint** : le projet utilise encore le format legacy `.eslintrc.json`. Les migrations Nx qui génèrent `eslint.config.js` sont retirées manuellement de `migrations.json`.
- **Angular Material / CDK** : les migration scripts v20/v21 (`updateToVxx`) échouent sur Node < 24 due à un conflit ESM/CJS (`ora`). Les migrations sont retirées ; les packages sont à jour.
- **MatCommonModule** : supprimé dans Angular Material v21. Retirer les imports `MatCommonModule` de tous les `NgModule`.
- **cron** : le projet utilise `cron@3.x` (avec générics TypeScript) pour la compatibilité avec `@nestjs/schedule@5`.
- **npm install** : utiliser `--legacy-peer-deps` lors des migrations majeures Angular/Nx.
- **@ngx-translate/http-loader v17** : le constructeur `TranslateHttpLoader` utilise `inject(TRANSLATE_HTTP_LOADER_CONFIG)` en interne. Dans un NgModule, il faut : (1) `useClass: TranslateHttpLoader` dans `TranslateModule.forRoot`, **et** (2) `{ provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: {} }` dans les `providers` du module racine.
- **@HostListener TypeScript 5.9** : les méthodes décorées avec `@HostListener` doivent déclarer explicitement `['$event']` si elles reçoivent l'événement en argument — ex. `@HostListener('mousedown', ['$event'])`.

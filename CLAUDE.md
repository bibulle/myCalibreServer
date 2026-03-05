# Règles de travail — myCalibreServer

## Contexte du projet

myCalibreServer est une application web de gestion de bibliothèque numérique (livres au format Calibre).

**Stack technique :**
- Monorepo : Nx 19
- Frontend : Angular 18 (Angular Material, PWA, JWT)
- Backend : NestJS 9 (Express, Passport, Sequelize, SQLite)
- Interfaces partagées : `libs/api-interfaces`
- Déploiement : Docker, GitHub Actions

---

## Contraintes critiques (OBLIGATOIRES)

- **Toujours commencer par un `git pull` sur `master`** avant de créer une branche ou de commencer à travailler, afin de partir de la version la plus récente du code
- Travailler exclusivement dans une branche dédiée (pas dans `master`)
- Ne jamais pousser de modifications directement sur la branche `master`
- Ne jamais commiter sans feu vert explicite de l'utilisateur
- Ne jamais créer de pull request sans validation explicite de l'utilisateur
- **Avant de demander le feu vert de l'utilisateur, lancer les serveurs** (`npm run start:api` et `npm run start:frontend`) afin qu'il puisse tester l'application localement
- Attendre explicitement le feu vert de l'utilisateur après qu'il ait exécuté les tests localement
- Ne pas modifier le code fonctionnel existant (hors ajustements mineurs strictement nécessaires)
- Aucun test ne doit être supprimé, désactivé ou ignoré (`skip`, `xit`, `xdescribe`, `pending`, etc.)

**Conventions de nommage des branches :**
- `feat/<description>` pour les nouvelles fonctionnalités
- `fix/<description>` pour les corrections de bugs
- `refactor/<description>` pour les refactorisations
- `<auteur>/issue<numéro>` pour les issues GitHub

---

## Structure du monorepo Nx

```
apps/
  api/              # NestJS backend
  frontend/         # Angular frontend
  frontend-e2e/     # Tests E2E Cypress
libs/
  api-interfaces/   # Interfaces et types partagés
```

Toute modification d'interface partagée dans `libs/api-interfaces` doit être propagée aux deux applications.

---

## Tests (EXIGENCE ABSOLUE)

Mettre à jour et compléter :
- les tests unitaires backend : controllers, services, guards, interceptors (Jest + NestJS Testing)
- les tests unitaires frontend : components, services, guards, pipes (Jest + jest-preset-angular)
- les tests end-to-end (Cypress)

Ajouter des tests manquants pour couvrir :
- les parcours critiques
- les cas limites
- les scénarios d'erreur

Règles :
- Mocker systématiquement les dépendances externes (Sequelize, Nodemailer, Passport, etc.)
- Garantir que les tests sont reproductibles, indépendants et lisibles
- Respecter les configurations Jest existantes (`apps/api/jest.config.ts`, `apps/frontend/jest.config.ts`)

---

## Boucle de validation des tests (POINT CRITIQUE)

Si un ou plusieurs tests échouent :
1. Analyser précisément la cause de l'échec
2. Corriger les tests ou leur configuration
3. Relancer l'ensemble des tests

- Cette boucle doit être répétée autant de fois que nécessaire
- Aucun contournement n'est autorisé pour forcer un résultat vert
- Le travail n'est terminé que lorsque **tous les tests sont au vert**

---

## Documentation (OBLIGATOIRE)

Mettre à jour et aligner la documentation avec le comportement réel :
- `README.md` — installation, configuration, lancement
- `CHANGELOG.md` — via `standard-version` (ne pas éditer manuellement)
- `AGENTS.md` — directives spécifiques au workspace Nx pour les agents IA
- `.env.example` — variables d'environnement requises et optionnelles

Clarifier :
- les flux applicatifs
- les prérequis
- les commandes de lancement et de test

Supprimer les incohérences ou informations obsolètes.

---

## Actions GitHub (OBLIGATOIRES)

- Toute interaction avec GitHub liée à la tâche (issues, pull requests, reviews, labels, commentaires) doit être réalisée **exclusivement via le serveur MCP GitHub configuré** (`github` dans `.mcp.json`)
- Ne jamais utiliser le CLI `gh` ou des appels directs à l'API GitHub en dehors du MCP
- Indiquer clairement dans les réponses les actions GitHub réalisées via le MCP
- Le token d'accès doit être défini dans la variable d'environnement `GITHUB_PERSONAL_ACCESS_TOKEN`

---

## Vérification des environnements (OBLIGATOIRE AVANT VALIDATION)

Avant de demander à l'utilisateur de tester :
- Vérifier que le backend démarre correctement (`npm run start:api`)
- Vérifier que le frontend démarre correctement (`npm run start:frontend`)
- Vérifier que les dépendances sont installées (`npm ci`)
- Vérifier que les suites de tests s'exécutent sans erreur d'infrastructure

Ne demander de tester que lorsque les environnements sont fonctionnels et stables.

---

## Commandes de référence

**Démarrage :**
```bash
npm run start:api         # Démarre le backend NestJS
npm run start:frontend    # Démarre le frontend Angular
```

**Tests unitaires :**
```bash
npm run test              # Tous les tests (Nx)
npm run test:api          # Tests unitaires backend uniquement
npm run test:frontend     # Tests unitaires frontend uniquement
npm run test:coverage     # Tests avec rapport de couverture
```

**Tests E2E :**
```bash
npm run e2e:seed          # Seed de la base de données de test
npm run e2e               # Tests E2E (mode headless par défaut)
npm run e2e:headless      # Tests E2E headless explicitement
npm run e2e:open          # Tests E2E avec interface Cypress
npm run e2e:spec          # Lancer un spec Cypress spécifique
```

**Build :**
```bash
npm run build             # Build frontend + backend (Nx)
```

---

## Livrables attendus

- Liste des tests ajoutés ou modifiés
- Liste des sections de documentation mises à jour
- Nom de la branche dédiée utilisée
- Contenu complet des modifications (tests + documentation)
- Commandes exactes pour lancer les serveurs et exécuter les tests
- État final confirmé : tous les tests sont verts et la documentation est à jour

---

## Méthodologie attendue

- Travailler par étapes : analyse → proposition → implémentation → validation
- Justifier les choix effectués
- Prioriser la clarté, la cohérence et la maintenabilité du code
- Respecter les conventions de commits existantes (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`)
- **Attendre explicitement le feu vert de l'utilisateur avant toute action de versioning ou de push**

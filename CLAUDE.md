# Règles de travail — myCalibreServer

## Contexte du projet

myCalibreServer est une application web de gestion de bibliothèque numérique (livres au format Calibre).

**Stack technique :**
- Monorepo : Nx 22
- Frontend : Angular 21 (Angular Material, PWA, JWT)
- Backend : NestJS 11 (Express, Passport, Sequelize, SQLite)
- Interfaces partagées : `libs/api-interfaces`
- Déploiement : Docker, GitHub Actions

> Le détail précis des versions (Nx, Angular, NestJS, Jest, Playwright...) est maintenu dans `AGENTS.md` — s'y référer en cas de doute plutôt que de dupliquer ici.

---

## Contraintes critiques (OBLIGATOIRES)

- **S'aligner avec `master`** (le dépôt distant GitHub) avant de créer une branche, puis régulièrement pendant le travail (avant l'ouverture de la PR, avant la montée de version, avant le merge final)
- Travailler exclusivement dans une branche dédiée par fonctionnalité/tâche (pas dans `master`)
- Ne jamais pousser de modifications directement sur la branche `master` (toujours passer par une pull request)
- Ne pas modifier le code fonctionnel existant (hors ajustements mineurs strictement nécessaires, ou demande expresse de l'utilisateur)
- Aucun test ne doit être supprimé, désactivé ou ignoré (`skip`, `xit`, `xdescribe`, `pending`, etc.)
- Avant de committer/pousser : vérifier que les tests unitaires (frontend/backend) et e2e (s'ils existent) passent, et que les serveurs démarrent sans erreur (`npm run start:api`, `npm run start:frontend`)
- Le commit, le push et l'ouverture de la pull request (toujours en **draft**) ne nécessitent pas de feu vert préalable de l'utilisateur — cf. "Processus de livraison" ci-dessous
- **Un feu vert explicite de l'utilisateur reste obligatoire avant toute montée de version** (c'est-à-dire avant de merger la *Release PR* générée automatiquement par `release-please`, cf. "Processus de livraison" ci-dessous), une fois qu'il a testé l'application localement
- Le merge de la Release PR peut être fait automatiquement une fois ce feu vert obtenu : elle ne contient par construction que la montée de version, le `CHANGELOG.md` et les fichiers de version, jamais de code fonctionnel

**Conventions de nommage des branches :**
- `feat/<description>` pour les nouvelles fonctionnalités
- `fix/<description>` pour les corrections de bugs
- `refactor/<description>` pour les refactorisations
- `<auteur>/issue<numéro>` pour les issues GitHub

---

## Processus de livraison (workflow)

1. Récupérer `master` à jour (`git pull origin master` ou `git fetch` + rebase) avant de créer la branche
2. Créer une branche dédiée par fonctionnalité/tâche (cf. conventions de nommage ci-dessus)
3. Implémenter la demande (tests + documentation inclus, cf. sections dédiées)
4. Lancer les serveurs et vérifier qu'ils démarrent sans erreur ; lancer les tests unitaires et e2e s'ils existent, et boucler jusqu'au vert (cf. "Boucle de validation des tests")
5. Committer, pousser (`git push -u origin <branche>`) et ouvrir une pull request **en draft** via le MCP GitHub
6. Surveiller le CI/CD de la PR ; en cas d'échec, corriger et repousser jusqu'au vert
   > Le workflow CI (`.github/workflows/docker-build-push.yml`) exécute un job `test` (tests unitaires frontend/backend, avec un vrai MongoDB de service, + la suite e2e Playwright complète) avant le job de build+push Docker, qui en dépend (`needs: test`). La suite e2e Playwright (seule suite e2e du projet depuis la suppression de Cypress) ne nécessite aucune instance MongoDB, y compris pour ses parcours authentifiés (login, notes, séries/auteurs/tags) : le driver `mongodb` de l'API est remplacé par un stub en mémoire pré-rempli (voir `apps/frontend-e2e-playwright/README.md`).
7. Attendre le feu vert explicite de l'utilisateur, après qu'il ait testé l'application localement
8. Une fois le feu vert obtenu, merger la pull request de la fonctionnalité (via le MCP GitHub) — **sans montée de version à ce stade** : ce n'est plus une commande locale, cf. point 9
9. Le merge sur `master` déclenche automatiquement le workflow `release-please` (`.github/workflows/release-please.yml`), qui crée ou met à jour une **Release PR** dédiée (titre `chore(master): release X.Y.Z`) accumulant tous les changements non encore publiés depuis le dernier tag ; son diff contient déjà `CHANGELOG.md`, `package.json`, `package-lock.json` et `libs/api-interfaces/src/lib/version.json` à jour — rien à générer ni committer manuellement
10. Quand une nouvelle version doit être publiée (immédiatement après une fonctionnalité, ou après en avoir accumulé plusieurs) : surveiller le CI/CD de la Release PR, puis, avec un nouveau feu vert explicite de l'utilisateur après test local, la merger via le MCP GitHub
    > Le merge de la Release PR crée le tag Git (`vX.Y.Z`) et déclenche le build + push de l'image Docker (si les secrets Docker Hub sont configurés) ainsi que la mise à jour du dépôt `myKubernetesConfig` (déploiement K8s). C'est une action à fort impact, mais autorisée automatiquement ici car elle intervient juste après la validation explicite de l'utilisateur, le seul contenu de cette PR étant par construction la montée de version.

---

## Structure du monorepo Nx

```
apps/
  api/                      # NestJS backend
  frontend/                 # Angular frontend
  frontend-e2e-playwright/  # Tests E2E Playwright (pas de MongoDB requis)
libs/
  api-interfaces/   # Interfaces et types partagés
```

Toute modification d'interface partagée dans `libs/api-interfaces` doit être propagée aux deux applications.

---

## Tests (EXIGENCE ABSOLUE)

Mettre à jour et compléter :
- les tests unitaires backend : controllers, services, guards, interceptors (Jest + NestJS Testing)
- les tests unitaires frontend : components, services, guards, pipes (Jest + jest-preset-angular)
- les tests end-to-end (Playwright, `apps/frontend-e2e-playwright/`)

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
- `CHANGELOG.md` — généré par `release-please` (ne pas éditer manuellement)
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

## Lancement dans un worktree (IMPORTANT)

Lorsque l'on travaille dans un worktree (`.claude/worktrees/`), les données non versionnées (`.env`, `data/`, `node_modules/`) ne sont pas présentes. Avant de lancer les serveurs :

1. **Installer les dépendances** :
   ```bash
   npm ci
   ```

2. **Copier le fichier `.env`** depuis le repo principal (chemin local de l'utilisateur — à lui demander s'il n'est pas connu ; en session cloud sans accès à ce repo, demander le contenu du `.env` ou en générer un minimal à partir de `.env.example`) :
   ```bash
   cp <chemin-repo-principal>/.env .env
   ```

3. **Créer un symlink vers le répertoire `data/`** (bibliothèque Calibre + cache) :
   ```bash
   ln -s <chemin-repo-principal>/data data
   ```
   > Cela permet à l'API de trouver `metadata.db`, les couvertures et les fichiers EPUB/MOBI
   > sans modifier le `.env`. Les chemins par défaut (`PATH_BOOKS`, `PATH_MY_CALIBRE`)
   > résolvent vers `data/calibre` et `data/my-calibre` relatifs au CWD.

4. **Libérer les ports** si nécessaire (un autre serveur peut déjà tourner) :
   ```bash
   lsof -ti:3333 | xargs kill -9 2>/dev/null   # API
   lsof -ti:4200 | xargs kill -9 2>/dev/null   # Frontend
   ```

5. **Lancer les serveurs** :
   ```bash
   npm run start:api
   npm run start:frontend
   ```

6. **Vérifier que les serveurs répondent** :
   ```bash
   curl -s http://localhost:3333/api/version   # API
   curl -s http://localhost:4200 | head -1     # Frontend
   ```

### Variables d'environnement minimales requises

| Variable | Obligatoire | Effet si absente |
|---|---|---|
| `SESSION_SECRET` | **Oui** | Le serveur quitte immédiatement (`process.exit(1)`) |
| `AUTHENT_JWT_SECRET` | **Oui** | Toutes les routes authentifiées échouent |
| `AUTHENT_LENGTH` | **Oui** | Le login crash (`pbkdf2Sync`) |
| `AUTHENT_DIGEST` | **Oui** | Le login crash (`pbkdf2Sync`) |
| `MONGO_URL` | Recommandé | Défaut : `mongodb://192.168.0.126:30994` |
| `PATH_BOOKS` | Optionnel | Défaut : `data/calibre` (relatif au CWD, couvert par le symlink) |
| `PATH_MY_CALIBRE` | Optionnel | Défaut : `data/my-calibre` (relatif au CWD, couvert par le symlink) |

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
npm run e2e:playwright    # Tests E2E Playwright (aucune instance MongoDB requise)
```

**Build :**
```bash
npm run build             # Build frontend + backend (Nx)
```

---

## Livrables attendus

- Liste des tests ajoutés ou modifiés
- Liste des sections de documentation mises à jour
- Nom de la branche dédiée utilisée et lien de la pull request (draft)
- Contenu complet des modifications (tests + documentation)
- Commandes exactes pour lancer les serveurs et exécuter les tests
- État du CI/CD (vert/rouge, corrections effectuées le cas échéant)
- État final confirmé : tous les tests sont verts, la documentation est à jour, et (une fois le feu vert utilisateur obtenu) la version montée et la PR mergée

---

## Méthodologie attendue

- Travailler par étapes : analyse → proposition → implémentation → validation
- Justifier les choix effectués
- Prioriser la clarté, la cohérence et la maintenabilité du code
- Respecter les conventions de commits existantes (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`)
- Suivre le "Processus de livraison" défini plus haut : commit/push/PR draft automatiques, feu vert utilisateur obligatoire avant toute montée de version, merge final surveillé via le CI/CD

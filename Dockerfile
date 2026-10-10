# -------------
FROM node:24-trixie AS BUILD

WORKDIR /usr/src

COPY package*.json ./
COPY decorate-angular-cli.js ./
#COPY angular.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY libs libs

# `npm ci` : versions strictement figées par le lock (comme le CI)
RUN npm ci

RUN mkdir apps
COPY apps/frontend apps/frontend
COPY apps/api apps/api

RUN npx nx run-many --parallel --target=build --configuration=production --projects=frontend,api 
#RUN npm run ng build frontend -- --prod
#RUN npm run ng build api -- --prod

# Dépendances de production, préparées ici où la chaîne de compilation est
# disponible : l'image finale (slim) n'a ni python ni g++.
# On part du package.json/package-lock.json générés par le build de l'API
# (`generatePackageJson`) : uniquement les modules réellement requis à
# l'exécution (~90 Mo), au lieu des `dependencies` du package.json racine qui
# embarquent tout l'outillage Nx/Angular (~730 Mo).
# `--ignore-scripts` saute le script `install` de sqlite3, qui récupère son
# binaire natif : on le reconstruit ici, sans quitter les versions figées par
# le lock (au contraire d'un uninstall/install, qui réinstallait la dernière
# version satisfaisant le package.json, non testée par le CI).
# sharp n'a plus besoin de ce traitement : depuis la 0.33 il livre ses
# binaires en optionalDependencies (@img/sharp-*), qu'aucun script n'installe.
WORKDIR /usr/prod
RUN cp /usr/src/dist/apps/api/package*.json ./ \
 && npm ci --omit=dev --ignore-scripts \
 && npm rebuild sqlite3 \
 && npm cache clean --force

# -------------
# Image d'exécution : variante slim (~340 Mo au lieu de ~1,8 Go), même Debian
# (trixie, glibc) que l'étape de build, donc binaires natifs compatibles.
FROM node:24-trixie-slim

# switch to europe timezone
RUN ln -fs /usr/share/zoneinfo/Europe/Paris /etc/localtime

WORKDIR /usr/src

COPY --from=BUILD /usr/prod/package*.json ./
COPY --from=BUILD /usr/prod/node_modules node_modules/
COPY --from=BUILD /usr/src/dist dist/

ENV PORT=3000
#ENV AUTHENT_JWT_SECRET=authent_jwt_secret
#ENV AUTHENT_GOOGLE_CLIENT_ID=
ENV LOG_LEVEL=LOG
# glibc crée une arène malloc par thread : avec les threads libvips (sharp), la
# mémoire fragmentée n'est jamais rendue et la RSS du pod ne fait que monter.
# Recommandation de la doc sharp pour les images basées sur glibc.
ENV MALLOC_ARENA_MAX=2
ENV PATH_MY_CALIBRE=/cache
ENV PATH_BOOKS=/books

VOLUME ["/frontend"]
VOLUME ["/books"]
VOLUME ["/cache"]
EXPOSE 3000

#CMD mv dist/apps/frontend/* dist/apps/frontend/.htaccess /frontend && node dist/apps/api/main.js
CMD mv dist/apps/frontend/* /frontend && node dist/apps/api/main.js
# -------------
FROM node:16 AS BUILD

WORKDIR /usr/src

COPY package*.json ./
COPY decorate-angular-cli.js ./
COPY angular.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY libs libs

RUN npm install

RUN mkdir apps
COPY apps/frontend apps/frontend
COPY apps/api apps/api

RUN npx nx run-many --parallel --target=build --configuration=production --projects=frontend,api 
#RUN npm run ng build frontend -- --prod
#RUN npm run ng build api -- --prod

# -------------
FROM node:16

# switch to europe timezone
RUN ln -fs /usr/share/zoneinfo/Europe/Paris /etc/localtime

WORKDIR /usr/src

COPY --from=BUILD /usr/src/package*.json ./
COPY --from=BUILD /usr/src/dist dist/ 

RUN npm ci --only=production --ignore-scripts --omit=dev
RUN npm uninstall sqlite3 sharp
RUN npm install sqlite3 sharp

ENV PORT=3000
#ENV AUTHENT_JWT_SECRET=authent_jwt_secret
#ENV AUTHENT_GOOGLE_CLIENT_ID=
ENV LOG_LEVEL=DEBUG
ENV PATH_MY_CALIBRE=/cache
ENV PATH_BOOKS=/books

VOLUME ["/frontend"]
VOLUME ["/books"]
VOLUME ["/cache"]
EXPOSE 3000

#CMD mv dist/apps/frontend/* dist/apps/frontend/.htaccess /frontend && node dist/apps/api/main.js
CMD mv dist/apps/frontend/* /frontend && node dist/apps/api/main.js
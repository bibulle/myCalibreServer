# BUILD -------------
FROM node:15 AS BUILD

WORKDIR /usr/src

# BUILD BACKEND -----
RUN mkdir myCalibre-backend
COPY myCalibre-backend/package*.json ./myCalibre-backend/
COPY myCalibre-backend/src ./myCalibre-backend/src/
RUN cd ./myCalibre-backend && \
    npm install && \
    ./node_modules/typescript/bin/tsc -p ./src

# BUILD FRONTEND -----
RUN mkdir myCalibre-frontend
COPY myCalibre-frontend/package*.json ./myCalibre-frontend/
COPY myCalibre-frontend/angular.json ./myCalibre-frontend/
COPY myCalibre-frontend/src ./myCalibre-frontend/src/
RUN cd ./myCalibre-frontend && \
    npm install && \
    npm run-script build-prod

# -------------
FROM node:15

WORKDIR /usr/src

# BACKEND -----
RUN mkdir myCalibre-backend

COPY myCalibre-backend/package*.json ./myCalibre-backend/
RUN cd ./myCalibre-backend && \
    npm ci --only=production

COPY --from=BUILD /usr/src/myCalibre-backend/src/*.js myCalibre-backend/
COPY --from=BUILD /usr/src/myCalibre-backend/src/img/* myCalibre-backend/img/
COPY --from=BUILD /usr/src/myCalibre-backend/src/models/*.js myCalibre-backend/models/
COPY --from=BUILD /usr/src/myCalibre-backend/src/routes/*.js myCalibre-backend/routes/

COPY --from=BUILD /usr/src/myCalibre-backend/src/bin/prepareCache.js myCalibre-backend/bin/
COPY --from=BUILD /usr/src/myCalibre-backend/src/bin/www myCalibre-backend/bin/www.js

# FRONTEND -----
RUN mkdir myCalibre-frontend

COPY --from=BUILD /usr/src/myCalibre-frontend/dist ./myCalibre-frontend/

ENV MONGO_URL=mongodb://192.168.0.128:27017
ENV PATH_BOOKS=/books
ENV PATH_CACHE=/cache
ENV PORT=3000

VOLUME ["/frontend"]
VOLUME ["/books"]
VOLUME ["/cache"]
EXPOSE 3000

CMD mv myCalibre-frontend/* myCalibre-frontend/.htaccess /frontend && node myCalibre-backend/bin/www.js
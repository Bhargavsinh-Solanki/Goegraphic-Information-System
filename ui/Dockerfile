# base image
FROM node:17-buster-slim

# app target location
ENV APP_DIR=/var/opt/gis

# requirements first to use build caching
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}

# copy code
COPY package.json ${APP_DIR}

# run ng serve
RUN npm install

# copy code
COPY . ${APP_DIR}

CMD npm start 
# specify base image that we want to extend
FROM postgis/postgis:14-3.1
ENV APP_DIR /app

# set environment variables that we want to change
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=5425981o
ENV POSTGRES_DB=gis

# install osm2pgsql
RUN apt-get update -y
RUN apt install -y osm2pgsql curl

# create a file to activate the hstore extension
RUN echo 'CREATE EXTENSION IF NOT EXISTS "hstore";' > /docker-entrypoint-initdb.d/activate-hstore.sql


COPY . ${APP_DIR}



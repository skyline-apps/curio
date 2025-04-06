FROM node:22.9-slim

COPY ./src/shared /shared
WORKDIR /shared
RUN npm install

WORKDIR /app

COPY ./src/app/package*.json ./
RUN npm install
COPY ./src/app ./
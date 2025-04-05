FROM node:22.9-slim

WORKDIR /app

COPY ./src/app/package*.json ./
RUN npm install

COPY ./src/app ./
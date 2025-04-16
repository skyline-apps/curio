FROM node:22.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY ./src/app/package*.json ./
RUN npm install
COPY ./src/app ./
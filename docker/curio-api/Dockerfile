FROM node:22.9-slim

RUN apt-get update && apt-get install -y libc++-dev libc++abi-dev ca-certificates libatomic1

COPY ./src/shared /shared
WORKDIR /shared
RUN npm install

WORKDIR /api

COPY ./src/api/package*.json ./
RUN npm install
COPY ./src/api ./
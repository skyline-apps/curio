FROM node:22.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libc++-dev libc++abi-dev ca-certificates libatomic1

COPY ./src/api/package*.json ./
RUN npm install

COPY ./src/api ./
FROM node:22.9-slim

WORKDIR /app

COPY ./src/web/package*.json ./
RUN npm install

COPY ./src/web ./

RUN apk add --no-cache zsh

RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

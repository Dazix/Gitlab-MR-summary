FROM node:13.8.0-buster

WORKDIR /app

COPY . .

RUN npm install

CMD "npm run pack"

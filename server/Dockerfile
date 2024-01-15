FROM node:20
WORKDIR /app
COPY package.json /app
RUN npm install
COPY index.js .
RUN ["npm", "start"]
